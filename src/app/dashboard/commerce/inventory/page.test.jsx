import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";

// T24: /dashboard/commerce/inventory is now a redirect shim to the merged
// /dashboard/commerce page (mirrors the existing products → inventory shim).
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockPush }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "staff" }, loading: false }),
}));

import InventoryRedirect from "./page";

describe("Inventory redirect shim (T24)", () => {
  it("redirects an authorized staff member to the merged /dashboard/commerce page", async () => {
    render(<InventoryRedirect />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/commerce"));
  });
});
