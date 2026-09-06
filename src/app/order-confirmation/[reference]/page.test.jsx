import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// T62: the order carries a tracking number from the moment it is created, but the
// confirmation page never showed it — the customer had to remember the order number
// and fill in the lookup form. For a pre-order they will follow for weeks, that is
// the difference between the T45 journey being reachable and not.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockOrder = vi.fn();
vi.mock("@/hooks/queries/useOrders", () => ({
  useOrderByReference: () => ({ data: mockOrder(), isLoading: false, error: null }),
}));

import OrderConfirmationPage from "./page";

const baseOrder = (over = {}) => ({
  _id: "o1",
  orderNumber: "EZW-0001",
  status: "paid",
  trackingNumber: "EZWTRK-ABC123",
  items: [{ name: "Phone Case", qty: 1, price: 5000 }],
  subtotal: 5000, deliveryFee: 0, total: 5000,
  customer: { name: "Ama", phone: "0244000000" },
  ...over,
});

beforeEach(() => mockOrder.mockReturnValue(baseOrder()));

describe("Order confirmation — tracking number (T62)", () => {
  it("shows the tracking number and links straight to the journey", () => {
    render(<OrderConfirmationPage params={{ reference: "ORD_1" }} />);

    expect(screen.getByText("EZWTRK-ABC123")).toBeInTheDocument();
    expect(screen.getByText(/Follow your order/).closest("a"))
      .toHaveAttribute("href", "/track/order/EZWTRK-ABC123");
  });

  it("points the orders button at the customer's order list", () => {
    render(<OrderConfirmationPage params={{ reference: "ORD_1" }} />);

    expect(screen.getByText("View My Orders").closest("a"))
      .toHaveAttribute("href", "/dashboard/orders");
  });

  it("sets the expectation when the order contains a pre-order", () => {
    mockOrder.mockReturnValue(baseOrder({
      items: [{ name: "Imported Phone", qty: 1, price: 500000, isPreorder: true }],
    }));

    render(<OrderConfirmationPage params={{ reference: "ORD_1" }} />);

    expect(screen.getByText(/we'll email you as soon as it reaches our shop/i)).toBeInTheDocument();
  });

  it("shows where the pre-ordered goods actually are, not just a promise", () => {
    // The copy alone said "we'll email you"; it never said the item is being made
    // in China. The journey belongs on the page the customer lands on after paying.
    mockOrder.mockReturnValue(baseOrder({
      items: [{ name: "Imported Phone", qty: 1, price: 500000, isPreorder: true }],
      preorder: {
        stage: "shipped",
        label: "Shipped — on its way to Ghana",
        origin: "China",
        items: [{ name: "Imported Phone", qty: 1 }],
        history: [{ stage: "production", label: "In production", date: "2026-07-10T00:00:00Z" }],
      },
    }));

    render(<OrderConfirmationPage params={{ reference: "ORD_1" }} />);

    expect(screen.getAllByText(/Shipped/).length).toBeGreaterThan(0);
    expect(screen.getByText("Coming from China")).toBeInTheDocument();
    expect(screen.getByText("10 July 2026")).toBeInTheDocument();
  });

  it("says nothing about pre-orders for an ordinary order", () => {
    render(<OrderConfirmationPage params={{ reference: "ORD_1" }} />);
    expect(screen.queryByText(/pre-order/i)).toBeNull();
  });

  it("renders no tracking link at all for an order with no tracking number", () => {
    // Orders placed before tracking numbers existed; the backfill covered the live
    // ones, but the page must not render a link to /track/order/undefined.
    mockOrder.mockReturnValue(baseOrder({ trackingNumber: undefined }));

    render(<OrderConfirmationPage params={{ reference: "ORD_1" }} />);

    expect(screen.queryByText(/Follow your order/)).toBeNull();
    document.querySelectorAll("a").forEach((a) => {
      expect(a.getAttribute("href")).not.toContain("undefined");
    });
    // The orders button is unconditional — it never depended on tracking.
    expect(screen.getByText("View My Orders").closest("a"))
      .toHaveAttribute("href", "/dashboard/orders");
  });
});
