import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";

// T39: the product detail page stacked description, specs and reviews into one long
// scroll. It should present them as tabs instead.
const mockProduct = vi.fn();
vi.mock("@/hooks/queries/useProducts", () => ({
  useProductBySlug: () => ({ data: mockProduct(), isLoading: false, error: null }),
}));

const mockReviews = vi.fn();
vi.mock("@/hooks/queries/useProductReviews", () => ({
  useProductReviews: () => ({ data: mockReviews(), isLoading: false }),
}));

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ addItem: vi.fn(), openCart: vi.fn() }),
}));

// The reviews panel is exercised by its own component; here we only care that the
// Reviews tab mounts it.
vi.mock("./ProductReviews", () => ({
  default: () => <div data-testid="product-reviews">reviews panel</div>,
}));

import ProductDetail, { summarizeDescription } from "./ProductDetail";

const PRODUCT = {
  _id: "p1",
  slug: "iphone-13",
  name: "iPhone 13",
  price: 450000,
  stock: 5,
  description: "A very long description that used to sit under the price.",
  specs: [
    { label: "Brand", value: "Apple" },
    { label: "Warranty", value: "1 year" },
  ],
  images: ["/x.png"],
};

const tab = (name) => screen.getByRole("tab", { name });

beforeEach(() => {
  mockProduct.mockReturnValue(PRODUCT);
  mockReviews.mockReturnValue({ data: [], total: 12, pages: 1, page: 1 });
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("summarizeDescription (T39 fallback)", () => {
  it("returns the text unchanged when it already fits", () => {
    expect(summarizeDescription("Short and sweet.")).toBe("Short and sweet.");
  });

  it("prefers the opening sentence when the whole text is too long", () => {
    const text = `First sentence here. ${"filler ".repeat(50)}`;
    expect(summarizeDescription(text)).toBe("First sentence here.");
  });

  it("trims on a word boundary when even the first sentence is too long", () => {
    const out = summarizeDescription(`${"word ".repeat(80)}end.`, 50);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(51);
    expect(out).not.toMatch(/\s…$/); // no dangling space before the ellipsis
  });

  it("collapses whitespace and handles empty input", () => {
    expect(summarizeDescription("  a\n\n  b  ")).toBe("a b");
    expect(summarizeDescription("")).toBe("");
    expect(summarizeDescription(undefined)).toBe("");
  });
});

describe("ProductDetail — Description / Specs / Reviews tabs (T39)", () => {
  it("opens on Description, showing the description and not the other panels", () => {
    render(<ProductDetail slug="iphone-13" />);

    expect(tab("Description")).toHaveAttribute("aria-selected", "true");
    // Scope to the panel: the buy column also carries a summary of the same text.
    expect(within(screen.getByRole("tabpanel")).getByText(PRODUCT.description)).toBeInTheDocument();
    expect(screen.queryByTestId("product-reviews")).not.toBeInTheDocument();
    expect(screen.queryByText("Warranty")).not.toBeInTheDocument();
  });

  it("puts the review count in the Reviews tab label", () => {
    render(<ProductDetail slug="iphone-13" />);
    expect(tab("Reviews (12)")).toBeInTheDocument();
  });

  it("switches to Specs and shows the spec table, hiding the description", () => {
    render(<ProductDetail slug="iphone-13" />);

    fireEvent.click(tab("Specs"));

    const panel = screen.getByRole("tabpanel");
    expect(within(panel).getByText("Brand")).toBeInTheDocument();
    expect(within(panel).getByText("Apple")).toBeInTheDocument();
    expect(within(panel).queryByText(PRODUCT.description)).not.toBeInTheDocument();
    expect(tab("Specs")).toHaveAttribute("aria-selected", "true");
  });

  it("switches to Reviews and mounts ProductReviews", () => {
    render(<ProductDetail slug="iphone-13" />);

    fireEvent.click(tab("Reviews (12)"));

    expect(screen.getByTestId("product-reviews")).toBeInTheDocument();
    expect(
      within(screen.getByRole("tabpanel")).queryByText(PRODUCT.description),
    ).not.toBeInTheDocument();
  });

  it("scrolls the panel into view on switch, so a long list doesn't strand the reader", async () => {
    render(<ProductDetail slug="iphone-13" />);

    fireEvent.click(tab("Reviews (12)"));

    // The scroll is deferred to a requestAnimationFrame so it runs after the new
    // panel has painted, hence waitFor rather than a bare assertion.
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });

  it("omits the Specs tab entirely when the product has no specs", () => {
    mockProduct.mockReturnValue({ ...PRODUCT, specs: [] });
    render(<ProductDetail slug="iphone-13" />);

    expect(screen.queryByRole("tab", { name: "Specs" })).not.toBeInTheDocument();
    expect(tab("Description")).toBeInTheDocument();
    expect(tab("Reviews (12)")).toBeInTheDocument();
  });

  it("still renders a Description panel when the product has no description", () => {
    mockProduct.mockReturnValue({ ...PRODUCT, description: "" });
    render(<ProductDetail slug="iphone-13" />);

    expect(screen.getByText(/No description available/i)).toBeInTheDocument();
  });

  it("shows the editor-authored short description in the buy column", () => {
    mockProduct.mockReturnValue({ ...PRODUCT, shortDescription: "Fast phone, great camera." });
    render(<ProductDetail slug="iphone-13" />);

    expect(screen.getByText(/Fast phone, great camera\./)).toBeInTheDocument();
    // The full text still belongs to the tab, not the buy column.
    expect(screen.getByText(PRODUCT.description)).toBeInTheDocument();
  });

  it("falls back to a summary of the description when shortDescription is empty", () => {
    const long = `${"word ".repeat(60)}end.`;
    mockProduct.mockReturnValue({ ...PRODUCT, shortDescription: "", description: long });
    render(<ProductDetail slug="iphone-13" />);

    // Both the buy column and the Description panel start with "word word"; the
    // truncated one is the buy-column summary.
    const truncated = screen.getAllByText(/^word word/).find((el) => el.textContent.includes("…"));
    expect(truncated).toBeDefined();
    expect(truncated.textContent.length).toBeLessThan(long.length);
  });

  it("offers Read more, which opens the Description tab", () => {
    mockProduct.mockReturnValue({ ...PRODUCT, shortDescription: "Just the gist." });
    render(<ProductDetail slug="iphone-13" />);

    fireEvent.click(tab("Reviews (12)"));
    expect(screen.queryByText(PRODUCT.description)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /read more/i }));

    expect(tab("Description")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(PRODUCT.description)).toBeInTheDocument();
  });

  it("omits Read more when the summary is the whole description", () => {
    mockProduct.mockReturnValue({ ...PRODUCT, shortDescription: "", description: "Short enough." });
    render(<ProductDetail slug="iphone-13" />);

    expect(screen.queryByRole("button", { name: /read more/i })).not.toBeInTheDocument();
  });

  // Guards the T39/T35 merge seam: the short-description block and the variant-price
  // line landed on the same conflict hunk, so resolving it the wrong way silently
  // reverts the page to the base price with nothing else failing.
  it("shows the selected variant's price, not the base price (T35)", () => {
    mockProduct.mockReturnValue({
      ...PRODUCT,
      price: 450000,
      variants: [
        { sku: "V-256", attributes: { size: "256GB" }, stock: 3, price: 500000 },
      ],
    });
    render(<ProductDetail slug="iphone-13" />);

    expect(screen.getByText("GH₵4,500.00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "256GB" }));
    expect(screen.getByText("GH₵5,000.00")).toBeInTheDocument();
  });

  it("falls back to the base price when the variant has no price of its own (T35)", () => {
    mockProduct.mockReturnValue({
      ...PRODUCT,
      price: 450000,
      variants: [{ sku: "V-128", attributes: { size: "128GB" }, stock: 3, price: null }],
    });
    render(<ProductDetail slug="iphone-13" />);

    fireEvent.click(screen.getByRole("button", { name: "128GB" }));
    expect(screen.getByText("GH₵4,500.00")).toBeInTheDocument();
  });

  it("wires each tab to its panel for assistive tech", () => {
    render(<ProductDetail slug="iphone-13" />);

    const selected = tab("Description");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("id", selected.getAttribute("aria-controls"));
    expect(panel).toHaveAttribute("aria-labelledby", selected.getAttribute("id"));
  });
});
