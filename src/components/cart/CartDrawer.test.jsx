import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// T38: the cart drawer must fit inside one viewport — header, scrollable items, and
// the subtotal/buttons footer all reachable, with no page scroll behind it.
const mockCart = vi.fn();
vi.mock("@/context/CartContext", () => ({
  useCart: () => mockCart(),
}));

// CartItems renders the line items; the drawer's own layout is what's under test.
vi.mock("./CartItems", () => ({
  default: () => <div data-testid="cart-items">items</div>,
}));

import CartDrawer from "./CartDrawer";

const ITEM = { id: "p1", name: "Widget", price: 1500, qty: 1 };

const cartState = (over = {}) => ({
  items: [ITEM],
  count: 1,
  subtotal: 1500,
  isOpen: true,
  closeCart: vi.fn(),
  ...over,
});

const drawer = () => screen.getByRole("dialog", { name: /shopping cart/i });
const scrollArea = () => screen.getByTestId("cart-items").parentElement;

beforeEach(() => {
  mockCart.mockReturnValue(cartState());
  document.body.style.overflow = "";
});

describe("CartDrawer — fits the viewport (T38)", () => {
  it("caps the drawer at the dynamic viewport height instead of growing with content", () => {
    render(<CartDrawer />);
    const cls = drawer().className;

    expect(cls).toContain("max-h-[100dvh]");
    expect(cls).toContain("flex-col");
    // Pinned top and bottom so height comes from the viewport, not the contents.
    expect(cls).toContain("top-0");
    expect(cls).toContain("bottom-0");
  });

  it("lets the items area shrink and scroll — min-h-0 is the whole fix", () => {
    render(<CartDrawer />);
    const cls = scrollArea().className;

    // Without min-h-0 a flex child defaults to min-height:auto, refuses to shrink,
    // and pushes the footer off-screen instead of scrolling.
    expect(cls).toContain("min-h-0");
    expect(cls).toContain("flex-1");
    expect(cls).toContain("overflow-y-auto");
  });

  it("keeps the header and footer from being squeezed out", () => {
    render(<CartDrawer />);

    const header = screen.getByRole("heading", { name: /your cart/i }).closest("div").parentElement;
    expect(header.className).toContain("shrink-0");

    const footer = screen.getByRole("link", { name: /checkout/i }).parentElement;
    expect(footer.className).toContain("shrink-0");
  });

  it("keeps the footer clear of the iOS home indicator", () => {
    render(<CartDrawer />);
    const footer = screen.getByRole("link", { name: /checkout/i }).parentElement;

    expect(footer.className).toContain("env(safe-area-inset-bottom)");
  });

  it("shows subtotal and both actions when the cart has items", () => {
    render(<CartDrawer />);

    expect(screen.getByText("GH₵15.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /checkout/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue shopping/i })).toBeInTheDocument();
  });

  it("drops the footer when the cart is empty, so the items area owns the height", () => {
    mockCart.mockReturnValue(cartState({ items: [], count: 0, subtotal: 0 }));
    render(<CartDrawer />);

    expect(screen.queryByRole("link", { name: /checkout/i })).not.toBeInTheDocument();
    expect(scrollArea().className).toContain("min-h-0");
  });

  it("locks the page behind the drawer while it is open", () => {
    render(<CartDrawer />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores page scrolling once closed", () => {
    mockCart.mockReturnValue(cartState({ isOpen: false }));
    render(<CartDrawer />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("marks the drawer as a modal dialog for assistive tech", () => {
    render(<CartDrawer />);
    expect(drawer()).toHaveAttribute("aria-modal", "true");
  });
});
