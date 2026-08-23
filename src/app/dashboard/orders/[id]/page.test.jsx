import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T27: the customer order detail page had no way to review purchased
// products. Adds a per-item review form gated on the backend's own
// eligibility endpoint (verified purchase, not already reviewed).
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "order1" }),
}));

const mockUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser() }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    get: (...a) => mockGet(...a),
    post: (...a) => mockPost(...a),
    patch: (...a) => mockPatch(...a),
  },
}));

import CustomerOrderDetailPage from "./page";

function makeOrder(over = {}) {
  return {
    _id: "order1", orderNumber: "EZW-0001", status: "delivered", createdAt: "2026-01-05T00:00:00Z",
    items: [{ _id: "i1", product: "prod1", name: "Phone Case", qty: 1, price: 5000 }],
    subtotal: 5000, total: 5000,
    ...over,
  };
}

describe("Order detail — product review form (T27)", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it("shows a review form for a verified, not-yet-reviewed purchase", async () => {
    mockUser.mockReturnValue({ role: "user" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/mine/order1") return Promise.resolve({ data: makeOrder() });
      if (path === "/products/prod1/reviews/eligibility") {
        return Promise.resolve({ data: { canReview: true, alreadyReviewed: false, verifiedPurchase: true } });
      }
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);

    await waitFor(() => expect(screen.getByPlaceholderText(/share your experience/i)).toBeInTheDocument());
  });

  it("submits a new review and shows the confirmation", async () => {
    mockUser.mockReturnValue({ role: "user" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/mine/order1") return Promise.resolve({ data: makeOrder() });
      if (path === "/products/prod1/reviews/eligibility") {
        return Promise.resolve({ data: { canReview: true, alreadyReviewed: false, verifiedPurchase: true } });
      }
      return Promise.reject(new Error("unexpected " + path));
    });
    mockPost.mockResolvedValue({ data: { rating: 5, comment: "Great product, works perfectly!" } });

    render(<CustomerOrderDetailPage />);
    await waitFor(() => expect(screen.getByPlaceholderText(/share your experience/i)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/share your experience/i), {
      target: { value: "Great product, works perfectly!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      "/products/prod1/reviews",
      { rating: 5, comment: "Great product, works perfectly!" },
    ));
    expect(await screen.findByText(/thanks for your review/i)).toBeInTheDocument();
  });

  it("shows the existing review with an Edit toggle when already reviewed", async () => {
    mockUser.mockReturnValue({ role: "user" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/mine/order1") return Promise.resolve({ data: makeOrder() });
      if (path === "/products/prod1/reviews/eligibility") {
        return Promise.resolve({ data: { canReview: false, alreadyReviewed: true, verifiedPurchase: true } });
      }
      if (path === "/products/prod1/reviews/mine") {
        return Promise.resolve({ data: { rating: 4, comment: "Pretty good overall." } });
      }
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);

    expect(await screen.findByText("Pretty good overall.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit review/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/share your experience/i)).not.toBeInTheDocument();
  });

  it("shows no review UI at all on the admin/staff view of someone else's order", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/order1") return Promise.resolve({ data: makeOrder() });
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);
    await waitFor(() => expect(screen.getByText("Phone Case")).toBeInTheDocument());

    expect(screen.queryByPlaceholderText(/share your experience/i)).not.toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalledWith(expect.stringContaining("/reviews/eligibility"));
  });

  it("shows no review UI for an order that isn't paid/delivered yet", async () => {
    mockUser.mockReturnValue({ role: "user" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/mine/order1") return Promise.resolve({ data: makeOrder({ status: "pending" }) });
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);
    await waitFor(() => expect(screen.getByText("Phone Case")).toBeInTheDocument());

    expect(screen.queryByPlaceholderText(/share your experience/i)).not.toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalledWith(expect.stringContaining("/reviews/eligibility"));
  });
});

// T15: refund action + status — admin only (staff excluded), gated on the
// backend's own REFUND_ELIGIBLE_STATUSES mirror.
describe("Order detail — refund section (T15)", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it("shows a Refund button for admin on a paid order with no refund yet", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/order1") return Promise.resolve({ data: makeOrder({ status: "paid" }) });
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);
    expect(await screen.findByRole("button", { name: /refund this order/i })).toBeInTheDocument();
  });

  it("does not show the refund section for staff (admin only)", async () => {
    mockUser.mockReturnValue({ role: "staff" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/order1") return Promise.resolve({ data: makeOrder({ status: "paid" }) });
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);
    await waitFor(() => expect(screen.getByText("Phone Case")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /refund this order/i })).not.toBeInTheDocument();
  });

  it("does not show a refund button for a delivered order with no refund on record", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/order1") return Promise.resolve({ data: makeOrder({ status: "delivered" }) });
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);
    await waitFor(() => expect(screen.getByText("Phone Case")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /refund this order/i })).not.toBeInTheDocument();
  });

  it("confirms then submits a refund with the entered reason", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    const order = makeOrder({ status: "paid" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/order1") return Promise.resolve({ data: order });
      return Promise.reject(new Error("unexpected " + path));
    });
    mockPost.mockResolvedValueOnce({
      data: { ...order, status: "cancelled", refund: { status: "processing", amount: 5000, requestedAt: "2026-01-06T00:00:00Z" } },
    });

    render(<CustomerOrderDetailPage />);
    fireEvent.click(await screen.findByRole("button", { name: /refund this order/i }));

    fireEvent.change(screen.getByPlaceholderText(/reason \(optional/i), { target: { value: "Customer changed mind" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm refund/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(
      "/orders/order1/refund",
      { reason: "Customer changed mind" },
    ));
    expect(await screen.findByText(/refund in progress/i)).toBeInTheDocument();
  });

  it("shows a Check status button while processing, and calls the sync endpoint", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    const order = makeOrder({
      status: "cancelled",
      refund: { status: "processing", amount: 5000, requestedAt: "2026-01-06T00:00:00Z" },
    });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/order1") return Promise.resolve({ data: order });
      return Promise.reject(new Error("unexpected " + path));
    });
    mockPost.mockResolvedValueOnce({
      data: { ...order, refund: { ...order.refund, status: "completed", completedAt: "2026-01-07T00:00:00Z" } },
    });

    render(<CustomerOrderDetailPage />);
    fireEvent.click(await screen.findByRole("button", { name: /check status now/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/orders/order1/refund/sync"));
    expect(await screen.findByText(/refunded/i)).toBeInTheDocument();
  });

  it("shows the refunded amount and date once completed", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/order1") {
        return Promise.resolve({
          data: makeOrder({
            status: "cancelled",
            refund: { status: "completed", amount: 5000, completedAt: "2026-01-07T00:00:00Z" },
          }),
        });
      }
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);
    expect(await screen.findByText(/refunded/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /refund this order/i })).not.toBeInTheDocument();
  });

  it("shows a failed state with a link to the activity log", async () => {
    mockUser.mockReturnValue({ role: "admin" });
    mockGet.mockImplementation((path) => {
      if (path === "/orders/order1") {
        return Promise.resolve({ data: makeOrder({ status: "paid", refund: { status: "failed", amount: 5000 } }) });
      }
      return Promise.reject(new Error("unexpected " + path));
    });

    render(<CustomerOrderDetailPage />);
    expect(await screen.findByText(/refund failed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view details in the activity log/i })).toHaveAttribute("href", "/dashboard/activity-logs");
  });
});
