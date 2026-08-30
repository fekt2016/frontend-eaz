import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// T24: Marketplace (3-card landing page) and Inventory merged into one page
// — /dashboard/commerce now renders inventory directly, with Delivery Zones
// (admin-only, matching the old card's own gate) and Orders as links instead.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

const mockUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser() }),
}));

let inventoryData = [];
const mockPost = vi.fn(() => Promise.resolve({ data: {} }));
const mockUpload = vi.fn(() => Promise.resolve({ data: { url: "https://res.cloudinary.com/demo/part.jpg" } }));
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn((path) => {
      if (path.startsWith("/pos/inventory")) return Promise.resolve({ data: inventoryData, total: inventoryData.length });
      if (path.startsWith("/pos/suppliers")) return Promise.resolve({ data: [] });
      if (path.startsWith("/products")) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    }),
    post: (...args) => mockPost(...args),
    upload: (...args) => mockUpload(...args),
  },
  // page.jsx imports this alongside `api` (T100).
  errorMessage: (err, fallback) => err?.message || fallback,
}));

import CommercePage from "./page";

// Waits for PartsTab's initial fetches to settle (loading skeleton gone)
// so later assertions don't race its post-render state updates.
async function renderSettled() {
  render(<CommercePage />);
  await waitFor(() => expect(screen.getByText("No parts found")).toBeInTheDocument());
}

describe("Commerce page — merged Marketplace + Inventory (T24)", () => {
  // T106: the "Repair Parts" / "Shop Products" tabs both queried the same
  // Product collection unfiltered, so every item was listed twice. One list now.
  it("renders one stock list directly, with no tab split", async () => {
    mockUser.mockReturnValue({ role: "staff" });
    await renderSettled();

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByText("All stock")).toBeInTheDocument();
    expect(screen.queryByText("Repair Parts")).not.toBeInTheDocument();
    expect(screen.queryByText("Shop Products")).not.toBeInTheDocument();
  });

  // The Orders button and the /dashboard/commerce/orders list it opened were both
  // removed — /dashboard/pos/orders already lists shop orders and part orders for
  // the same roles, so the marketplace copy was a second door to the same thing.
  // The order *detail* route stays: the dashboard overview and the POS reports page
  // both link straight to it.
  it("no longer offers an Orders button", async () => {
    mockUser.mockReturnValue({ role: "staff" });
    await renderSettled();

    expect(screen.queryByText("Orders")).not.toBeInTheDocument();
  });

  it("shows the Delivery Zones link for admin", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    await renderSettled();

    expect(screen.getByText("Delivery Zones").closest("a")).toHaveAttribute("href", "/dashboard/commerce/delivery-zones");
  });

  it("hides the Delivery Zones link for staff (matches the old card's admin-only gate)", async () => {
    mockUser.mockReturnValue({ role: "staff" });
    await renderSettled();

    expect(screen.queryByText("Delivery Zones")).not.toBeInTheDocument();
  });
});

// T33 — an uploaded photo must reach the saved item. The behaviour is
// unchanged; the UI around it is not. The Marketplace "Add" modal used to be a
// bespoke part form and is now ProductForm (owner request, 2026-08-30), so
// these drive the new controls: an item-type toggle, then ProductForm's own
// image list.
describe("Item image upload (T33)", () => {
  beforeEach(() => {
    inventoryData = [];
    mockPost.mockClear();
    mockUpload.mockClear();
    mockUser.mockReturnValue({ role: "staff" });
  });

  async function openModalAsPart() {
    await renderSettled();
    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    expect(await screen.findByText("Add to inventory")).toBeInTheDocument();
    // Bench part, so the save goes to /pos/inventory with its bench defaults.
    fireEvent.click(screen.getByRole("button", { name: /bench part/i }));
  }

  function fillRequiredFields() {
    fireEvent.change(screen.getByPlaceholderText(/Wooden Dining Table/i), {
      target: { value: "iPhone 12 Screen" },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Furniture/i), { target: { value: "Screen" } });
    // Selling price, then the bench cost price.
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. 250\.00/i), { target: { value: "90" } });
    const cost = screen.queryByPlaceholderText("0.00");
    if (cost) fireEvent.change(cost, { target: { value: "50" } }); // bench only
  }

  it("an uploaded photo is included in the saved payload", async () => {
    await openModalAsPart();

    const file = new File(["fake"], "part.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // The URL lands in the image list once the upload resolves. It renders as
    // text in the list, not as an input value.
    expect(
      await screen.findByText("https://res.cloudinary.com/demo/part.jpg")
    ).toBeInTheDocument();

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /^add item$/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      "/pos/inventory",
      expect.objectContaining({ images: ["https://res.cloudinary.com/demo/part.jpg"] }),
    ));
  });

  // The owner ask this modal change came from: the Marketplace could only add
  // parts, so a shop product meant leaving for /commerce/products/new.
  it("can now add a SHOP PRODUCT too, and routes it to /products", async () => {
    await renderSettled();
    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    expect(await screen.findByText("Add to inventory")).toBeInTheDocument();

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /^add item$/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      "/products",
      expect.objectContaining({ name: "iPhone 12 Screen" }),
    ));
  });

  // Bench parts and shop products are one collection but NOT the same thing to
  // create: /pos/inventory sets sellOnline:false, isActive:false,
  // useInRepairs:true so a new part is not silently published to the shop.
  // /products sets none of those. This pins the routing that keeps them apart.
  it("routes a bench part to /pos/inventory, not /products", async () => {
    await openModalAsPart();
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /^add item$/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    expect(mockPost.mock.calls[0][0]).toBe("/pos/inventory");
    // The bench vocabulary, not the product one.
    expect(mockPost.mock.calls[0][1]).toEqual(
      expect.objectContaining({ quantity: expect.anything(), costPrice: 5000, sellingPrice: 9000 }),
    );
  });
});
