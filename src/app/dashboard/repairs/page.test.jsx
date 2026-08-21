import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// T22: this page used to show staff/technician a second, overlapping
// repair-jobs view (read-only, unscoped by assignment). Now redirects them
// to their own proper destination — technicians to /dashboard/pos ("My
// Jobs"), staff/admin/superadmin to /dashboard/pos/jobs ("Jobs") — and
// leaves the customer-facing table untouched.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockPush }),
}));

const mockUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser(), loading: false }),
}));

const mockRepairsData = vi.fn(() => []);
vi.mock("@/hooks/queries/useRepairs", () => ({
  useMyRepairs: (opts) => ({ data: opts?.enabled === false ? undefined : mockRepairsData(), isLoading: false }),
}));

import CustomerRepairsPage from "./page";

describe("Repairs page — role-based redirect (T22)", () => {
  beforeEach(() => mockPush.mockClear());

  it("redirects a technician to /dashboard/pos", async () => {
    mockUser.mockReturnValue({ role: "technician" });
    render(<CustomerRepairsPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/pos"));
  });

  it("redirects staff to /dashboard/pos/jobs", async () => {
    mockUser.mockReturnValue({ role: "staff" });
    render(<CustomerRepairsPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/pos/jobs"));
  });

  it("redirects admin to /dashboard/pos/jobs", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    render(<CustomerRepairsPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/pos/jobs"));
  });

  it("redirects superadmin to /dashboard/pos/jobs", async () => {
    mockUser.mockReturnValue({ role: "superadmin" });
    render(<CustomerRepairsPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/pos/jobs"));
  });

  it("does not redirect a customer — shows their own repairs table", () => {
    mockUser.mockReturnValue({ role: "user" });
    mockRepairsData.mockReturnValue([
      { _id: "j1", status: "ready", deviceBrand: "Tecno", deviceModel: "Spark 20", jobNumber: "REP-001", trackingToken: "trk_abc" },
    ]);
    render(<CustomerRepairsPage />);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText("My Repairs")).toBeInTheDocument();
    expect(screen.getByText("Tecno Spark 20")).toBeInTheDocument();
  });
});
