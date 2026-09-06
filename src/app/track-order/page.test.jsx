import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// The order-number-and-phone lookup is the tracking page reached from the site,
// and it is a different page from /track/order/[trackingNumber]. It showed a
// status badge and a list of items — so a customer who had pre-ordered goods
// still being made in China read "Paid" and learned nothing about where their
// item was.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockResult = vi.fn();
vi.mock("@/hooks/queries/useOrders", () => ({
  useTrackOrder: () => ({ data: mockResult(), isPending: false, mutate: vi.fn() }),
}));

import TrackOrderPage from "./page";

const baseOrder = (over = {}) => ({
  orderNumber: "EZW-0001",
  status: "paid",
  trackingNumber: "EZWTRK-ABC123",
  items: [{ name: "Phone Case", qty: 1, price: 5000 }],
  subtotal: 5000, total: 5000, shippingFee: 0,
  preorder: null,
  ...over,
});

beforeEach(() => mockResult.mockReturnValue(baseOrder()));

describe("Track order lookup — pre-order position", () => {
  it("shows the journey when a line is still waiting on stock", () => {
    mockResult.mockReturnValue(baseOrder({
      items: [{ name: "Imported Phone", qty: 1, price: 500000, isPreorder: true }],
      preorder: {
        stage: "port_ghana",
        label: "Arrived at the port in Ghana",
        origin: "China",
        items: [{ name: "Imported Phone", qty: 1 }],
        history: [
          { stage: "production", label: "In production", date: "2026-07-10T00:00:00Z" },
          { stage: "port_ghana", label: "Arrived at the port in Ghana", date: "2026-09-01T00:00:00Z" },
        ],
      },
    }));

    render(<TrackOrderPage />);

    expect(screen.getAllByText(/Arrived at the port in Ghana/).length).toBeGreaterThan(0);
    expect(screen.getByText(/^10 July 2026 at /)).toBeInTheDocument();
    expect(screen.getByText(/^1 September 2026 at /)).toBeInTheDocument();
  });

  it("draws the road from China before a batch is assigned", () => {
    mockResult.mockReturnValue(baseOrder({
      items: [{ name: "Imported Phone", qty: 1, price: 500000, isPreorder: true }],
      preorder: {
        stage: null,
        label: "Confirmed — awaiting shipment",
        origin: "China",
        items: [{ name: "Imported Phone", qty: 1 }],
        history: [],
      },
    }));

    render(<TrackOrderPage />);

    expect(screen.getByText("Confirmed — awaiting shipment")).toBeInTheDocument();
    expect(screen.getByText("Coming from China")).toBeInTheDocument();
  });

  it("leaves an ordinary order's lookup exactly as it was", () => {
    render(<TrackOrderPage />);

    expect(screen.getByText("EZW-0001")).toBeInTheDocument();
    expect(screen.queryByText(/Pre-order/i)).toBeNull();
  });
});
