import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CartDrawer from "./CartDrawer";

// T38: the items container was `flex-1 overflow-y-auto` with no `min-h-0`.
// Flex items default to `min-height: auto`, so without it the container
// never actually caps its height and scrolls internally — it just grows
// past the viewport with the items list, pushing the subtotal/checkout
// footer outside the drawer's fixed top-0/bottom-0 bounds where it's
// clipped and unreachable. jsdom has no real layout engine, so this can't
// assert pixels stay on-screen — it locks in the specific classes that fix
// (and would catch someone accidentally reverting) the actual bug.
const mockUseCart = vi.fn();
vi.mock("@/context/CartContext", () => ({
  useCart: (...args) => mockUseCart(...args),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

function cartState(overrides = {}) {
  return {
    items: [],
    count: 0,
    subtotal: 0,
    isOpen: true,
    closeCart: vi.fn(),
    removeItem: vi.fn(),
    updateQty: vi.fn(),
    ...overrides,
  };
}

describe("CartDrawer — fits within the viewport (T38)", () => {
  it("caps the drawer height to the dynamic viewport and lets only the items area scroll", () => {
    mockUseCart.mockReturnValue(cartState({
      items: [{ lineId: "a", slug: "widget", name: "Widget", price: 1000, qty: 1, image: "" }],
      count: 1,
      subtotal: 1000,
    }));
    const { container } = render(<CartDrawer />);

    const aside = container.querySelector('[role="dialog"]');
    expect(aside.className).toContain("max-h-[100dvh]");

    const itemsContainer = screen.getByText("Widget").closest("ul").parentElement;
    expect(itemsContainer.className).toContain("flex-1");
    expect(itemsContainer.className).toContain("min-h-0");
    expect(itemsContainer.className).toContain("overflow-y-auto");
  });

  it("keeps the header and footer from being compressed by the scrollable items area", () => {
    mockUseCart.mockReturnValue(cartState({
      items: [{ lineId: "a", slug: "widget", name: "Widget", price: 1000, qty: 1, image: "" }],
      count: 1,
      subtotal: 1000,
    }));
    render(<CartDrawer />);

    const header = screen.getByText("Your Cart").closest("div").parentElement;
    expect(header.className).toContain("flex-shrink-0");

    const checkoutLink = screen.getByText("Checkout");
    const footer = checkoutLink.closest("div");
    expect(footer.className).toContain("flex-shrink-0");
  });

  it("always renders the subtotal and checkout buttons when the cart has items", () => {
    mockUseCart.mockReturnValue(cartState({
      items: [{ lineId: "a", slug: "widget", name: "Widget", price: 1000, qty: 2, image: "" }],
      count: 2,
      subtotal: 2000,
    }));
    render(<CartDrawer />);

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Checkout")).toBeInTheDocument();
    expect(screen.getByText("Continue Shopping")).toBeInTheDocument();
  });

  it("hides the footer entirely when the cart is empty (no dangling empty subtotal row)", () => {
    mockUseCart.mockReturnValue(cartState({ items: [] }));
    render(<CartDrawer />);

    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument();
    expect(screen.queryByText("Checkout")).not.toBeInTheDocument();
  });
});
