import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T34: main product images were a URL-only textarea; now reuses the same
// StringListEditor + Cloudinary UploadButton the variant/gallery fields use.
const mockUpload = vi.fn();
const mockPost = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    upload: (...args) => mockUpload(...args),
    post: (...args) => mockPost(...args),
  },
}));

import ProductForm from "./ProductForm";

function fileInput(container, index = 0) {
  return container.querySelectorAll('input[type="file"]')[index];
}

function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText("e.g. Wooden Dining Table"), {
    target: { value: "Test Product" },
  });
  fireEvent.change(screen.getByPlaceholderText("e.g. Furniture"), {
    target: { value: "Furniture" },
  });
  fireEvent.change(screen.getByPlaceholderText("e.g. 250.00"), {
    target: { value: "10.00" },
  });
}

describe("ProductForm — main images upload (T34)", () => {
  beforeEach(() => {
    mockUpload.mockReset();
  });

  it("uploads a local file for the main images field and submits it in images[]", async () => {
    mockUpload.mockResolvedValue({ data: { url: "https://res.cloudinary.com/demo/main.jpg" } });
    const onSubmit = vi.fn();
    const { container } = render(<ProductForm submitLabel="Create" onSubmit={onSubmit} />);

    fillRequiredFields();

    // First upload button on the page belongs to the main "Images" field.
    const file = new File(["fake"], "main.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput(container, 0), { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText("https://res.cloudinary.com/demo/main.jpg")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Create"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ images: ["https://res.cloudinary.com/demo/main.jpg"] })
    );
  });

  it("keeps a manually-typed URL working alongside upload", async () => {
    const onSubmit = vi.fn();
    render(<ProductForm submitLabel="Create" onSubmit={onSubmit} />);

    fillRequiredFields();

    fireEvent.change(screen.getAllByPlaceholderText("https://res.cloudinary.com/...")[0], {
      target: { value: "https://example.com/manual.jpg" },
    });
    fireEvent.click(screen.getAllByText("Add URL")[0]);

    fireEvent.click(screen.getByText("Create"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ images: ["https://example.com/manual.jpg"] })
    );
  });

  it("preserves an existing product's images exactly when saved untouched", () => {
    const onSubmit = vi.fn();
    const existingImages = [
      "https://res.cloudinary.com/demo/a.jpg",
      "https://res.cloudinary.com/demo/b.jpg",
      "https://res.cloudinary.com/demo/c.jpg",
    ];
    render(
      <ProductForm
        submitLabel="Save"
        onSubmit={onSubmit}
        initial={{
          name: "Existing",
          category: "Furniture",
          price: 1000,
          images: existingImages,
        }}
      />
    );

    // No interaction with the images field at all — just save.
    fireEvent.click(screen.getByText("Save"));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ images: existingImages }));
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("loads existing product images from `initial` and can remove one", () => {
    const onSubmit = vi.fn();
    render(
      <ProductForm
        submitLabel="Save"
        onSubmit={onSubmit}
        initial={{
          name: "Existing",
          category: "Furniture",
          price: 1000,
          images: ["https://res.cloudinary.com/demo/a.jpg", "https://res.cloudinary.com/demo/b.jpg"],
        }}
      />
    );

    expect(screen.getByText("https://res.cloudinary.com/demo/a.jpg")).toBeInTheDocument();
    expect(screen.getByText("https://res.cloudinary.com/demo/b.jpg")).toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText("Remove URL")[0]);
    fireEvent.click(screen.getByText("Save"));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ images: ["https://res.cloudinary.com/demo/b.jpg"] })
    );
  });
});

describe("ProductForm — per-variant pre-order (edit modal)", () => {
  it("renders every variant and lets a single variant be flagged for pre-order", () => {
    const onSubmit = vi.fn();
    render(
      <ProductForm
        submitLabel="Save"
        onSubmit={onSubmit}
        initial={{
          name: "Phone",
          category: "Phones",
          price: 50000,
          variants: [
            { sku: "V1-128", attributes: { storage: "128GB" }, stock: 0 },
            { sku: "V2-256", attributes: { storage: "256GB" }, stock: 3 },
          ],
        }}
      />
    );

    // Every variant is visible for editing.
    expect(screen.getByDisplayValue("V1-128")).toBeInTheDocument();
    expect(screen.getByDisplayValue("V2-256")).toBeInTheDocument();

    // One pre-order toggle per variant.
    const toggles = screen.getAllByText("Pre-order this variant");
    expect(toggles).toHaveLength(2);

    // Flag only the first (0-stock) variant.
    fireEvent.click(toggles[0]);
    fireEvent.click(screen.getByText("Save"));

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.variants[0].preorder.enabled).toBe(true);
    expect(payload.variants[1].preorder.enabled).toBe(false);
  });

  it("pre-fills a variant's pre-order fields when it is already flagged", () => {
    const onSubmit = vi.fn();
    render(
      <ProductForm
        submitLabel="Save"
        onSubmit={onSubmit}
        initial={{
          name: "Phone",
          category: "Phones",
          price: 50000,
          variants: [
            { sku: "V1", attributes: { storage: "128GB" }, stock: 0,
              preorder: { enabled: true, availableFrom: "2026-10-01", note: "ships from abroad", maxQty: 4 } },
          ],
        }}
      />
    );

    fireEvent.click(screen.getByText("Save"));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.variants[0].preorder).toEqual({
      enabled: true,
      availableFrom: "2026-10-01",
      note: "ships from abroad",
      maxQty: 4,
    });
  });
});


// The SKU field derives itself from the product's own details rather than
// waiting on a button — the generator functions shipped in c8753d7 were never
// wired to any UI, so until now the field was purely manual.
describe("ProductForm — automatic SKU fill", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockUpload.mockReset();
  });

  const skuField = () => screen.getByPlaceholderText("e.g. EZW-WOO-001");

  it("fills the SKU from the product name, sending the derived prefix", async () => {
    mockPost.mockResolvedValue({ data: { sku: "EZW-WOO-001" } });
    render(<ProductForm submitLabel="Create" onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Wooden Dining Table"), {
      target: { value: "Wooden Dining Table" },
    });

    await waitFor(
      () => expect(skuField()).toHaveValue("EZW-WOO-001"),
      { timeout: 3000 }
    );
    expect(mockPost).toHaveBeenCalledWith("/products/generate-sku", {
      mode: "product",
      prefix: "EZW-WOO",
    });
  });

  it("never overwrites a SKU the user typed themselves", async () => {
    mockPost.mockResolvedValue({ data: { sku: "EZW-WOO-001" } });
    render(<ProductForm submitLabel="Create" onSubmit={vi.fn()} />);

    fireEvent.change(skuField(), { target: { value: "MY-OWN-SKU" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Wooden Dining Table"), {
      target: { value: "Wooden Dining Table" },
    });

    await new Promise((r) => setTimeout(r, 900));
    expect(skuField()).toHaveValue("MY-OWN-SKU");
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("leaves an existing product's saved SKU alone", async () => {
    mockPost.mockResolvedValue({ data: { sku: "EZW-NEW-009" } });
    render(
      <ProductForm
        submitLabel="Save"
        onSubmit={vi.fn()}
        initial={{ name: "Wooden Dining Table", category: "Furniture", price: 25000, sku: "EZW-WOO-001" }}
      />
    );

    await new Promise((r) => setTimeout(r, 900));
    expect(skuField()).toHaveValue("EZW-WOO-001");
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("fills a variant's SKU from its attributes once the parent SKU exists", async () => {
    mockPost.mockImplementation((_url, body) =>
      Promise.resolve({
        data: { sku: body.mode === "variant" ? "EZW-WOO-001-BLA" : "EZW-WOO-001" },
      })
    );
    render(<ProductForm submitLabel="Create" onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Wooden Dining Table"), {
      target: { value: "Wooden Dining Table" },
    });
    await waitFor(() => expect(skuField()).toHaveValue("EZW-WOO-001"), { timeout: 3000 });

    fireEvent.click(screen.getByText("Add variant"));
    fireEvent.change(screen.getAllByPlaceholderText("Value (e.g. Black)")[0], {
      target: { value: "Black" },
    });

    await waitFor(
      () =>
        expect(screen.getByPlaceholderText("auto-generated from attributes")).toHaveValue(
          "EZW-WOO-001-BLA"
        ),
      { timeout: 3000 }
    );
    expect(mockPost).toHaveBeenCalledWith("/products/generate-sku", {
      mode: "variant",
      parentSku: "EZW-WOO-001",
      suffix: "BLA",
    });
  });
});

// The storefront only splits colour and size into separate rows when every
// variant declares the same attribute keys. Keys are free text here, so "color"
// on one variant and "Color" on the next silently costs the shopper that picker
// — with nothing on the form to say why. These cover the guard.
describe("ProductForm — variant attribute keys", () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockUpload.mockReset();
  });

  function addVariantWith(key, value, index) {
    fireEvent.click(screen.getByText("Add variant"));
    const keys = screen.getAllByPlaceholderText("Key (e.g. color)");
    const values = screen.getAllByPlaceholderText("Value (e.g. Black)");
    fireEvent.change(keys[index], { target: { value: key } });
    fireEvent.change(values[index], { target: { value } });
  }

  const warning = () => screen.queryByText(/don't share the same attributes/i);

  it("offers the keys already used on this product, so the next variant reuses them", () => {
    const { container } = render(<ProductForm submitLabel="Create" onSubmit={vi.fn()} />);
    addVariantWith("storage", "128GB", 0);

    const list = container.querySelector("datalist#variant-attribute-keys");
    expect(list).toBeInTheDocument();
    expect([...list.querySelectorAll("option")].map((o) => o.value)).toContain("storage");
    // And the key inputs actually point at it.
    expect(screen.getAllByPlaceholderText("Key (e.g. color)")[0]).toHaveAttribute("list", "variant-attribute-keys");
  });

  it("stays quiet while every variant declares the same keys", () => {
    render(<ProductForm submitLabel="Create" onSubmit={vi.fn()} />);
    addVariantWith("color", "Black", 0);
    addVariantWith("color", "Blue", 1);
    expect(warning()).not.toBeInTheDocument();
  });

  it("warns when the keys diverge, naming what the shop will do instead", () => {
    render(<ProductForm submitLabel="Create" onSubmit={vi.fn()} />);
    addVariantWith("color", "Black", 0);
    addVariantWith("Color", "Blue", 1);   // capital C — a different key
    expect(warning()).toBeInTheDocument();
  });

  it("does not warn on a single variant — there is no picker to lose yet", () => {
    render(<ProductForm submitLabel="Create" onSubmit={vi.fn()} />);
    addVariantWith("color", "Black", 0);
    expect(warning()).not.toBeInTheDocument();
  });

  it("aligns the keys across variants on request, without touching existing values", () => {
    render(<ProductForm submitLabel="Create" onSubmit={vi.fn()} />);
    addVariantWith("color", "Black", 0);
    fireEvent.click(screen.getByText("Add variant"));
    // Second variant: replace its seeded colour row with a different key.
    const keys = screen.getAllByPlaceholderText("Key (e.g. color)");
    fireEvent.change(keys[1], { target: { value: "storage" } });
    fireEvent.change(screen.getAllByPlaceholderText("Value (e.g. Black)")[1], { target: { value: "128GB" } });
    expect(warning()).toBeInTheDocument();

    fireEvent.click(screen.getByText(/give every variant the same attributes/i));

    // Both keys now present on both variants, and the typed values survive.
    const allKeys = screen.getAllByPlaceholderText("Key (e.g. color)").map((i) => i.value);
    expect(allKeys.filter((k) => k === "color")).toHaveLength(2);
    expect(allKeys.filter((k) => k === "storage")).toHaveLength(2);
    const allValues = screen.getAllByPlaceholderText("Value (e.g. Black)").map((i) => i.value);
    expect(allValues).toContain("Black");
    expect(allValues).toContain("128GB");
  });
});
