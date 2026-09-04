import { describe, it, expect } from "vitest";
import {
  attributeLabel,
  variantAttributeGroups,
  findVariantByAttributes,
  isAttributeValueAvailable,
  selectAttributeValue,
  attributeValueImage,
  attributeHasDistinctImages,
  swatchAttributeKey,
  variantsShowImages,
} from "./shop";

// Colour × storage, with one pairing deliberately absent: Blue only came in 256.
const PHONE = [
  { sku: "P-BLA128", attributes: { color: "Black", storage: "128GB" }, stock: 3 },
  { sku: "P-BLA256", attributes: { color: "Black", storage: "256GB" }, stock: 0 },
  { sku: "P-BLU256", attributes: { color: "Blue", storage: "256GB" }, stock: 5 },
];

describe("attributeLabel", () => {
  it("titles a plain key", () => expect(attributeLabel("color")).toBe("Color"));
  it("splits camelCase", () => expect(attributeLabel("screenSize")).toBe("Screen size"));
  it("splits snake_case", () => expect(attributeLabel("shoe_size")).toBe("Shoe size"));
});

describe("variantAttributeGroups", () => {
  it("groups by attribute, keeping declared order and distinct values", () => {
    expect(variantAttributeGroups(PHONE)).toEqual([
      { key: "color", label: "Color", values: ["Black", "Blue"] },
      { key: "storage", label: "Storage", values: ["128GB", "256GB"] },
    ]);
  });

  it("refuses to group variants that describe different attributes", () => {
    // A grid here would invent pairings that were never stocked.
    expect(variantAttributeGroups([
      { sku: "A", attributes: { grade: "Original" } },
      { sku: "B", attributes: { color: "Black", storage: "128GB" } },
    ])).toBeNull();
  });

  it("returns null when any variant has no attributes at all", () => {
    expect(variantAttributeGroups([{ sku: "A", attributes: {} }])).toBeNull();
    expect(variantAttributeGroups([])).toBeNull();
  });

  it("handles a single-attribute product", () => {
    expect(variantAttributeGroups([
      { sku: "A", attributes: { grade: "Original" } },
      { sku: "B", attributes: { grade: "Copy" } },
    ])).toEqual([{ key: "grade", label: "Grade", values: ["Original", "Copy"] }]);
  });
});

describe("findVariantByAttributes", () => {
  it("finds the variant matching every chosen attribute", () => {
    expect(findVariantByAttributes(PHONE, { color: "Blue", storage: "256GB" }).sku).toBe("P-BLU256");
  });

  it("is null while the choice is incomplete or impossible", () => {
    expect(findVariantByAttributes(PHONE, {})).toBeNull();
    expect(findVariantByAttributes(PHONE, { color: "Blue", storage: "128GB" })).toBeNull();
    // Colour chosen, size not — must not resolve, or Add to Cart would arm early.
    expect(findVariantByAttributes(PHONE, { color: "Black" })).toBeNull();
  });
});

describe("isAttributeValueAvailable", () => {
  it("marks a pairing that was never stocked as unavailable", () => {
    // Blue never came in 128GB.
    expect(isAttributeValueAvailable(PHONE, { storage: "128GB" }, "color", "Blue")).toBe(false);
    expect(isAttributeValueAvailable(PHONE, { storage: "256GB" }, "color", "Blue")).toBe(true);
  });

  it("ignores its own key when judging, so the chosen value stays clickable", () => {
    expect(isAttributeValueAvailable(PHONE, { color: "Black", storage: "128GB" }, "color", "Blue")).toBe(false);
  });

  it("counts a 0-stock variant as available — it may still be pre-orderable", () => {
    expect(isAttributeValueAvailable(PHONE, { color: "Black" }, "storage", "256GB")).toBe(true);
  });
});

describe("selectAttributeValue", () => {
  it("keeps the rest of the selection when the pairing exists", () => {
    expect(selectAttributeValue(PHONE, { color: "Black", storage: "256GB" }, "color", "Blue"))
      .toEqual({ color: "Blue", storage: "256GB" });
  });

  it("moves the other attributes rather than dead-ending on an impossible pairing", () => {
    // Blue has no 128GB, so storage follows to one Blue actually comes in.
    expect(selectAttributeValue(PHONE, { color: "Black", storage: "128GB" }, "color", "Blue"))
      .toEqual({ color: "Blue", storage: "256GB" });
  });

  it("leaves a half-made choice half-made, so the shopper picks the rest", () => {
    expect(selectAttributeValue(PHONE, {}, "color", "Black")).toEqual({ color: "Black" });
  });
});


// Variant pictures belong on the swatch you click, not folded into the gallery.
const PHOTOGRAPHED = [
  { sku: "P-BLA128", attributes: { color: "Black", storage: "128GB" }, images: ["/black.png"] },
  { sku: "P-BLA256", attributes: { color: "Black", storage: "256GB" }, images: ["/black.png"] },
  { sku: "P-BLU256", attributes: { color: "Blue", storage: "256GB" }, images: ["/blue.png"] },
];

describe("attributeValueImage", () => {
  it("takes the first variant carrying that value which has a picture", () => {
    expect(attributeValueImage(PHOTOGRAPHED, "color", "Black")).toBe("/black.png");
    expect(attributeValueImage(PHOTOGRAPHED, "color", "Blue")).toBe("/blue.png");
  });

  it("is null when nothing with that value has been photographed", () => {
    expect(attributeValueImage(PHONE, "color", "Black")).toBeNull();
    expect(attributeValueImage(PHOTOGRAPHED, "color", "Green")).toBeNull();
  });
});

describe("attributeHasDistinctImages", () => {
  it("is true for the axis that actually changes the picture", () => {
    expect(attributeHasDistinctImages(PHOTOGRAPHED, "color", ["Black", "Blue"])).toBe(true);
  });

  it("is false for an axis whose values share one picture", () => {
    // Both storages are the same black phone — swatches would be identical.
    expect(attributeHasDistinctImages(PHOTOGRAPHED, "storage", ["128GB", "256GB"])).toBe(false);
  });

  it("is false when nothing is photographed", () => {
    expect(attributeHasDistinctImages(PHONE, "color", ["Black", "Blue"])).toBe(false);
  });
});


// Every variant carries its own photo, so judging each axis on its own gives
// storage swatches too: "128GB" and "256GB" resolve to two different-COLOURED
// phones, and the row implies a colour choice that picking a size never makes.
describe("swatchAttributeKey", () => {
  // The real shape after the placeholder backfill — one distinct image each.
  const REAL = [
    { sku: "A", attributes: { color: "Black", storage: "128GB" }, images: ["/black-128.png"] },
    { sku: "B", attributes: { color: "Blue", storage: "256GB" }, images: ["/blue-256.png"] },
    { sku: "C", attributes: { color: "Black", storage: "512GB" }, images: ["/black-512.png"] },
  ];
  const groups = [
    { key: "color", label: "Color", values: ["Black", "Blue"] },
    { key: "storage", label: "Storage", values: ["128GB", "256GB", "512GB"] },
  ];

  it("picks colour, even though storage also resolves to distinct images", () => {
    // The trap: this is true, and would have put photos on the size row.
    expect(attributeHasDistinctImages(REAL, "storage", ["128GB", "256GB"])).toBe(true);
    expect(swatchAttributeKey(groups, REAL)).toBe("color");
  });

  it("matches British spelling too", () => {
    const g = [{ key: "colour", label: "Colour", values: ["Black", "Blue"] }];
    const v = [
      { sku: "A", attributes: { colour: "Black" }, images: ["/b.png"] },
      { sku: "B", attributes: { colour: "Blue" }, images: ["/u.png"] },
    ];
    expect(swatchAttributeKey(g, v)).toBe("colour");
  });

  it("shows no swatches at all when the product has no colour", () => {
    // A screen assembly sold by grade: the pictures differ only by caption, so
    // thumbnails would be near-identical squares. Text reads better.
    const g = [{ key: "grade", label: "Grade", values: ["Original", "Copy"] }];
    const v = [
      { sku: "A", attributes: { grade: "Original" }, images: ["/o.png"] },
      { sku: "B", attributes: { grade: "Copy" }, images: ["/c.png"] },
    ];
    expect(swatchAttributeKey(g, v)).toBeNull();
  });

  it("shows none when a colour exists but was never photographed", () => {
    const g = [{ key: "color", label: "Color", values: ["Black", "Blue"] }];
    expect(swatchAttributeKey(g, PHONE)).toBeNull();
  });

  it("is null when nothing is photographed", () => {
    expect(swatchAttributeKey(groups, PHONE)).toBeNull();
  });
});


// The mixed-shape fallback list follows the same rule as the grouped rows.
describe("variantsShowImages", () => {
  it("is true for photographed colour variants", () => {
    expect(variantsShowImages(PHOTOGRAPHED)).toBe(true);
  });

  it("is false when the variants are not a colour choice", () => {
    expect(variantsShowImages([
      { sku: "A", attributes: { grade: "Original" }, images: ["/o.png"] },
      { sku: "B", attributes: { grade: "Copy" }, images: ["/c.png"] },
    ])).toBe(false);
  });

  it("is false when a colour exists but nothing was photographed", () => {
    expect(variantsShowImages(PHONE)).toBe(false);
  });

  it("is false for a single colour — there is no choice to picture", () => {
    expect(variantsShowImages([
      { sku: "A", attributes: { color: "Black" }, images: ["/b.png"] },
    ])).toBe(false);
  });
});
