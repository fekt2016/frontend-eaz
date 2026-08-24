import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// T38: the cart thumbnails render via <ProductImage fill>, which next/image lays out
// as `position: absolute; inset: 0`. An absolutely-positioned element sizes against
// its nearest *positioned* ancestor — so with no `relative` on the thumb container the
// image escaped the 64px box and stretched to fill the whole fixed drawer, hiding the
// cart contents behind it. These tests pin the containment.
const mockCart = vi.fn();
vi.mock("@/context/CartContext", () => ({
  useCart: () => mockCart(),
}));

vi.mock("@/components/shop/ProductImage", () => ({
  // A plain <img> stands in for next/image here: the assertions are about the
  // container's classes, and next/image's own layout is not what's under test.
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }) => <img alt={alt} data-testid="thumb" />,
  PRODUCT_PLACEHOLDER: "/images/product-placeholder.svg",
}));

import CartItems from "./CartItems";

const ITEM = {
  lineId: "l1",
  id: "p1",
  slug: "iphone-13",
  name: "iPhone 13",
  category: "Phones",
  image: "/x.png",
  price: 1500,
  qty: 1,
  stock: 5,
};

beforeEach(() => {
  mockCart.mockReturnValue({ items: [ITEM], removeItem: vi.fn(), updateQty: vi.fn() });
});

describe("CartItems — thumbnail containment (T38)", () => {
  it("gives the thumbnail a positioned, fixed-size container", () => {
    render(<CartItems />);
    const box = screen.getByTestId("thumb").parentElement;

    // `relative` is the fix: without it the fill image escapes to the fixed drawer.
    expect(box.className).toContain("relative");
    expect(box.className).toContain("h-16");
    expect(box.className).toContain("w-16");
    // And it must not be allowed to grow or spill.
    expect(box.className).toContain("flex-shrink-0");
    expect(box.className).toContain("overflow-hidden");
  });

  it("keeps the container positioned for parts, which render without a product link", () => {
    mockCart.mockReturnValue({
      items: [{ ...ITEM, slug: "part-123" }],
      removeItem: vi.fn(),
      updateQty: vi.fn(),
    });
    render(<CartItems />);
    const box = screen.getByTestId("thumb").parentElement;

    // The non-link branch is a separate element and regressed independently before.
    expect(box.tagName).toBe("DIV");
    expect(box.className).toContain("relative");
    expect(box.className).toContain("h-16");
  });

  it("still renders the line's name, quantity and line total", () => {
    render(<CartItems />);

    expect(screen.getByText("iPhone 13")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("GH₵15.00")).toBeInTheDocument();
  });

  it("shows the empty state when there is nothing in the cart", () => {
    mockCart.mockReturnValue({ items: [], removeItem: vi.fn(), updateQty: vi.fn() });
    render(<CartItems />);

    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.queryByTestId("thumb")).not.toBeInTheDocument();
  });
});
