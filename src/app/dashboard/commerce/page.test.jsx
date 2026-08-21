import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// T24: Marketplace (3-card landing page) and Inventory merged into one page
// — /dashboard/commerce now renders inventory directly, with Delivery Zones
// (admin-only, matching the old card's own gate) and Orders as links instead.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser() }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn((path) => {
      if (path.startsWith("/pos/inventory")) return Promise.resolve({ data: [], total: 0 });
      if (path.startsWith("/pos/suppliers")) return Promise.resolve({ data: [] });
      if (path.startsWith("/products")) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    }),
  },
}));

import CommercePage from "./page";

// Waits for PartsTab's initial fetches to settle (loading skeleton gone)
// so later assertions don't race its post-render state updates.
async function renderSettled() {
  render(<CommercePage />);
  await waitFor(() => expect(screen.getByText("No parts found")).toBeInTheDocument());
}

describe("Commerce page — merged Marketplace + Inventory (T24)", () => {
  it("renders inventory content directly, with an Orders link", async () => {
    mockUser.mockReturnValue({ role: "staff" });
    await renderSettled();

    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("Repair Parts")).toBeInTheDocument();
    expect(screen.getByText("Shop Products")).toBeInTheDocument();
    expect(screen.getByText("Orders").closest("a")).toHaveAttribute("href", "/dashboard/commerce/orders");
  });

  it("shows the Delivery Zones link for admin", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    await renderSettled();

    expect(screen.getByText("Delivery Zones").closest("a")).toHaveAttribute("href", "/dashboard/commerce/delivery-zones");
  });

  it("hides the Delivery Zones link for staff (matches the old card's admin-only gate)", async () => {
    mockUser.mockReturnValue({ role: "staff" });
    await renderSettled();

    expect(screen.queryByText("Delivery Zones")).not.toBeInTheDocument();
  });
});
