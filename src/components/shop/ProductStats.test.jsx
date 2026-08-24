import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductStats from "./ProductStats";
import { formatCount } from "@/lib/shop";

// T48: cards show how many people viewed a product and how many units sold.
// Both figures come from the API — nothing is counted in the browser.
describe("formatCount (T48)", () => {
  it("leaves counts under a thousand exact", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(7)).toBe("7");
    expect(formatCount(999)).toBe("999");
  });

  it("compacts thousands and millions", () => {
    expect(formatCount(1000)).toBe("1k");
    expect(formatCount(1200)).toBe("1.2k");
    expect(formatCount(15000)).toBe("15k");
    expect(formatCount(1300000)).toBe("1.3m");
  });

  it("rolls 999,999 up to a million rather than showing 1000k", () => {
    expect(formatCount(999999)).toBe("1m");
  });

  it("treats missing or nonsense input as zero", () => {
    expect(formatCount(undefined)).toBe("0");
    expect(formatCount(null)).toBe("0");
    expect(formatCount("abc")).toBe("0");
    expect(formatCount(-5)).toBe("0");
  });
});

describe("ProductStats (T48)", () => {
  it("shows both figures when the product has them", () => {
    render(<ProductStats views={1200} sold={34} />);
    expect(screen.getByText(/1\.2k views/)).toBeTruthy();
    expect(screen.getByText(/34 sold/)).toBeTruthy();
  });

  it("renders nothing for a product served by an API without the counters", () => {
    const { container } = render(<ProductStats views={undefined} sold={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing rather than '0 views · 0 sold' for a brand-new product", () => {
    const { container } = render(<ProductStats views={0} sold={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows only the half that has something to say", () => {
    render(<ProductStats views={5} sold={0} />);
    expect(screen.getByText(/5 views/)).toBeTruthy();
    expect(screen.queryByText(/sold/)).toBeNull();
  });

  it("says 'view', not 'views', for a single view", () => {
    render(<ProductStats views={1} sold={0} />);
    expect(screen.getByText(/1 view$/)).toBeTruthy();
  });
});
