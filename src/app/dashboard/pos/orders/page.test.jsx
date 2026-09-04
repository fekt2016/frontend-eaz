import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// T28: this page rendered shop/part orders as cards; rebuilt as a table like the
// other admin order lists.
// T112 (owner, 2026-08-29): the Part Orders tab is gone, and the list no longer
// mutates anything — every row links to /dashboard/commerce/orders/:id, which
// already owns status changes and tracking events. The inline <select> that used
// to live here is removed, so the list and the detail page cannot disagree.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "staff" }, loading: false }),
}));

const shopOrder = {
  _id: "so1", orderNumber: "EZW-0001", status: "paid", total: 15000,
  createdAt: "2026-01-05T00:00:00Z", customer: { name: "Ama", phone: "0240000000" },
  items: [{ qty: 2 }],
};
const partOrder = {
  _id: "po1", status: "pending", partName: "Screen", quantity: 1,
  amountPesewas: 5000, orderType: "single", customerName: "Kofi", customerPhone: "0244000000",
  createdAt: "2026-01-06T00:00:00Z", job: null,
};

const mockUpdateShop = vi.fn();
const mockUpdatePart = vi.fn();
const mockRelease = vi.fn();
// The page now asks for a view: {} for all orders, { preorder: "pending" } for
// the release queue that used to be its own page.
const mockUseOrders = vi.fn(() => ({ data: [shopOrder], isLoading: false }));
vi.mock("@/hooks/queries/useOrders", () => ({
  useOrders: (...args) => mockUseOrders(...args),
  useReleasePreorder: () => ({ mutate: mockRelease, isPending: false }),
  useUpdateOrderStatus: () => ({ mutate: mockUpdateShop, isPending: false }),
}));
vi.mock("@/hooks/queries/usePosDashboard", () => ({
  usePartOrders: () => ({ data: [partOrder], isLoading: false }),
  useUpdatePosOrderStatus: () => ({ mutate: mockUpdatePart, isPending: false }),
}));

import PosOrdersPage from "./page";

describe("POS orders page — table layout (T28)", () => {
  it("renders shop orders as a table, not cards", () => {
    render(<PosOrdersPage />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("EZW-0001")).toBeInTheDocument();
    expect(screen.getByText("GH₵150.00")).toBeInTheDocument();
  });

  it("shows the status read-only and links out to the detail page", () => {
    render(<PosOrdersPage />);

    // No inline control — the detail page owns updates now.
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("paid")).toBeInTheDocument();

    const view = screen.getByRole("link", { name: /view/i });
    expect(view).toHaveAttribute("href", "/dashboard/commerce/orders/so1");
  });

  it("no longer offers a Part Orders tab", () => {
    render(<PosOrdersPage />);

    expect(screen.queryByText("Part Orders")).not.toBeInTheDocument();
    expect(screen.queryByText("Shop Orders")).not.toBeInTheDocument();
  });
});

// The release queue used to be /dashboard/commerce/preorders — a second
// implementation of "list orders" that had drifted: no search, no pagination,
// against an endpoint capped at 10, so with twelve people waiting two were
// invisible. It is a filter and a sort of this list plus one button.
const waitingOrder = {
  _id: "so2", orderNumber: "EZW-0002", status: "paid", total: 29500,
  createdAt: "2026-01-02T00:00:00Z", customer: { name: "Kwame", phone: "0241111111" },
  items: [{ name: "AirPods Pro 2", qty: 1, isPreorder: true }],
};
const releasedOrder = {
  _id: "so3", orderNumber: "EZW-0003", status: "processing", total: 29500,
  createdAt: "2026-01-03T00:00:00Z", customer: { name: "Esi", phone: "0242222222" },
  items: [{ name: "AirPods Pro 2", qty: 1, isPreorder: true, preorderReleasedAt: "2026-01-04T00:00:00Z" }],
};

describe("POS orders page — pre-orders in the list", () => {
  beforeEach(() => {
    mockRelease.mockClear();
    mockUseOrders.mockReturnValue({ data: [shopOrder, waitingOrder, releasedOrder], isLoading: false });
  });

  it("marks a waiting pre-order apart from one already released", () => {
    render(<PosOrdersPage />);
    // Two states, because only one is actionable.
    expect(screen.getByText("Pre-order")).toBeInTheDocument();
    expect(screen.getByText("Pre-order released")).toBeInTheDocument();
  });

  it("offers Release only on an order still waiting on stock", () => {
    render(<PosOrdersPage />);
    const buttons = screen.getAllByRole("button", { name: /release/i });
    expect(buttons).toHaveLength(1);

    fireEvent.click(buttons[0]);
    expect(mockRelease).toHaveBeenCalledWith("so2", expect.anything());
  });

  it("asks the server for the queue when the Awaiting release view is chosen", () => {
    render(<PosOrdersPage />);
    // Default view is every order.
    expect(mockUseOrders.mock.calls[0][0].preorder).toBeUndefined();

    fireEvent.click(screen.getByRole("tab", { name: /awaiting release/i }));
    // The sort matters as much as the filter: oldest first, so the customer who
    // has waited longest is served first. That is the server's job, not a
    // client-side re-sort of a page of results.
    expect(mockUseOrders).toHaveBeenLastCalledWith(
      expect.objectContaining({ preorder: "pending" }), expect.anything(),
    );
  });

  it("says nothing is waiting rather than showing the shop's empty state", () => {
    mockUseOrders.mockReturnValue({ data: [], isLoading: false });
    render(<PosOrdersPage />);
    fireEvent.click(screen.getByRole("tab", { name: /awaiting release/i }));
    expect(screen.getByText(/nothing waiting on stock/i)).toBeInTheDocument();
  });
});
