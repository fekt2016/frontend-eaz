// SKU prefix/suffix derivation for the one-click generator.
//
// Product SKUs use the house style EZW-<BRAND>-<NNN> (e.g. EZW-IPH-004); the
// numeric suffix is chosen server-side for uniqueness. Variant SKUs are
// <parent>-<attr suffix> (e.g. EZW-IPH-004-NAT128), where the suffix is built
// from the variant's attributes. These functions only build the *base/suffix* —
// uniqueness is guaranteed by the API when it numbers the result.

const STOP_WORDS = new Set(["the", "a", "an", "of", "and", "pro", "max", "plus", "mini", "new", "for", "with"]);

// A 3-letter code from a product name, e.g. "Apple iPhone 15" → "APP",
// "Samsung Galaxy S24" → "SAM". Falls back to `fallback` when nothing usable.
export function skuPrefixCode(name, fallback = "PRD") {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !STOP_WORDS.has(w.toLowerCase()));
  const src = words.slice(0, 2).join("");
  const code = src.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3);
  return code || fallback;
}

// "EZW-<CODE>" prefix for a product SKU, given the product name.
export function productSkuBase(name) {
  return `EZW-${skuPrefixCode(name)}`;
}

// Suffix for a variant SKU, built from its attribute values to match the house
// style (colour + capacity), e.g. { color: "Natural", storage: "128GB" } → "NAT128".
export function variantSkuSuffix(attributes = {}) {
  let letters = "";
  let digits = "";
  for (const value of Object.values(attributes || {})) {
    const s = String(value || "");
    letters += s.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 3);
    digits += s.replace(/\D/g, "").slice(0, 3);
  }
  const out = (letters.slice(0, 6) + digits.slice(0, 4)).slice(0, 10);
  return out || "";
}
