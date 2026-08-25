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
const mockPost = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { get: (...args) => mockGet(...args), post: (...args) => mockPost(...args) },
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

// The sales-tracking section was reported missing from the Sell page once already: it
// was mounted, but the cart row above it was `min-h-[calc(100vh-120px)]`, so it sat a
// full viewport down and read as absent. These pin both the mount and the bounded row.
describe("Sell page — sales tracking section (T46)", () => {
  it("mounts the sales tracker on the page", async () => {
    mockGet.mockResolvedValue({ data: [] });
    renderPage();

    expect(await screen.findByTestId("sales-tracker")).toBeInTheDocument();
  });

  it("does not let the cart row claim the whole viewport, which hid the section", async () => {
    mockGet.mockResolvedValue({ data: [] });
    const { container } = renderPage();

    await screen.findByTestId("sales-tracker");
    const row = container.querySelector('[class*="lg:flex-row"]');
    expect(row).toBeTruthy();
    expect(row.className).not.toMatch(/min-h-\[calc\(100vh/);
  });
});

// T30: "Complete Sale" used to return a raw 500 with parts in the cart
// (backend-eaz/tasks.md -> T30, root cause already fixed there). This locks
// in the fix from the frontend side: a parts sale completes without a crash,
// and — if a sale ever does fail again — the real backend error message
// reaches the cashier instead of a blank/generic screen.
async function addPartToCart(name = "iPhone 12 Screen") {
  mockGet.mockResolvedValue({
    data: [{
      _id: "prt1", name, category: "Screen", quantity: 5,
      lowStockThreshold: 2, sellingPrice: 9000, images: [],
    }],
    total: 1,
  });
  renderPage();
  fireEvent.change(screen.getByPlaceholderText(/scan barcode or search/i), { target: { value: name } });
  await screen.findByText(name);
  fireEvent.click(screen.getByText(name));
}

describe("Sell page — Complete Sale (T30)", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it("completes a parts sale successfully — no crash (regression for the original 500)", async () => {
    await addPartToCart();
    mockPost.mockResolvedValue({
      data: { saleNumber: "SALE-001", total: 9000, changeDue: 0, paymentMethod: "cash", items: [] },
    });

    fireEvent.click(screen.getByText(/Checkout →/));
    fireEvent.change(await screen.findByPlaceholderText("0.00"), { target: { value: "90" } });
    fireEvent.click(screen.getByText(/Complete Sale/));

    expect(await screen.findByText("Sale Complete")).toBeInTheDocument();
    expect((await screen.findAllByText("SALE-001")).length).toBeGreaterThan(0);
    expect(mockPost).toHaveBeenCalledWith("/pos/sales", expect.objectContaining({
      items: [{ partId: "prt1", productId: undefined, quantity: 1 }],
    }));
  });

  it("surfaces the backend's real error message on failure, not a raw 500", async () => {
    await addPartToCart();
    mockPost.mockRejectedValue(new Error('Insufficient stock for "iPhone 12 Screen". Available: 0, Requested: 1'));

    fireEvent.click(screen.getByText(/Checkout →/));
    fireEvent.change(await screen.findByPlaceholderText("0.00"), { target: { value: "90" } });
    fireEvent.click(screen.getByText(/Complete Sale/));

    expect(await screen.findByText(/Insufficient stock for "iPhone 12 Screen"/)).toBeInTheDocument();
    // Still on the payment panel, not a blank/crashed screen — the cashier can retry.
    expect(screen.getByText(/Complete Sale/)).toBeInTheDocument();
  });

  it("falls back to lib/api.js's readable generic message when the backend gives no error text", async () => {
    await addPartToCart();
    // Matches the exact fallback shape lib/api.js builds when a response has
    // no `error`/`message` field — e.g. a raw 500 with an empty/non-JSON body.
    mockPost.mockRejectedValue(new Error("Request failed (500)"));

    fireEvent.click(screen.getByText(/Checkout →/));
    fireEvent.change(await screen.findByPlaceholderText("0.00"), { target: { value: "90" } });
    fireEvent.click(screen.getByText(/Complete Sale/));

    expect(await screen.findByText("Request failed (500)")).toBeInTheDocument();
  });
});

// T31: the Sell page is supposed to sell shop products (accessories) as well
// as repair parts, via the same search/cart/checkout flow. Shares T30's root
// cause (both hit the same createSale 500), fixed there — this verifies the
// product branch specifically: search surfaces it, the cart carries
// `productId` (not `partId`), and the sale completes.
describe("Sell page — sells shop products, not just parts (T31)", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it("finds a shop product via search and adds it to the cart", async () => {
    mockGet.mockResolvedValue({
      data: [{
        _id: "prd1", name: "USB-C Cable", category: "Accessory", quantity: 10,
        lowStockThreshold: 2, sellingPrice: 1500, _kind: "product", images: [],
      }],
      total: 1,
    });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/scan barcode or search/i), { target: { value: "cable" } });
    await screen.findByText("USB-C Cable");
    fireEvent.click(screen.getByText("USB-C Cable"));

    expect(await screen.findByText(/1 item\(s\)/)).toBeInTheDocument();
  });

  it("completes a products-only sale successfully, sending productId not partId", async () => {
    mockGet.mockResolvedValue({
      data: [{
        _id: "prd1", name: "USB-C Cable", category: "Accessory", quantity: 10,
        lowStockThreshold: 2, sellingPrice: 1500, _kind: "product", images: [],
      }],
      total: 1,
    });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText(/scan barcode or search/i), { target: { value: "cable" } });
    await screen.findByText("USB-C Cable");
    fireEvent.click(screen.getByText("USB-C Cable"));

    mockPost.mockResolvedValue({
      data: { saleNumber: "SALE-002", total: 1500, changeDue: 0, paymentMethod: "cash", items: [] },
    });
    fireEvent.click(screen.getByText(/Checkout →/));
    fireEvent.change(await screen.findByPlaceholderText("0.00"), { target: { value: "15" } });
    fireEvent.click(screen.getByText(/Complete Sale/));

    expect(await screen.findByText("Sale Complete")).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledWith("/pos/sales", expect.objectContaining({
      items: [{ partId: undefined, productId: "prd1", quantity: 1 }],
    }));
  });

  it("completes a mixed parts+products sale in one cart", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: [{
          _id: "prt1", name: "iPhone 12 Screen", category: "Screen", quantity: 5,
          lowStockThreshold: 2, sellingPrice: 9000, images: [],
        }],
        total: 1,
      })
      .mockResolvedValueOnce({
        data: [{
          _id: "prd1", name: "USB-C Cable", category: "Accessory", quantity: 10,
          lowStockThreshold: 2, sellingPrice: 1500, _kind: "product", images: [],
        }],
        total: 1,
      });
    renderPage();

    const search = screen.getByPlaceholderText(/scan barcode or search/i);
    fireEvent.change(search, { target: { value: "iphone" } });
    await screen.findByText("iPhone 12 Screen");
    fireEvent.click(screen.getByText("iPhone 12 Screen"));

    fireEvent.change(search, { target: { value: "cable" } });
    await screen.findByText("USB-C Cable");
    fireEvent.click(screen.getByText("USB-C Cable"));

    expect(await screen.findByText(/2 item\(s\)/)).toBeInTheDocument();

    mockPost.mockResolvedValue({
      data: { saleNumber: "SALE-003", total: 10500, changeDue: 0, paymentMethod: "cash", items: [] },
    });
    fireEvent.click(screen.getByText(/Checkout →/));
    fireEvent.change(await screen.findByPlaceholderText("0.00"), { target: { value: "105" } });
    fireEvent.click(screen.getByText(/Complete Sale/));

    expect(await screen.findByText("Sale Complete")).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledWith("/pos/sales", expect.objectContaining({
      items: [
        { partId: "prt1", productId: undefined, quantity: 1 },
        { partId: undefined, productId: "prd1", quantity: 1 },
      ],
    }));
  });
});
