import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// T45 — an order whose pre-order line has not been released has no goods behind
// it, so staff must not be able to walk it through packing and delivery. The
// server refuses those moves; this page's job is to say why before the click.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "order1" }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "admin" }, loading: false }),
}));

const statusMutate = vi.fn();
const trackingMutate = vi.fn();
const mockOrder = vi.fn();
vi.mock("@/hooks/queries/useOrders", () => ({
  useOrder: () => ({ data: mockOrder(), isLoading: false }),
  useUpdateOrderStatus: () => ({ mutate: statusMutate, isPending: false }),
  useAddTrackingEvent: () => ({ mutate: trackingMutate, isPending: false }),
}));

import AdminOrderDetailPage from "./page";

const makeOrder = (over = {}) => ({
  _id: "order1", orderNumber: "EZW-0001", status: "paid", createdAt: "2026-01-05T00:00:00Z",
  customer: { name: "Ama", phone: "0244000000" },
  items: [{ _id: "i1", name: "Imported Phone", qty: 1, price: 500000 }],
  subtotal: 500000, total: 500000, trackingHistory: [],
  ...over,
});

const waiting = { _id: "i1", name: "Imported Phone", qty: 1, price: 500000, isPreorder: true, preorderReleasedAt: null };
const released = { ...waiting, preorderReleasedAt: "2026-03-01T00:00:00Z" };

const statusButton = (name) =>
  screen.getAllByRole("button", { name }).find((b) => b.textContent.trim() === name);

beforeEach(() => {
  statusMutate.mockClear();
  trackingMutate.mockClear();
});

describe("Staff order detail — pre-order hold (T45)", () => {
  it("disables the fulfilment stages while a line is waiting", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [waiting] }));
    render(<AdminOrderDetailPage />);

    expect(statusButton("processing")).toBeDisabled();
    expect(statusButton("shipped")).toBeDisabled();
    expect(statusButton("delivered")).toBeDisabled();
  });

  it("leaves cancelling open — a customer may walk away mid-voyage", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [waiting] }));
    render(<AdminOrderDetailPage />);

    expect(statusButton("cancelled")).not.toBeDisabled();
    fireEvent.click(statusButton("cancelled"));
    expect(statusMutate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
      expect.anything(),
    );
  });

  it("says why the stages are closed", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [waiting] }));
    render(<AdminOrderDetailPage />);

    expect(screen.getByText(/waiting on pre-order stock/i)).toBeInTheDocument();
  });

  it("sends a tracking note with no status while held", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [waiting] }));
    render(<AdminOrderDetailPage />);

    fireEvent.change(screen.getByPlaceholderText(/Handed to courier/i), {
      target: { value: "Customer called about the ETA" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add tracking update/i }));

    expect(trackingMutate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "", note: "Customer called about the ETA" }),
      expect.anything(),
    );
  });

  it("opens everything up once the line is released", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [released] }));
    render(<AdminOrderDetailPage />);

    expect(statusButton("processing")).not.toBeDisabled();
    expect(statusButton("shipped")).not.toBeDisabled();
    expect(screen.queryByText(/waiting on pre-order stock/i)).toBeNull();
  });

  it("never holds an ordinary order", () => {
    mockOrder.mockReturnValue(makeOrder());
    render(<AdminOrderDetailPage />);

    expect(statusButton("delivered")).not.toBeDisabled();
  });
});
