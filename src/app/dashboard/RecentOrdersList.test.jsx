import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

import { RecentOrdersList } from "./page";

describe("Dashboard RecentOrdersList (recent-orders wiring)", () => {
  it("shows skeleton placeholders while loading", () => {
    const { container } = render(<RecentOrdersList shopOrders={[]} partOrders={[]} loading={true} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
    expect(screen.queryByText("No orders yet.")).not.toBeInTheDocument();
  });

  it("shows an empty state once loaded with no orders of either kind", () => {
    render(<RecentOrdersList shopOrders={[]} partOrders={[]} loading={false} />);
    expect(screen.getByText("No orders yet.")).toBeInTheDocument();
  });

  it("renders shop orders with order number, item count, total, and status", () => {
    const shopOrders = [{
      _id: "o1", orderNumber: "EZW-0001", status: "paid", total: 15000, createdAt: "2026-01-05T00:00:00Z",
      items: [{ qty: 2 }, { qty: 1 }],
    }];
    render(<RecentOrdersList shopOrders={shopOrders} partOrders={[]} loading={false} />);

    expect(screen.getByText("EZW-0001")).toBeInTheDocument();
    expect(screen.getByText(/3 item\(s\)/)).toBeInTheDocument();
    expect(screen.getByText("GH₵150.00")).toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();
    expect(screen.getByText("EZW-0001").closest("a")).toHaveAttribute("href", "/dashboard/commerce/orders/o1");
  });

  it("renders online repair-part orders distinctly from shop orders", () => {
    const partOrders = [{
      _id: "po1", partName: "iPhone 13 Screen", status: "pending", createdAt: "2026-01-06T00:00:00Z",
      job: { jobNumber: "REP-0009" },
    }];
    render(<RecentOrdersList shopOrders={[]} partOrders={partOrders} loading={false} />);

    expect(screen.getByText("iPhone 13 Screen")).toBeInTheDocument();
    expect(screen.getByText(/REP-0009/)).toBeInTheDocument();
    expect(screen.getByText("iPhone 13 Screen").closest("a")).toHaveAttribute("href", "/dashboard/pos/orders");
  });

  it("falls back to a generic label when a part order has no partName or job", () => {
    const partOrders = [{ _id: "po2", status: "pending", createdAt: "2026-01-06T00:00:00Z" }];
    render(<RecentOrdersList shopOrders={[]} partOrders={partOrders} loading={false} />);

    expect(screen.getByText("Part order")).toBeInTheDocument();
    expect(screen.getByText(/Repair part · — ·/)).toBeInTheDocument();
  });

  it("renders both shop and part orders together, not empty", () => {
    const shopOrders = [{ _id: "o1", orderNumber: "EZW-0001", status: "shipped", total: 5000, createdAt: "2026-01-01", items: [] }];
    const partOrders = [{ _id: "po1", partName: "Battery", status: "paid", createdAt: "2026-01-02", job: null }];
    render(<RecentOrdersList shopOrders={shopOrders} partOrders={partOrders} loading={false} />);

    expect(screen.getByText("EZW-0001")).toBeInTheDocument();
    expect(screen.getByText("Battery")).toBeInTheDocument();
    expect(screen.queryByText("No orders yet.")).not.toBeInTheDocument();
  });
});
