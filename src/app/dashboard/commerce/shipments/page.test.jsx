import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// T45 staff flow. The attach step is the one that was missing entirely: the
// endpoint and the hook both existed, but nothing rendered them, so no pre-order
// could ever be put on a batch and every customer's tracking page sat on
// "awaiting shipment" however far the goods had actually travelled.
const advanceMutate = vi.fn();
const attachMutate = vi.fn();
const mockShipments = vi.fn();
const mockOrders = vi.fn();

vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));

vi.mock("@/hooks/queries/useShipments", async () => {
  const actual = await vi.importActual("@/hooks/queries/useShipments");
  return {
    SHIPMENT_STAGES: actual.SHIPMENT_STAGES,
    useShipments: () => ({ data: mockShipments(), isLoading: false }),
    useCreateShipment: () => ({ mutate: vi.fn(), isPending: false }),
    useAdvanceShipment: () => ({ mutate: advanceMutate, isPending: false }),
    useAttachOrdersToShipment: () => ({ mutate: attachMutate, isPending: false }),
  };
});

vi.mock("@/hooks/queries/useOrders", () => ({
  useOrders: () => ({ data: mockOrders() }),
}));

import ShipmentsPage from "./page";

const shipment = (over = {}) => ({
  _id: "s1",
  name: "March iPhone batch",
  reference: "SHP-202609-00001",
  stage: "in_transit",
  containerNumber: "CMAU1234567",
  expectedArrival: "2026-10-12T00:00:00Z",
  waitingLines: 1,
  ...over,
});

const order = (over = {}) => ({
  _id: "o1",
  orderNumber: "EZW-0001",
  customer: { name: "Ama" },
  items: [{ name: "Imported Phone", qty: 1, isPreorder: true, preorderReleasedAt: null, shipment: null }],
  ...over,
});

beforeEach(() => {
  advanceMutate.mockClear();
  attachMutate.mockClear();
  mockShipments.mockReturnValue([shipment()]);
  mockOrders.mockReturnValue([order()]);
});

describe("Shipments — attaching pre-orders to a batch", () => {
  it("lists the pre-orders waiting to be assigned", () => {
    render(<ShipmentsPage />);
    fireEvent.click(screen.getByText("Pre-orders"));

    expect(screen.getByText("EZW-0001")).toBeInTheDocument();
    expect(screen.getByText(/Ama.*Imported Phone/)).toBeInTheDocument();
  });

  it("attaches the ones that were ticked", () => {
    render(<ShipmentsPage />);
    fireEvent.click(screen.getByText("Pre-orders"));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByText(/Attach 1 pre-order/));

    expect(attachMutate).toHaveBeenCalledWith(
      { id: "s1", orderIds: ["o1"] },
      expect.anything(),
    );
  });

  it("says plainly what an unassigned batch means for the customer", () => {
    render(<ShipmentsPage />);
    fireEvent.click(screen.getByText("Pre-orders"));

    expect(screen.getByText(/awaiting shipment/i)).toBeInTheDocument();
  });

  it("does not offer to attach an order already on this batch", () => {
    mockOrders.mockReturnValue([
      order({ items: [{ name: "Imported Phone", qty: 1, isPreorder: true, preorderReleasedAt: null, shipment: "s1" }] }),
    ]);

    render(<ShipmentsPage />);
    fireEvent.click(screen.getByText("Pre-orders"));

    expect(screen.getByText(/Pre-orders on this batch \(1\)/)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
});

describe("Shipments — moving a batch along", () => {
  it("sends the date the stage actually happened, not the click time", () => {
    render(<ShipmentsPage />);
    fireEvent.click(screen.getByText("Edit stage"));

    fireEvent.change(screen.getByLabelText(/Stage/), { target: { value: "arrived_port" } });
    fireEvent.change(screen.getByLabelText(/When it happened/), { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByText("Save stage"));

    expect(advanceMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "s1", stage: "arrived_port", date: "2026-09-01" }),
      expect.anything(),
    );
  });

  it("lets staff correct a stage backwards, not only advance", () => {
    render(<ShipmentsPage />);
    fireEvent.click(screen.getByText("Edit stage"));

    const select = screen.getByLabelText(/Stage/);
    // Every operational stage is offered, including ones already passed.
    expect(within(select).getByText("In production")).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "production" } });
    fireEvent.click(screen.getByText("Save stage"));

    expect(advanceMutate).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "production" }),
      expect.anything(),
    );
  });

  it("keeps the one-click move for the common case", () => {
    render(<ShipmentsPage />);
    fireEvent.click(screen.getByText(/Move to Arrived at port/));

    expect(advanceMutate).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "arrived_port" }),
      expect.anything(),
    );
  });
});
