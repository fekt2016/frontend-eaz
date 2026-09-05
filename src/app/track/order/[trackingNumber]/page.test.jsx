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
  it("lists the pre-order stages in Tracking History", () => {
    mockTracking.mockReturnValue(base({
      preorder: {
        stage: "in_ghana",
        label: "Arrived in Ghana — clearing customs",
        origin: "China",
        items: [{ name: "iPhone 15 Pro", qty: 1 }],
        history: [
          { stage: "preparing", label: "Preparing with our supplier", date: "2026-06-05T00:00:00Z" },
          { stage: "on_the_way", label: "On its way", date: "2026-07-20T00:00:00Z" },
        ],
      },
    }));

    render(<TrackingDetailPage />);

    expect(screen.getByText("Preparing with our supplier")).toBeInTheDocument();
    expect(screen.getAllByText("On its way").length).toBeGreaterThan(0);
    expect(screen.queryByText(/No tracking updates yet/)).toBeNull();
  });

  it("orders the two journeys together by date", () => {
    mockTracking.mockReturnValue(base({
      history: [{ status: "shipped", note: "Out for delivery", timestamp: "2026-08-01T00:00:00Z" }],
      preorder: {
        stage: "at_shop",
        label: "At our shop — preparing your order",
        origin: "China",
        history: [{ stage: "preparing", label: "Preparing with our supplier", date: "2026-06-05T00:00:00Z" }],
      },
    }));

    render(<TrackingDetailPage />);

    const items = document.querySelectorAll("ol.relative li");
    expect(items).toHaveLength(2);
    // The supplier stage predates the dispatch, so it comes first.
    expect(items[0].textContent).toMatch(/Preparing with our supplier/);
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
