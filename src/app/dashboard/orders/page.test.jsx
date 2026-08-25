import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// T28: the orders list used to have an inline status dropdown + "Update"
// button per row for admin/staff — all editing should live on the detail
// page now, with the list staying read-only and just linking there.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser() }),
}));

const order = {
  _id: "o1", orderNumber: "EZW-0001", status: "paid", total: 15000,
  createdAt: "2026-01-05T00:00:00Z", customer: { name: "Ama" },
};

const mockOrdersData = vi.fn(() => [order]);
vi.mock("@/hooks/queries/useOrders", () => ({
  useOrders: () => ({ data: mockOrdersData(), isLoading: false }),
  useMyOrders: () => ({ data: mockOrdersData(), isLoading: false }),
}));

import CustomerOrdersPage from "./page";

describe("Orders list — read-only, links to detail page (T28)", () => {
  it("admin sees no inline status controls, only a Manage link", () => {
    mockUser.mockReturnValue({ role: "admin" });
    render(<CustomerOrdersPage />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Update")).not.toBeInTheDocument();
    const link = screen.getByText("Manage");
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard/orders/o1");
  });

  it("customer sees a View link, not Manage, and no status controls", () => {
    mockUser.mockReturnValue({ role: "user" });
    render(<CustomerOrdersPage />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    const link = screen.getByText("View");
    expect(link.closest("a")).toHaveAttribute("href", "/dashboard/orders/o1");
  });
});

// The "Visit Shop" button was removed from the page header on request. The empty
// state keeps its own "Browse the Shop" link — that one is the whole point of the
// empty state, and is a different control.
describe("Shop Orders header — no Visit Shop button", () => {
  it("does not render a Visit Shop button", () => {
    mockUser.mockReturnValue({ role: "admin" });

    render(<CustomerOrdersPage />);

    expect(screen.queryByText("Visit Shop")).not.toBeInTheDocument();
  });
});
