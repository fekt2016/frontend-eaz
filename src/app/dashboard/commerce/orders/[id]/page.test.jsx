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
const lineMutate = vi.fn();
const releaseMutate = vi.fn();
const stageMutate = vi.fn();
const mockOrder = vi.fn();
vi.mock("@/hooks/queries/useOrders", () => ({
  useOrder: () => ({ data: mockOrder(), isLoading: false }),
  useUpdateOrderStatus: () => ({ mutate: statusMutate, isPending: false }),
  useAddTrackingEvent: () => ({ mutate: trackingMutate, isPending: false }),
  useUpdatePreorderLine: () => ({ mutate: lineMutate, isPending: false }),
  useReleasePreorder: () => ({ mutate: releaseMutate, isPending: false }),
  useSetPreorderStage: () => ({ mutate: stageMutate, isPending: false }),
}));

const advanceMutate = vi.fn();
const mockBatches = vi.fn(() => []);
vi.mock("@/hooks/queries/useShipments", async () => {
  const actual = await vi.importActual("@/hooks/queries/useShipments");
  return {
    SHIPMENT_STAGES: actual.SHIPMENT_STAGES,
    useAdvanceShipment: () => ({ mutate: advanceMutate, isPending: false }),
    useShipments: () => ({ data: mockBatches(), isLoading: false }),
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
  lineMutate.mockClear();
  releaseMutate.mockClear();
  stageMutate.mockClear();
  mockBatches.mockReturnValue([]);
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
  const journey = {
    source: "batch",
    itemId: "line1",
    stage: "port_ghana",
    stageLabel: "Arrived at the port in Ghana",
    batch: {
      id: "ship1",
      reference: "SHP-202609-00001",
      name: "March iPhone batch",
      containerNumber: "CMAU1234567",
    },
    history: [
      { stage: "production", label: "In production", note: "", date: "2026-03-02T00:00:00Z", updatedBy: "Kofi", customerLabel: "In production" },
      { stage: "port_ghana", label: "Arrived at the port in Ghana", note: "Duties paid", date: "2026-08-14T00:00:00Z", updatedBy: "Ama", customerLabel: "Arrived at the port in Ghana" },
    ],
  };
  const withBatch = () => makeOrder({
    items: [waiting],
    preorder: { journey, expectedArrival: "2026-09-01T00:00:00Z", stage: "port_ghana", label: "Arrived at the port in Ghana", origin: "China", history: [], items: [] },
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
    fireEvent.change(screen.getByLabelText(/^Stage$/i), { target: { value: "at_shop" } });
    fireEvent.click(screen.getByRole("button", { name: /Save stage/i }));

    const [sent] = advanceMutate.mock.calls[0];
    expect(sent).toMatchObject({ id: "ship1", stage: "at_shop" });
    // Stamped server-side when saved — staff record a stage as it happens.
    expect(sent.date).toBeUndefined();
  });

  it("offers to record the first stage on an order that is on no batch", () => {
    mockOrder.mockReturnValue(makeOrder({
      items: [waiting],
      preorder: {
        journey: { source: "order", itemId: "line1", stage: "", stageLabel: "", batch: null, history: [] },
        stage: null, label: "Confirmed — awaiting shipment", origin: "China", history: [], items: [],
      },
    }));
    render(<AdminOrderDetailPage />);

    expect(screen.getByText("This order's own journey")).toBeInTheDocument();
    expect(screen.getAllByText(/Nothing recorded yet/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Record a stage/i })).toBeInTheDocument();
  });

  it("records that stage against the order, not a batch", () => {
    mockOrder.mockReturnValue(makeOrder({
      items: [waiting],
      preorder: {
        journey: { source: "order", itemId: "line1", stage: "", stageLabel: "", batch: null, history: [] },
        stage: null, label: "Confirmed — awaiting shipment", origin: "China", history: [], items: [],
      },
    }));
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /Record a stage/i }));
    fireEvent.change(screen.getByLabelText(/^Stage$/i), { target: { value: "shipped" } });
    fireEvent.click(screen.getByRole("button", { name: /Save stage/i }));

    const [sent] = stageMutate.mock.calls[0];
    expect(sent).toMatchObject({ id: "order1", stage: "shipped" });
    expect(sent.date).toBeUndefined();
    // It must NOT move a batch — no other customer is involved.
    expect(advanceMutate).not.toHaveBeenCalled();
  });
});

// Staff needed a form for the single customer, not just the whole container:
// the one who ordered two instead of three, or whose line went onto the wrong
// batch. Quantity is money on a pre-order paid up front, so the form has to say
// what the change left owing.
describe("Staff order detail — editing the pre-order line (T45)", () => {
  const batches = [
    { _id: "ship1", reference: "SHP-202609-00001", name: "March iPhone batch" },
    { _id: "ship2", reference: "SHP-202610-00002", name: "April batch" },
  ];
  const line = { ...waiting, _id: "line1", shipment: "ship1" };

  const held = () => makeOrder({ items: [line], preorder: { stage: null, label: "Confirmed", origin: "China", history: [], items: [] } });

  it("saves a new quantity for that line", () => {
    mockBatches.mockReturnValue(batches);
    mockOrder.mockReturnValue(held());
    render(<AdminOrderDetailPage />);

    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    expect(lineMutate).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "line1", qty: 3 }),
      expect.anything(),
    );
  });

  it("moves the line to another batch", () => {
    mockBatches.mockReturnValue(batches);
    mockOrder.mockReturnValue(held());
    render(<AdminOrderDetailPage />);

    fireEvent.change(screen.getByLabelText(/On batch/i), { target: { value: "ship2" } });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    expect(lineMutate).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "line1", shipment: "ship2" }),
      expect.anything(),
    );
  });

  it("takes the line off a batch entirely", () => {
    mockBatches.mockReturnValue(batches);
    mockOrder.mockReturnValue(held());
    render(<AdminOrderDetailPage />);

    fireEvent.change(screen.getByLabelText(/On batch/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    expect(lineMutate).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "line1", shipment: null }),
      expect.anything(),
    );
  });

  it("says what a quantity change left the customer owing", () => {
    mockBatches.mockReturnValue(batches);
    mockOrder.mockReturnValue(held());
    lineMutate.mockImplementation((_vars, opts) => opts.onSuccess({ meta: { difference: 150000 } }));
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    expect(screen.getByText(/GH₵1,500.00 is still to collect/)).toBeInTheDocument();
  });

  it("says what is owed back when the quantity drops", () => {
    mockBatches.mockReturnValue(batches);
    mockOrder.mockReturnValue(held());
    lineMutate.mockImplementation((_vars, opts) => opts.onSuccess({ meta: { difference: -50000 } }));
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    expect(screen.getByText(/GH₵500.00 is owed back .* issue a refund/)).toBeInTheDocument();
  });

  it("releases the order from here, once the goods are in Ghana", () => {
    mockBatches.mockReturnValue(batches);
    mockOrder.mockReturnValue(makeOrder({
      items: [line],
      preorder: {
        journey: { source: "order", itemId: "line1", stage: "port_ghana", stageLabel: "At the port", batch: null, history: [] },
        stage: "port_ghana", label: "At the port", origin: "China", history: [], items: [],
      },
    }));
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /Release now/i }));

    expect(releaseMutate).toHaveBeenCalledWith("order1", expect.anything());
  });

  it("is not offered once the line is released", () => {
    mockBatches.mockReturnValue(batches);
    mockOrder.mockReturnValue(makeOrder({ items: [released] }));
    render(<AdminOrderDetailPage />);

    expect(screen.queryByText("Pre-order lines")).toBeNull();
  });
});

// Recording "Arrived at our warehouse" releases the order, so the form has to
// say so before it is saved — it is not an undoable stage like the others.
describe("Staff order detail — the last stage releases (T45)", () => {
  const heldOnItsOwn = () => makeOrder({
    items: [waiting],
    preorder: {
      journey: { source: "order", itemId: "line1", stage: "shipped", stageLabel: "Shipped", batch: null, history: [] },
      stage: "shipped", label: "Shipped", origin: "China", history: [], items: [],
    },
  });

  it("warns before the stage that releases", () => {
    mockOrder.mockReturnValue(heldOnItsOwn());
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /Update stage/i }));
    expect(screen.queryByText(/Saving this releases the order/)).toBeNull();

    fireEvent.change(screen.getByLabelText(/^Stage$/i), { target: { value: "at_shop" } });

    expect(screen.getByText(/Saving this releases the order/)).toBeInTheDocument();
  });
});

// Hiding the fulfilment controls on a held pre-order took the only cancel
// button with them — trapping a customer who wants out while their goods are
// still months away. The server always allowed it.
describe("Staff order detail — cancelling a held pre-order (T45)", () => {
  const heldOrder = () => makeOrder({ items: [waiting] });

  it("offers cancel even though the status section is hidden", () => {
    mockOrder.mockReturnValue(heldOrder());
    render(<AdminOrderDetailPage />);

    expect(screen.queryByText("Update Status")).toBeNull();
    expect(screen.getByRole("button", { name: /Cancel order/i })).toBeInTheDocument();
  });

  it("asks before doing something terminal", () => {
    mockOrder.mockReturnValue(heldOrder());
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /Cancel order/i }));

    expect(statusMutate).not.toHaveBeenCalled();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    // And says plainly that it does not return the customer's money.
    expect(screen.getByText(/cannot be undone/i).textContent).toMatch(/does not return their money/i);
  });

  it("cancels once confirmed", () => {
    mockOrder.mockReturnValue(heldOrder());
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /Cancel order/i }));
    fireEvent.click(screen.getByRole("button", { name: /Yes, cancel this order/i }));

    expect(statusMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "order1", status: "cancelled" }),
      expect.anything(),
    );
  });

  it("lets staff back out of the confirmation", () => {
    mockOrder.mockReturnValue(heldOrder());
    render(<AdminOrderDetailPage />);

    fireEvent.click(screen.getByRole("button", { name: /Cancel order/i }));
    fireEvent.click(screen.getByRole("button", { name: /Keep it/i }));

    expect(statusMutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Cancel order/i })).toBeInTheDocument();
  });

  it("does not duplicate cancel once the order is released", () => {
    mockOrder.mockReturnValue(makeOrder({ items: [released] }));
    render(<AdminOrderDetailPage />);

    // The ordinary status row is back, and it already carries cancelled.
    expect(screen.getByText("Update Status")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel order/i })).toBeNull();
    expect(statusButton("cancelled")).toBeInTheDocument();
  });
});

// Delivered and cancelled are terminal on the server — canTransition refuses
// every move out of them — so a status control on such an order is a row of
// buttons that can only fail.
describe("Staff order detail — a settled order (T45)", () => {
  it("hides the status controls once delivered", () => {
    mockOrder.mockReturnValue(makeOrder({ status: "delivered" }));
    render(<AdminOrderDetailPage />);

    expect(screen.queryByText("Update Status")).toBeNull();
    expect(statusButton("processing")).toBeUndefined();
    expect(screen.getByText(/the journey is over/i)).toBeInTheDocument();
  });

  it("hides them on a cancelled order too", () => {
    mockOrder.mockReturnValue(makeOrder({ status: "cancelled" }));
    render(<AdminOrderDetailPage />);

    expect(screen.queryByText("Update Status")).toBeNull();
  });

  it("takes the tracking form away too — nothing more is recorded", () => {
    mockOrder.mockReturnValue(makeOrder({ status: "delivered" }));
    render(<AdminOrderDetailPage />);

    expect(screen.queryByText("Add tracking update")).toBeNull();
    expect(screen.queryByPlaceholderText(/Handed to courier/i)).toBeNull();
    expect(screen.queryByLabelText(/^Status$/i)).toBeNull();
    // The history is still there — it is the record.
    expect(screen.getByText("Tracking history")).toBeInTheDocument();
  });

  it("stops linking the tracking number at a form that is gone", () => {
    mockOrder.mockReturnValue(makeOrder({ status: "delivered", trackingNumber: "EZWTRK-123" }));
    render(<AdminOrderDetailPage />);

    const anchors = [...document.querySelectorAll('a[href="#tracking-update"]')];
    expect(anchors).toHaveLength(0);
    expect(screen.getByText("EZWTRK-123")).toBeInTheDocument();
  });

  it("leaves a live order's controls alone", () => {
    mockOrder.mockReturnValue(makeOrder({ status: "processing" }));
    render(<AdminOrderDetailPage />);

    expect(screen.getByText("Update Status")).toBeInTheDocument();
    expect(statusButton("shipped")).not.toBeDisabled();
    expect(screen.getByPlaceholderText(/Handed to courier/i)).toBeInTheDocument();
  });
});

// Releasing hands goods over, so the server refuses it while they are abroad.
// The button must not invite the click that can only be refused.
describe("Staff order detail — release waits for Ghana (T45)", () => {
  const atStage = (stage) => makeOrder({
    items: [{ ...waiting, _id: "line1" }],
    preorder: {
      journey: { source: "order", itemId: "line1", stage, stageLabel: stage, batch: null, history: [] },
      stage, label: stage, origin: "China", history: [], items: [],
    },
  });

  it("is disabled while the goods are still abroad", () => {
    mockOrder.mockReturnValue(atStage("shipped"));
    render(<AdminOrderDetailPage />);

    expect(screen.getByRole("button", { name: /Release now/i })).toBeDisabled();
    expect(screen.getByText(/Not until the goods are in Ghana/i)).toBeInTheDocument();
  });

  it("is disabled when nothing has been recorded yet", () => {
    mockOrder.mockReturnValue(atStage(""));
    render(<AdminOrderDetailPage />);

    expect(screen.getByRole("button", { name: /Release now/i })).toBeDisabled();
  });

  it("opens up once it reaches the port", () => {
    mockOrder.mockReturnValue(atStage("port_ghana"));
    render(<AdminOrderDetailPage />);

    const button = screen.getByRole("button", { name: /Release now/i });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(releaseMutate).toHaveBeenCalledWith("order1", expect.anything());
  });
});
