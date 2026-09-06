import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// The tracking detail page carried two journeys that never met: the order's own
// delivery events, and the pre-order's shipment stages. Read separately, the
// delivery timeline is empty for a pre-order until the goods land — so someone
// who paid weeks ago was told "no tracking updates yet".
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ trackingNumber: "EZWTRK-ABC123" }) }));

const mockTracking = vi.fn();
vi.mock("@/hooks/queries/useTracking", () => ({
  useOrderTracking: () => ({ data: mockTracking(), isLoading: false, error: null }),
}));

import TrackingDetailPage from "./page";

const base = (over = {}) => ({
  trackingNumber: "EZWTRK-ABC123",
  orderNumber: "EZW-0001",
  status: "processing",
  createdAt: "2026-06-01T00:00:00Z",
  history: [],
  latestEvent: null,
  preorder: null,
  ...over,
});

beforeEach(() => mockTracking.mockReturnValue(base()));

describe("Tracking detail — pre-order in the timeline", () => {
  // The batch writes its stages into the order's own tracking history, so they
  // arrive in `history` carrying a `preorderStage` — not as a second array.
  it("lists the pre-order stages in Tracking History", () => {
    mockTracking.mockReturnValue(base({
      history: [
        { status: "paid", note: "In production", timestamp: "2026-06-05T00:00:00Z", preorderStage: "production" },
        { status: "paid", note: "Shipped — on its way to Ghana", timestamp: "2026-07-20T00:00:00Z", preorderStage: "shipped" },
      ],
      preorder: {
        stage: "port_ghana",
        label: "Arrived at the port in Ghana",
        origin: "China",
        items: [{ name: "iPhone 15 Pro", qty: 1 }],
        history: [
          { stage: "production", label: "In production", date: "2026-06-05T00:00:00Z" },
          { stage: "shipped", label: "Shipped — on its way to Ghana", date: "2026-07-20T00:00:00Z" },
        ],
      },
    }));

    render(<TrackingDetailPage />);

    expect(screen.getAllByText("In production").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Shipped/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/No tracking updates yet/)).toBeNull();
  });

  it("orders the two journeys together by date", () => {
    mockTracking.mockReturnValue(base({
      history: [
        { status: "shipped", note: "Out for delivery", timestamp: "2026-08-01T00:00:00Z" },
        { status: "paid", note: "In production", timestamp: "2026-06-05T00:00:00Z", preorderStage: "production" },
      ],
      preorder: {
        stage: "at_shop",
        label: "At our warehouse — preparing your order",
        origin: "China",
        history: [{ stage: "production", label: "In production", date: "2026-06-05T00:00:00Z" }],
      },
    }));

    render(<TrackingDetailPage />);

    const items = document.querySelectorAll("ol.relative li");
    expect(items).toHaveLength(2);
    // The supplier stage predates the dispatch, so it comes first.
    expect(items[0].textContent).toMatch(/In production/);
    expect(items[1].textContent).toMatch(/Out for delivery/);
  });

  it("does not tell a paid pre-order it is awaiting payment", () => {
    mockTracking.mockReturnValue(base({
      preorder: {
        stage: null,
        label: "Confirmed — awaiting shipment",
        origin: "China",
        history: [],
      },
    }));

    render(<TrackingDetailPage />);

    expect(screen.queryByText(/awaiting payment/)).toBeNull();
    expect(screen.getByText(/we'll log each stage here as it happens/)).toBeInTheDocument();
  });

  it("leaves an ordinary order's timeline exactly as it was", () => {
    mockTracking.mockReturnValue(base({
      history: [{ status: "shipped", note: "Out for delivery", timestamp: "2026-08-01T00:00:00Z" }],
    }));

    render(<TrackingDetailPage />);

    expect(screen.getByText("Out for delivery")).toBeInTheDocument();
    expect(document.querySelectorAll("ol.relative li")).toHaveLength(1);
  });
});

// The stages used to be merged in for display only, from a second array. Now the
// batch writes them into the order's own history, and reading both would list
// every stage twice.
describe("Tracking detail — one source for the journey", () => {
  it("does not double up a stage that is in both payloads", () => {
    mockTracking.mockReturnValue(base({
      history: [
        { status: "paid", note: "Shipped — on its way to Ghana", timestamp: "2026-07-20T00:00:00Z", preorderStage: "shipped" },
      ],
      preorder: {
        stage: "shipped",
        label: "Shipped — on its way to Ghana",
        origin: "China",
        history: [{ stage: "shipped", label: "Shipped — on its way to Ghana", date: "2026-07-20T00:00:00Z" }],
      },
    }));

    render(<TrackingDetailPage />);

    expect(document.querySelectorAll("ol.relative li")).toHaveLength(1);
  });
});
