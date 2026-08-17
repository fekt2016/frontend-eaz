import { describe, it, expect } from "vitest";
import { formatGhs, stockBadge, placeholderToPng } from "./shop";

describe("formatGhs", () => {
  it("renders integer pesewas as GH₵ cedis with 2 decimals and thousands separators", () => {
    expect(formatGhs(0)).toBe("GH₵0.00");
    expect(formatGhs(100)).toBe("GH₵1.00");
    expect(formatGhs(4550)).toBe("GH₵45.50");
    expect(formatGhs(65000)).toBe("GH₵650.00");
    expect(formatGhs(123456)).toBe("GH₵1,234.56");
    expect(formatGhs(1250000)).toBe("GH₵12,500.00");
  });

  it("is null/NaN-safe", () => {
    expect(formatGhs(undefined)).toBe("GH₵0.00");
    expect(formatGhs(null)).toBe("GH₵0.00");
    expect(formatGhs("nope")).toBe("GH₵0.00");
  });
});

describe("stockBadge", () => {
  it("flags out of stock", () => {
    expect(stockBadge(0).label).toBe("Out of stock");
    expect(stockBadge(-2).label).toBe("Out of stock");
  });
  it("flags low stock at or below 10", () => {
    expect(stockBadge(1).label).toBe("Only 1 left");
    expect(stockBadge(10).label).toBe("Only 10 left");
  });
  it("reports healthy stock above 10", () => {
    expect(stockBadge(11).label).toBe("In stock");
  });
});

describe("placeholderToPng", () => {
  it("rewrites extension-less placehold.co URLs to their PNG variant", () => {
    expect(placeholderToPng("https://placehold.co/800x600/1e1b4b/ffffff?text=iPhone%2011%20Port")).toBe(
      "https://placehold.co/800x600/1e1b4b/ffffff.png?text=iPhone%2011%20Port"
    );
  });
  it("leaves URLs that already have an extension untouched", () => {
    expect(placeholderToPng("https://placehold.co/800x600/1e1b4b/ffffff.png?text=X")).toBe(
      "https://placehold.co/800x600/1e1b4b/ffffff.png?text=X"
    );
    expect(placeholderToPng("https://placehold.co/600x400.jpg")).toBe("https://placehold.co/600x400.jpg");
  });
  it("passes non-placehold hosts through unchanged", () => {
    expect(placeholderToPng("https://res.cloudinary.com/eaz/image/upload/v1/phone.jpg")).toBe(
      "https://res.cloudinary.com/eaz/image/upload/v1/phone.jpg"
    );
  });
  it("is null-safe", () => {
    expect(placeholderToPng(null)).toBe(null);
    expect(placeholderToPng(undefined)).toBe(undefined);
    expect(placeholderToPng("")).toBe("");
  });
});
