import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// T39: description + specs were a plain stacked block above a full-width
// "Customer Reviews" section below the grid — a long page to scroll through.
// Adds a Description | Reviews(n) tab bar; description+specs live under
// Description, the existing <ProductReviews> (untouched) mounts under
// Reviews. ProductReviews itself is stubbed here — its own behavior isn't
// what this test covers, only the tab-switching wiring around it.
const mockUseProductBySlug = vi.fn();
vi.mock("@/hooks/queries/useProducts", () => ({
  useProductBySlug: (...args) => mockUseProductBySlug(...args),
}));

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({ addItem: vi.fn(), openCart: vi.fn() }),
}));

vi.mock("./ProductReviews", () => ({
  default: ({ product }) => <div data-testid="product-reviews">Reviews for {product.name}</div>,
}));

import ProductDetail from "./ProductDetail";

function baseProduct(overrides = {}) {
  return {
    _id: "p1",
    slug: "test-product",
    name: "Test Product",
    category: "Accessories",
    price: 10000,
    stock: 5,
    images: [],
    description: "A great product description.",
    specs: [{ label: "Weight", value: "200g" }],
    ratingSummary: { average: 4.5, count: 12 },
    ...overrides,
  };
}

function mockLoaded(product) {
  mockUseProductBySlug.mockReturnValue({ data: product, isLoading: false, error: null });
}

describe("ProductDetail — Description/Reviews tabs (T39)", () => {
  beforeEach(() => {
    mockUseProductBySlug.mockReset();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("defaults to the Description tab, showing description + specs and no reviews", () => {
    mockLoaded(baseProduct());
    render(<ProductDetail slug="test-product" />);

    expect(screen.getByText("A great product description.")).toBeInTheDocument();
    expect(screen.getByText("Specifications")).toBeInTheDocument();
    expect(screen.getByText("Weight")).toBeInTheDocument();
    expect(screen.queryByTestId("product-reviews")).not.toBeInTheDocument();
  });

  it("shows the review count in the tab label", () => {
    mockLoaded(baseProduct({ ratingSummary: { average: 4.2, count: 7 } }));
    render(<ProductDetail slug="test-product" />);

    expect(screen.getByText("Reviews (7)")).toBeInTheDocument();
  });

  it("switches to Reviews on click, hiding description/specs and mounting ProductReviews", () => {
    mockLoaded(baseProduct());
    render(<ProductDetail slug="test-product" />);

    fireEvent.click(screen.getByText(/Reviews \(/));

    expect(screen.queryByText("A great product description.")).not.toBeInTheDocument();
    expect(screen.queryByText("Specifications")).not.toBeInTheDocument();
    expect(screen.getByTestId("product-reviews")).toBeInTheDocument();
  });

  it("switches back to Description, unmounting ProductReviews again", () => {
    mockLoaded(baseProduct());
    render(<ProductDetail slug="test-product" />);

    fireEvent.click(screen.getByText(/Reviews \(/));
    expect(screen.getByTestId("product-reviews")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Description"));
    expect(screen.queryByTestId("product-reviews")).not.toBeInTheDocument();
    expect(screen.getByText("A great product description.")).toBeInTheDocument();
  });

  it("scrolls the reviews section into view when switching to Reviews", () => {
    mockLoaded(baseProduct());
    render(<ProductDetail slug="test-product" />);

    fireEvent.click(screen.getByText(/Reviews \(/));

    expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: "start" })
    );
  });

  it("does not render a Specifications block when the product has no specs", () => {
    mockLoaded(baseProduct({ specs: [] }));
    render(<ProductDetail slug="test-product" />);

    expect(screen.queryByText("Specifications")).not.toBeInTheDocument();
  });
});
