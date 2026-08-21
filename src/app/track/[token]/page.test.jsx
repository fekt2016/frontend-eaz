import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
