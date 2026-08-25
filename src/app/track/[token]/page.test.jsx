import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/context/CartContext";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...rest }) => <img src={src} alt={alt} {...rest} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({ api: { get: (...a) => mockGet(...a), post: vi.fn() } }));

let searchParamValue = null;
vi.mock("next/navigation", () => ({
  useParams: () => ({ token: "trk_abc123" }),
  useSearchParams: () => ({ get: () => searchParamValue }),
}));

import TrackRepairPage from "./page";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CartProvider>
        <TrackRepairPage />
      </CartProvider>
    </QueryClientProvider>
  );
}

describe("Track repair page (order tracking)", () => {
  beforeEach(() => {
    mockGet.mockReset();
    searchParamValue = null;
    window.localStorage.clear();
  });

  it("shows a loading spinner while the job is being fetched", async () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderPage();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows a not-found message when the token doesn't match a job", async () => {
    mockGet.mockRejectedValueOnce(new Error("We couldn't find a repair for that link."));
    renderPage();
    expect(await screen.findByText("Repair not found")).toBeInTheDocument();
    expect(screen.getByText("We couldn't find a repair for that link.")).toBeInTheDocument();
  });

  it("renders the job number, device, fault, and status badge once loaded", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        jobNumber: "REP-2026-0042",
        device: "iPhone 13",
        faultDescription: "Cracked screen",
        status: "repairing",
        dropoff: "bring",
      },
    });
    renderPage();

    expect(await screen.findByText("REP-2026-0042")).toBeInTheDocument();
    expect(screen.getByText("iPhone 13")).toBeInTheDocument();
    expect(screen.getByText("Cracked screen")).toBeInTheDocument();
    expect(screen.getByText("Repairing")).toBeInTheDocument(); // JOB_STATUS label
  });

  it("maps each job status to its display label", async () => {
    mockGet.mockResolvedValueOnce({
      data: { jobNumber: "REP-1", status: "waiting_for_parts", dropoff: "bring" },
    });
    renderPage();
    expect(await screen.findByText("Waiting for Parts")).toBeInTheDocument();
  });

  it("shows the payment-received banner when ?paid=1 is present", async () => {
    searchParamValue = "1";
    mockGet.mockResolvedValueOnce({ data: { jobNumber: "REP-2", status: "received", dropoff: "bring" } });
    renderPage();
    expect(await screen.findByText(/Payment received/)).toBeInTheDocument();
  });

  it("falls back to the 'received' badge for an unrecognized status", async () => {
    mockGet.mockResolvedValueOnce({ data: { jobNumber: "REP-3", status: "some_future_status", dropoff: "bring" } });
    renderPage();
    await waitFor(() => expect(screen.getByText("REP-3")).toBeInTheDocument());
    expect(screen.getByText("Device Received")).toBeInTheDocument();
  });
});

// T41: the part-order cart ("Parts for this repair" -> "Add to order") mixed
// float-GHS (unitPriceGhs) with the rest of the app's integer-pesewas
// convention, and displayed with raw `GH₵{...}` interpolation instead of
// formatGhs — no comma grouping, no forced 2 decimals. This never touched
// what a customer is actually charged (submitOrder sends only
// {partId, quantity}; the backend re-prices from Part server-side) — it's a
// cart-state/display correctness fix.
describe("Track repair page — part-order cart uses pesewas + formatGhs (T41)", () => {
  function mockJobWithOrderablePart(pricePesewas = 12345) {
    mockGet.mockImplementation((url) => {
      if (url.startsWith("/track/") && !url.includes("/parts") && !url.includes("/orders")) {
        return Promise.resolve({
          data: {
            jobNumber: "REP-T41",
            device: "iPhone 13",
            faultDescription: "Cracked screen",
            status: "received",
            dropoff: "bring",
            parts: [{ id: "part-1", name: "Screen Assembly", quantity: 1, pricePesewas }],
          },
        });
      }
      if (url.startsWith("/track/parts")) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });
  }

  it("formats the part-order cart line, subtotal, and total via formatGhs (not raw GH₵{float})", async () => {
    // A whole-cedi price is the clearest demonstration of the old bug: raw
    // `GH₵{pesewas/100}` string interpolation drops the decimal places
    // entirely for a round number (renders "GH₵150", not "GH₵150.00").
    mockJobWithOrderablePart(15000); // GH₵150.00
    renderPage();

    const addButton = await screen.findByText("Add to order");
    fireEvent.click(addButton);
    await screen.findByText("Subtotal"); // cart summary panel has rendered

    // No shipping (dropoff: "bring"), so cart line, subtotal, and total all
    // read the same value — plus the "Parts for this repair" line above the
    // cart, which shows the same price independently.
    const matches = screen.getAllByText("GH₵150.00");
    expect(matches.length).toBe(4);
  });

  it("computes the total as subtotal + shipping in whole pesewas, no float round-trip", async () => {
    // A price chosen so a float-GHS round-trip (pesewas/100 then *100 back)
    // is exactly where floating point drops a cent — regression guard for
    // the original `partsSubtotalGhs * 100 + shippingPesewas` bug.
    mockJobWithOrderablePart(1010); // GH₵10.10
    renderPage();

    const addButton = await screen.findByText("Add to order");
    fireEvent.click(addButton);
    await screen.findByText("Subtotal");

    // No shipping zone (dropoff: "bring"), so total == subtotal == GH₵10.10.
    const totals = screen.getAllByText("GH₵10.10");
    expect(totals.length).toBe(4); // "Parts for this repair" line + cart line + Subtotal + Total
  });
});
