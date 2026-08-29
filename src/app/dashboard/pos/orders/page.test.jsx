import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

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
vi.mock("@/hooks/queries/useOrders", () => ({
  useOrders: () => ({ data: [shopOrder], isLoading: false }),
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
