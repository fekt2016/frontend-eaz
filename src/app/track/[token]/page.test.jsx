import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/context/CartContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...rest }) => <img src={src} alt={alt} {...rest} />,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({ api: { get: (...a) => mockGet(...a), post: vi.fn() }, errorMessage: (err, fb = "") => err?.message || fb }));

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
    mockGet.mockRejectedValue(new Error("We couldn't find a repair for that link."));
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

// ── T41: part-order cart money ──────────────────────────────────────────────
// The cart behind "Add to order" (fed from job.parts) stored money as float GHS
// (`sellingPrice / 100`) and rebuilt pesewas with `subtotal * 100`, while the
// shop-cart path on this same page stored integer pesewas. Two conventions on one
// page, and the float round-trip drifts for ~19% of price/quantity combinations —
// e.g. GH₵0.07 × 3 produced 21.000000000000004 instead of 21.
//
// Not to be confused with the catalogue's "Add to cart", which is the shop cart.
describe("Track page part-order cart — integer pesewas (T41)", () => {
  beforeEach(() => {
    mockGet.mockReset();
    searchParamValue = null;
    window.localStorage.clear();
  });

  const jobWithPart = (pricePesewas) => ({
    jobNumber: "REP-T41",
    status: "diagnosing", // in ORDERABLE, so the order UI renders
    customerName: "Ama",
    dropoff: "bring",
    faultDescription: "Cracked screen",
    parts: [{ id: "p1", name: "Screw Set", pricePesewas, quantity: 1 }],
  });

  async function addToOrder(times, pricePesewas) {
    mockGet.mockImplementation((url) =>
      url.startsWith("/track/")
        ? Promise.resolve({ data: jobWithPart(pricePesewas) })
        : Promise.resolve({ data: [] }),
    );
    renderPage();
    await screen.findByRole("button", { name: /add to order/i });
    for (let n = 0; n < times; n++) {
      // Re-query: the previous node is detached once setCart re-renders.
      fireEvent.click(screen.getByRole("button", { name: /add to order/i }));
    }
  }

  const summary = () => screen.getByText("Subtotal").closest("div").parentElement;

  it("keeps a single unit exact", async () => {
    await addToOrder(1, 7);
    await waitFor(() =>
      expect(within(summary()).getAllByText("GH₵0.07").length).toBeGreaterThan(0),
    );
  });

  it("does not drift on the quantity that broke the float path", async () => {
    await addToOrder(3, 7);
    // The old path rendered GH₵0.21000000000000002 in the subtotal row.
    await waitFor(() =>
      expect(within(summary()).getAllByText("GH₵0.21").length).toBeGreaterThan(0),
    );
  });

  it("never renders a floating-point artefact anywhere on the page", async () => {
    await addToOrder(3, 7);
    await waitFor(() =>
      expect(within(summary()).getAllByText("GH₵0.21").length).toBeGreaterThan(0),
    );
    // Three or more decimal places is the signature of the old bug.
    expect(document.body.textContent).not.toMatch(/GH₵[\d,]+\.\d{3,}/);
  });

  it("puts the exact total on the pay button", async () => {
    await addToOrder(3, 7);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Pay GH₵0\.21 now/i })).toBeInTheDocument(),
    );
  });

  it("stays exact for an ordinary price too", async () => {
    await addToOrder(3, 1999); // GH₵19.99 × 3 = GH₵59.97
    await waitFor(() =>
      expect(within(summary()).getAllByText("GH₵59.97").length).toBeGreaterThan(0),
    );
  });

  it("renders money through the shared formatter, not a raw GH₵ template", async () => {
    // The thousands separator only appears via formatGhs; the old `GH₵{subtotal}`
    // template printed a bare "2468".
    await addToOrder(2, 123400);
    await waitFor(() =>
      expect(within(summary()).getAllByText("GH₵2,468.00").length).toBeGreaterThan(0),
    );
  });
});
