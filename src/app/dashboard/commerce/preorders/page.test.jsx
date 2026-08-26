import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T45: the release queue. Releasing is a person's decision, not something a stock
// change triggers — so the page's job is to show what is waiting and let staff act.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: mockUser() }) }));

const mockPreorders = vi.fn();
const mockRelease = vi.fn();
vi.mock("@/hooks/queries/useOrders", () => ({
  usePreorders: () => mockPreorders(),
  useReleasePreorder: () => ({ mutate: mockRelease }),
}));

import PreordersPage from "./page";

const ORDER = {
  _id: "o1",
  orderNumber: "EZW-0001",
  createdAt: "2026-08-01T00:00:00Z",
  customer: { name: "Ama", phone: "0244000000" },
  items: [
    { name: "Imported Phone", qty: 2, price: 500000, isPreorder: true, preorderReleasedAt: null },
    { name: "Case", qty: 1, price: 5000 },
  ],
};

beforeEach(() => {
  mockUser.mockReturnValue({ role: "staff" });
  mockPreorders.mockReturnValue({ data: [ORDER], isLoading: false });
  mockRelease.mockReset();
});

describe("Pre-order queue (T45)", () => {
  it("lists a waiting order with its customer and pre-order lines", () => {
    render(<PreordersPage />);

    expect(screen.getByText("EZW-0001")).toBeInTheDocument();
    expect(screen.getByText(/Ama/)).toBeInTheDocument();
    expect(screen.getByText(/Imported Phone × 2/)).toBeInTheDocument();
    expect(screen.getByText("GH₵10,000.00")).toBeInTheDocument(); // 500000 × 2 pesewas
  });

  it("shows only the lines actually waiting, not the whole order", () => {
    // The in-stock Case on the same order is being shipped normally; it is not
    // what staff are releasing here.
    render(<PreordersPage />);

    expect(screen.queryByText(/Case × 1/)).toBeNull();
  });

  it("releases the order when asked", async () => {
    render(<PreordersPage />);

    fireEvent.click(screen.getByRole("button", { name: /release/i }));

    await waitFor(() => expect(mockRelease).toHaveBeenCalled());
    expect(mockRelease.mock.calls[0][0]).toBe("o1");
  });

  it("surfaces the server's reason when a release is refused", async () => {
    // The commonest case: staff clicked before the stock was actually booked in.
    mockRelease.mockImplementation((id, { onError }) =>
      onError(new Error("Not enough stock to release: Imported Phone.")));

    render(<PreordersPage />);
    fireEvent.click(screen.getByRole("button", { name: /release/i }));

    expect(await screen.findByText(/Not enough stock to release/)).toBeInTheDocument();
  });

  it("says so plainly when nothing is waiting", () => {
    mockPreorders.mockReturnValue({ data: [], isLoading: false });

    render(<PreordersPage />);

    expect(screen.getByText(/no pre-orders waiting on stock/i)).toBeInTheDocument();
  });

  it("renders nothing for a customer who lands on the URL", () => {
    mockUser.mockReturnValue({ role: "user" });

    const { container } = render(<PreordersPage />);

    expect(container.firstChild).toBeNull();
  });
});
