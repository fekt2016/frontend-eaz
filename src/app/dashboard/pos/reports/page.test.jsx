import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// T32: staff see only their own report; admin/superadmin get a staff picker
// + per-staff activity breakdown. This tests the page's role-driven wiring
// (Header copy, picker visibility, staffId passed to the query hook) — the
// actual scoping/aggregation is verified server-side in
// backend-eaz/tests/reportsAnalytics.test.js.
let mockRole = "staff";
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: mockRole } }),
}));

const mockUseReportsAnalytics = vi.fn();
vi.mock("@/hooks/queries/useReports", () => ({
  useReportsAnalytics: (...args) => mockUseReportsAnalytics(...args),
}));

import ReportsPage from "./page";

function emptyKpi(overrides = {}) {
  return {
    revenue: { total: 0, repair: 0, posSales: 0, shopOrders: 0 },
    orders: { total: 0, paid: 0, pending: 0, cancelled: 0, aov: 0 },
    repairs: { total: 0, open: 0, completed: 0, cancelled: 0, partsUsed: 0, revenue: 0 },
    inventory: { partCount: 0, productCount: 0, units: 0, lowStock: 0, outOfStock: 0, valueSell: 0, valueCost: 0 },
    payments: { count: 0 },
    expenses: { total: 0, netProfit: 0, canSeeExpenses: false },
    ...overrides,
  };
}

function baseData(scope) {
  return {
    scope,
    previous: null,
    kpi: emptyKpi(),
    revenueSeries: [],
    paymentMethods: [],
    orders: { byStatus: [], recent: [] },
    repairs: { byStatus: [], topParts: [] },
    shipping: { byStatus: [] },
    topProducts: [],
    lowStockParts: [],
    expenseByCategory: [],
  };
}

function mockHook(data) {
  mockUseReportsAnalytics.mockReturnValue({
    data, isPending: false, isFetching: false, isError: false, error: null, refetch: vi.fn(),
  });
}

describe("Reports page — staff scope (T32)", () => {
  beforeEach(() => {
    mockUseReportsAnalytics.mockReset();
  });

  it("shows 'My Report' for a staff caller and never renders the staff picker", () => {
    mockRole = "staff";
    mockHook(baseData({ staffId: "u1", staffName: "Ama", isOwnReport: true, staffList: [] }));

    render(<ReportsPage />);

    expect(screen.getByText("My Report")).toBeInTheDocument();
    expect(screen.queryByLabelText("Staff member")).not.toBeInTheDocument();
  });

  it("shows the staff picker for admin, defaulting to shop-wide", () => {
    mockRole = "admin";
    mockHook(baseData({
      staffId: null, staffName: null, isOwnReport: false,
      staffList: [{ _id: "u1", name: "Ama", role: "staff" }, { _id: "u2", name: "Kofi", role: "staff" }],
    }));

    render(<ReportsPage />);

    expect(screen.getByText("Reports & Analytics")).toBeInTheDocument();
    const picker = screen.getByLabelText("Staff member");
    expect(picker).toBeInTheDocument();
    expect(picker.value).toBe("");

    // Passed staffId is undefined/falsy for the initial shop-wide call.
    const [, staffIdArg] = mockUseReportsAnalytics.mock.calls[0];
    expect(staffIdArg).toBe("");
  });

  it("re-queries with the selected staffId when admin picks a staff member", () => {
    mockRole = "admin";
    mockHook(baseData({
      staffId: null, staffName: null, isOwnReport: false,
      staffList: [{ _id: "u1", name: "Ama", role: "staff" }],
    }));

    render(<ReportsPage />);
    fireEvent.change(screen.getByLabelText("Staff member"), { target: { value: "u1" } });

    const lastCall = mockUseReportsAnalytics.mock.calls.at(-1);
    expect(lastCall[1]).toBe("u1");
  });

  it("shows a personalized header when admin has a staff member selected", () => {
    mockRole = "admin";
    mockHook(baseData({
      staffId: "u1", staffName: "Ama", isOwnReport: false,
      staffList: [{ _id: "u1", name: "Ama", role: "staff" }],
    }));

    render(<ReportsPage />);
    expect(screen.getByText("Report — Ama")).toBeInTheDocument();
  });

  it("blocks technicians with a friendly stop and never calls the hook enabled", () => {
    mockRole = "technician";
    mockHook(baseData({ staffId: null, staffName: null, isOwnReport: false, staffList: [] }));

    render(<ReportsPage />);

    expect(screen.getByText("Reports are not available for technicians")).toBeInTheDocument();
    const [, , options] = mockUseReportsAnalytics.mock.calls[0];
    expect(options.enabled).toBe(false);
  });
});
