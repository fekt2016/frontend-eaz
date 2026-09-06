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

const advanceMutate = vi.fn();
vi.mock("@/hooks/queries/useShipments", async () => {
  const actual = await vi.importActual("@/hooks/queries/useShipments");
  return {
    SHIPMENT_STAGES: actual.SHIPMENT_STAGES,
    useAdvanceShipment: () => ({ mutate: advanceMutate, isPending: false }),
  };
});

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
  screen.queryAllByRole("button", { name }).find((b) => b.textContent.trim() === name);

beforeEach(() => {
  statusMutate.mockClear();
  trackingMutate.mockClear();
  advanceMutate.mockClear();
});

describe("Staff order detail — pre-order hold (T45)", () => {
  it("hides the status controls entirely while a line is waiting", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [waiting] }));
    render(<AdminOrderDetailPage />);

    expect(screen.queryByText("Update Status")).toBeNull();
    for (const s of ["processing", "shipped", "delivered", "cancelled"]) {
      expect(statusButton(s)).toBeUndefined();
    }
  });

  it("hides the tracking-update form too", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [waiting] }));
    render(<AdminOrderDetailPage />);

    expect(screen.queryByText("Add tracking update")).toBeNull();
    expect(screen.queryByPlaceholderText(/Handed to courier/i)).toBeNull();
  });

  it("says why they are gone, and what brings them back", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [waiting] }));
    render(<AdminOrderDetailPage />);

    expect(screen.getByText(/Held until release/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting on pre-order stock/i)).toBeInTheDocument();
  });

  it("brings both sections back once the line is released", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [released] }));
    render(<AdminOrderDetailPage />);

    expect(screen.getByText("Update Status")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Handed to courier/i)).toBeInTheDocument();
    expect(statusButton("processing")).not.toBeDisabled();
    expect(screen.queryByText(/Held until release/i)).toBeNull();
  });

  it("never holds an ordinary order", () => {
    mockOrder.mockReturnValue(makeOrder());
    render(<AdminOrderDetailPage />);

    expect(screen.getByText("Update Status")).toBeInTheDocument();
    expect(statusButton("delivered")).not.toBeDisabled();
  });
});

// Support works from the customer's order, so the batch's internal journey — and
// the control that moves it — have to be here, not only on the batch list.
describe("Staff order detail — the shipping batch (T45)", () => {
  const batch = {
    id: "ship1",
    reference: "SHP-202609-00001",
    name: "March iPhone batch",
    containerNumber: "CMAU1234567",
    stage: "port_ghana",
    stageLabel: "Arrived at the port in Ghana",
    history: [
      { stage: "production", label: "In production", note: "", date: "2026-03-02T00:00:00Z", updatedBy: "Kofi", customerLabel: "In production" },
      { stage: "port_ghana", label: "Arrived at the port in Ghana", note: "Duties paid", date: "2026-08-14T00:00:00Z", updatedBy: "Ama", customerLabel: "Arrived at the port in Ghana" },
    ],
  };
  const withBatch = () => makeOrder({
    items: [waiting],
    preorder: { batch, expectedArrival: "2026-09-01T00:00:00Z", stage: "port_ghana", label: "Arrived at the port in Ghana", origin: "China", history: [], items: [] },
  });

  it("shows the batch's internal stages, notes and who entered them", () => {
    mockOrder.mockReturnValue(withBatch());
    render(<AdminOrderDetailPage />);

    expect(screen.getAllByText("In production").length).toBeGreaterThan(0);
    expect(screen.getByText(/Duties paid/).textContent).toMatch(/Ama/);
    expect(screen.getByText("SHP-202609-00001")).toBeInTheDocument();
    expect(screen.getByText(/CMAU1234567/)).toBeInTheDocument();
  });

  it("shows what the customer was told at each stage", () => {
    mockOrder.mockReturnValue(withBatch());
    render(<AdminOrderDetailPage />);

    expect(screen.getByText(/Customer sees: Arrived at the port in Ghana/)).toBeInTheDocument();
  });

  it("moves the batch from here, dated, without leaving the order", () => {
    mockOrder.mockReturnValue(withBatch());
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /Update stage/i }));
    fireEvent.change(screen.getByDisplayValue("Arrived at the port in Ghana"), { target: { value: "at_shop" } });
    fireEvent.change(screen.getByLabelText(/When it happened/i), { target: { value: "2026-08-20" } });
    fireEvent.click(screen.getByRole("button", { name: /Save stage/i }));

    expect(advanceMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ship1", stage: "at_shop", date: "2026-08-20" }),
      expect.anything(),
    );
  });

  it("says where to attach an order that is on no batch at all", () => {
    mockOrder.mockReturnValue(makeOrder({
      items: [waiting],
      preorder: { stage: null, label: "Confirmed — awaiting shipment", origin: "China", history: [], items: [] },
    }));
    render(<AdminOrderDetailPage />);

    expect(screen.getByText(/Not on a shipment batch yet/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Update stage/i })).toBeNull();
  });
});
