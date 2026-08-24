import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// Staff sales tracking on the Sell page. Staff see their own sales; admin also gets a
// per-cashier breakdown and can filter the recent list to one person. The scoping
// itself is enforced server-side — these tests cover what the component *shows*.

const mockAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({ useAuth: () => mockAuth() }));

const mockSummary = vi.fn();
const mockList = vi.fn();
vi.mock("@/hooks/queries/usePosSales", () => ({
  usePosSalesSummary: () => mockSummary(),
  usePosSalesList: (...args) => mockList(...args),
}));

import SalesTracker from "./SalesTracker";

const MINE = { count: 3, revenue: 20000, todayCount: 1, todayRevenue: 12000 };

const BY_STAFF = [
  { cashierId: "u1", name: "Ama", revenue: 20000, count: 2, todayRevenue: 12000, todayCount: 1 },
  { cashierId: "u2", name: "Kofi", revenue: 5000, count: 1, todayRevenue: 0, todayCount: 0 },
];

const SALES = [
  { _id: "s1", saleNumber: "SAL-202608-00002", total: 12000, paymentMethod: "cash", createdAt: "2026-08-24T10:00:00Z", cashier: { name: "Ama" } },
  { _id: "s2", saleNumber: "SAL-202608-00001", total: 8000, paymentMethod: "momo", createdAt: "2026-08-23T10:00:00Z", cashier: { name: "Ama" } },
];

function setup({ role = "staff", summary, list } = {}) {
  mockAuth.mockReturnValue({ user: { role, name: "Ama" } });
  mockSummary.mockReturnValue(
    summary ?? { data: { scope: role === "admin" ? "all" : "own", mine: MINE, byStaff: role === "admin" ? BY_STAFF : undefined }, isLoading: false, isError: false },
  );
  mockList.mockReturnValue(list ?? { data: { data: SALES, total: 2 }, isLoading: false });
}

beforeEach(() => {
  mockAuth.mockReset();
  mockSummary.mockReset();
  mockList.mockReset();
});

describe("SalesTracker — staff view", () => {
  it("titles the section 'My sales' for staff", () => {
    setup({ role: "staff" });
    render(<SalesTracker />);
    expect(screen.getByRole("heading", { name: /my sales/i })).toBeInTheDocument();
  });

  it("shows today's and all-time takings, formatted with formatGhs", () => {
    setup({ role: "staff" });
    render(<SalesTracker />);

    // Scope to the stat tiles — the same amounts also appear in the recent-sales list.
    const today = screen.getByText("Today").closest("div");
    expect(within(today).getByText("GH₵120.00")).toBeInTheDocument();
    expect(within(today).getByText("1 sale")).toBeInTheDocument(); // singular

    const allTime = screen.getByText("All time").closest("div");
    expect(within(allTime).getByText("GH₵200.00")).toBeInTheDocument();
    expect(within(allTime).getByText("3 sales")).toBeInTheDocument();
  });

  it("does not show the per-staff breakdown to staff", () => {
    setup({ role: "staff" });
    render(<SalesTracker />);
    expect(screen.queryByText(/sales by staff/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Kofi")).not.toBeInTheDocument();
  });

  it("omits the cashier name from rows for staff — they are all theirs", () => {
    setup({ role: "staff" });
    render(<SalesTracker />);
    const row = screen.getByText("SAL-202608-00002").closest("li");
    expect(within(row).queryByText(/Ama/)).not.toBeInTheDocument();
  });

  it("never asks the server for another cashier's sales", () => {
    setup({ role: "staff" });
    render(<SalesTracker />);
    expect(mockList).toHaveBeenCalledWith({ limit: 10 });
  });
});

describe("SalesTracker — admin view", () => {
  it("titles the section 'Sales' and lists every staff member", () => {
    setup({ role: "admin" });
    render(<SalesTracker />);

    expect(screen.getByRole("heading", { name: /^sales$/i })).toBeInTheDocument();
    expect(screen.getByText("Ama")).toBeInTheDocument();
    expect(screen.getByText("Kofi")).toBeInTheDocument();
  });

  it("shows each staff member's today and all-time totals", () => {
    setup({ role: "admin" });
    render(<SalesTracker />);

    const kofi = screen.getByText("Kofi").closest("tr");
    expect(within(kofi).getByText("GH₵50.00")).toBeInTheDocument();
    expect(within(kofi).getByText("GH₵0.00")).toBeInTheDocument();
  });

  it("filters the recent list to one cashier when View is clicked", () => {
    setup({ role: "admin" });
    render(<SalesTracker />);

    const kofi = screen.getByText("Kofi").closest("tr");
    fireEvent.click(within(kofi).getByRole("button", { name: /view/i }));

    expect(mockList).toHaveBeenLastCalledWith({ limit: 10, cashierId: "u2" });
  });

  it("clears the filter when the same row is clicked again", () => {
    setup({ role: "admin" });
    render(<SalesTracker />);

    const kofi = screen.getByText("Kofi").closest("tr");
    fireEvent.click(within(kofi).getByRole("button", { name: /view/i }));
    fireEvent.click(within(screen.getByText("Kofi").closest("tr")).getByRole("button", { name: /clear/i }));

    expect(mockList).toHaveBeenLastCalledWith({ limit: 10 });
  });

  it("shows who rang up each recent sale", () => {
    setup({ role: "admin" });
    render(<SalesTracker />);
    const row = screen.getByText("SAL-202608-00002").closest("li");
    expect(within(row).getByText(/Ama/)).toBeInTheDocument();
  });
});

describe("SalesTracker — states", () => {
  it("shows a loading state while the summary is in flight", () => {
    setup({ role: "staff", summary: { data: undefined, isLoading: true, isError: false } });
    render(<SalesTracker />);
    expect(screen.getByText(/loading sales/i)).toBeInTheDocument();
  });

  it("shows an error state rather than blank figures", () => {
    setup({ role: "staff", summary: { data: undefined, isLoading: false, isError: true } });
    render(<SalesTracker />);
    expect(screen.getByText(/could not load sales/i)).toBeInTheDocument();
  });

  it("shows an empty state when nothing has been sold", () => {
    setup({
      role: "staff",
      summary: { data: { scope: "own", mine: { count: 0, revenue: 0, todayCount: 0, todayRevenue: 0 } }, isLoading: false, isError: false },
      list: { data: { data: [], total: 0 }, isLoading: false },
    });
    render(<SalesTracker />);

    expect(screen.getByText(/no sales yet/i)).toBeInTheDocument();
    expect(screen.getAllByText("GH₵0.00").length).toBeGreaterThan(0);
  });
});
