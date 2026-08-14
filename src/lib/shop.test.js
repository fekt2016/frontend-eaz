import { describe, it, expect } from "vitest";
import { formatGhs, stockBadge } from "./shop";

describe("formatGhs", () => {
  it("renders integer pesewas as GH₵ cedis with 2 decimals", () => {
    expect(formatGhs(0)).toBe("GH₵ 0.00");
    expect(formatGhs(100)).toBe("GH₵ 1.00");
    expect(formatGhs(4550)).toBe("GH₵ 45.50");
    expect(formatGhs(65000)).toBe("GH₵ 650.00");
  });

  it("is null/NaN-safe", () => {
    expect(formatGhs(undefined)).toBe("GH₵ 0.00");
    expect(formatGhs(null)).toBe("GH₵ 0.00");
    expect(formatGhs("nope")).toBe("GH₵ 0.00");
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
