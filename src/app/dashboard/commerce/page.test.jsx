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

describe("Part image upload (T33)", () => {
  beforeEach(() => {
    inventoryData = [];
    mockPost.mockClear();
    mockUpload.mockClear();
    mockUser.mockReturnValue({ role: "staff" });
  });

  function fillRequiredFields() {
    fireEvent.change(screen.getByPlaceholderText(/tecno spark/i), { target: { value: "iPhone 12 Screen" } });
    const [costInput, sellInput] = screen.getAllByPlaceholderText("0");
    fireEvent.change(costInput, { target: { value: "50" } });
    fireEvent.change(sellInput, { target: { value: "90" } });
  }

  it("uploading a photo replaces the Upload button with a thumbnail + Remove, and the save payload includes it", async () => {
    await renderSettled();
    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    expect(await screen.findByText("Add New Part")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /upload photo/i })).toBeInTheDocument();

    const file = new File(["fake"], "part.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Upload button gone, replaced by a Remove control once the URL lands.
    expect(await screen.findByRole("button", { name: /remove/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upload photo/i })).not.toBeInTheDocument();

    fillRequiredFields();
    const addButtons = screen.getAllByRole("button", { name: /^add part$/i });
    fireEvent.click(addButtons[addButtons.length - 1]); // header button vs. modal submit share the name

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      "/pos/inventory",
      expect.objectContaining({ images: ["https://res.cloudinary.com/demo/part.jpg"] }),
    ));
  });

  it("Remove clears the image and brings back the Upload button", async () => {
    await renderSettled();
    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    await screen.findByText("Add New Part");

    const file = new File(["fake"], "part.jpg", { type: "image/jpeg" });
    fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } });
    fireEvent.click(await screen.findByRole("button", { name: /remove/i }));

    expect(await screen.findByRole("button", { name: /upload photo/i })).toBeInTheDocument();
  });

  it("shows a thumbnail in the parts table for a part that already has a photo", async () => {
    inventoryData = [{
      _id: "p1", name: "Battery", quantity: 5, lowStockThreshold: 3,
      costPrice: 2000, sellingPrice: 4000, category: "Battery",
      images: ["https://res.cloudinary.com/demo/battery.jpg"],
    }];
    render(<CommercePage />);
    await waitFor(() => expect(screen.getByText("Battery")).toBeInTheDocument());

    const thumb = screen.getByAltText("Battery");
    expect(thumb).toHaveAttribute("src", expect.stringContaining("battery.jpg"));
  });
});

// The marketplace renders inside DashboardShell, whose <main> is a bare
// `flex-1 overflow-auto` with no padding — unlike PosShell, which pads its own.
// Both sibling commerce pages (orders, delivery-zones) bring their own gutters;
// this one did not, so its header and both tabs sat flush against the edges.
describe("Commerce page — content gutters", () => {
  it("pads the page content, since DashboardShell's main does not", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    const { container } = render(<CommercePage />);

    const root = container.firstChild;
    expect(root.className).toMatch(/\bp-5\b/);
    expect(root.className).toMatch(/\blg:p-7\b/);
  });

  it("puts them on the root, so the header and the list share one gutter", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    const { container } = render(<CommercePage />);
    const root = container.firstChild;

    // T106: there is no tab switcher any more — the header and the single list
    // are both children of the padded root.
    await waitFor(() => expect(screen.getByText("Marketplace")).toBeInTheDocument());
    expect(container.firstChild).toBe(root);
    expect(root.className).toMatch(/\bp-5\b/);
  });
});
