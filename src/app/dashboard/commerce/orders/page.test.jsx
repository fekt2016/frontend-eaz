import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// T28: same fix as the customer-facing orders list — this admin-only
// marketplace orders list also had an inline status `<select>` per row;
// removed in favor of a link to the (already fully-equipped) detail page.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "admin" }, loading: false }),
}));

const order = {
  _id: "o1", orderNumber: "EZW-0001", status: "paid", total: 15000,
  createdAt: "2026-01-05T00:00:00Z", customer: { name: "Ama", phone: "0240000000" },
};

vi.mock("@/hooks/queries/useOrders", () => ({
  useOrders: () => ({ data: [order], isLoading: false }),
}));

import AdminOrdersPage from "./page";

describe("Commerce admin orders list — read-only, links to detail (T28)", () => {
  it("has no inline status select and links to the order detail page", () => {
    render(<AdminOrdersPage />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    const manageLink = screen.getByText("Manage");
    expect(manageLink.closest("a")).toHaveAttribute("href", "/dashboard/commerce/orders/o1");
  });
});
