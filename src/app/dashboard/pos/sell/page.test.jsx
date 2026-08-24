import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// T37: the sell page's search results and cart rows were text-only — no way
// to visually confirm the right item was scanned/selected. Parts already
// returned `images`; the product branch of the same search endpoint omitted
// them (backend-eaz/tasks.md -> T37), fixed there — this covers the frontend
// wiring: image carried from the search result into the cart item, rendered
// in both places via the shared ProductImage component (graceful placeholder
// on missing/broken images, already covered by its own test suite).
const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { get: (...args) => mockGet(...args), post: vi.fn() },
}));

// The Sell page now renders the sales-tracking section, which needs AuthProvider and
// its own queries. This file is about thumbnails, so stub it out — SalesTracker has
// its own test suite.
vi.mock("@/components/pos/SalesTracker", () => ({
  default: () => <div data-testid="sales-tracker" />,
}));

import SellPage from "./page";

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SellPage />
    </QueryClientProvider>
  );
}

describe("Sell page — item thumbnails in search & cart (T37)", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders a thumbnail per search result (part with a photo, product without one)", async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          _id: "prt1", name: "iPhone 12 Screen", category: "Screen", quantity: 5,
          lowStockThreshold: 2, sellingPrice: 9000,
          images: ["https://res.cloudinary.com/demo/screen.jpg"],
        },
        {
          _id: "prd1", name: "USB-C Cable", category: "Accessory", quantity: 10,
          lowStockThreshold: 2, sellingPrice: 1500, _kind: "product", images: [],
        },
      ],
      total: 2,
    });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/scan barcode or search/i), { target: { value: "iphone" } });

    const screenThumb = await screen.findByAltText("iPhone 12 Screen");
    expect(screenThumb).toHaveAttribute("src", expect.stringContaining("screen.jpg"));
    // No photo on the product — still renders (the shared placeholder), no crash.
    expect(screen.getByAltText("USB-C Cable")).toBeInTheDocument();
  });

  it("carries the image from the clicked search result into the cart row", async () => {
    mockGet.mockResolvedValue({
      data: [{
        _id: "prt1", name: "iPhone 12 Screen", category: "Screen", quantity: 5,
        lowStockThreshold: 2, sellingPrice: 9000,
        images: ["https://res.cloudinary.com/demo/screen.jpg"],
      }],
      total: 1,
    });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/scan barcode or search/i), { target: { value: "iphone" } });
    await screen.findByText("iPhone 12 Screen");
    fireEvent.click(screen.getByText("iPhone 12 Screen"));

    await waitFor(() => {
      const thumbs = screen.getAllByAltText("iPhone 12 Screen");
      expect(thumbs.some((el) => el.getAttribute("src")?.includes("screen.jpg"))).toBe(true);
    });
  });
});
