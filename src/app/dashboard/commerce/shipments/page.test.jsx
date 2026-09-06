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
    CUSTOMER_LABEL_FOR: actual.CUSTOMER_LABEL_FOR,
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
  stage: "shipped",
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

    fireEvent.change(screen.getByLabelText(/Stage/), { target: { value: "port_ghana" } });
    fireEvent.change(screen.getByLabelText(/When it happened/), { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByText("Save stage"));

    expect(advanceMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "s1", stage: "port_ghana", date: "2026-09-01" }),
      expect.anything(),
    );
  });

  it("lets staff correct a stage backwards, not only advance", () => {
    render(<ShipmentsPage />);
    fireEvent.click(screen.getByText("Edit stage"));

    const select = screen.getByLabelText(/Stage/);
    // Every stage is offered, including ones already passed and the one it is on.
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
    fireEvent.click(screen.getByText(/Move to Arrived at the port in Ghana/));

    expect(advanceMutate).toHaveBeenCalledWith(
      expect.objectContaining({ stage: "port_ghana" }),
      expect.anything(),
    );
  });
});

// Staff could move a batch but never see what they had already recorded on it —
// the dated log existed on the server and nothing rendered it.
describe("Shipments — the batch's own history", () => {
  const withHistory = () => shipment({
    stageHistory: [
      { stage: "production", note: "Deposit paid", date: "2026-03-02T00:00:00Z", updatedBy: { name: "Kofi", role: "staff" } },
      { stage: "shipped", note: "", date: "2026-07-19T00:00:00Z", updatedBy: { name: "Ama", role: "admin" } },
    ],
  });

  it("lists each stage with its note and who recorded it", () => {
    mockShipments.mockReturnValue([withHistory()]);
    render(<ShipmentsPage />);

    fireEvent.click(screen.getByRole("button", { name: /History/i }));

    expect(screen.getAllByText("In production").length).toBeGreaterThan(0);
    expect(screen.getByText(/Deposit paid/).textContent).toMatch(/Kofi/);
    expect(screen.getByText(/by Ama/)).toBeInTheDocument();
  });

  it("shows what each stage told the customer", () => {
    mockShipments.mockReturnValue([withHistory()]);
    render(<ShipmentsPage />);

    fireEvent.click(screen.getByRole("button", { name: /History/i }));

    expect(screen.getByText(/Customer sees: In production/)).toBeInTheDocument();
    expect(screen.getByText(/Customer sees: Shipped/)).toBeInTheDocument();
  });

  it("says so when a batch has not moved yet", () => {
    mockShipments.mockReturnValue([shipment({ stageHistory: [] })]);
    render(<ShipmentsPage />);

    fireEvent.click(screen.getByRole("button", { name: /History/i }));

    expect(screen.getByText(/has not moved since it was created/)).toBeInTheDocument();
  });
});
