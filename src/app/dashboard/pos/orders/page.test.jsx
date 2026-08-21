import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// T28: this page rendered shop/part orders as cards; rebuilt as a table
// like the other admin order lists. The inline status <select> stays here
// (unlike the other two order lists) since there's no per-order detail page
// to move it to.
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

  it("still allows updating a shop order's status inline", () => {
    render(<PosOrdersPage />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "shipped" } });
    expect(mockUpdateShop).toHaveBeenCalledWith(
      { id: "so1", status: "shipped" },
      expect.any(Object),
    );
  });

  it("switches to the Part Orders tab and renders that table too", () => {
    render(<PosOrdersPage />);

    fireEvent.click(screen.getByText("Part Orders"));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Screen")).toBeInTheDocument();
    expect(screen.getByText("GH₵50.00")).toBeInTheDocument();
  });
});
