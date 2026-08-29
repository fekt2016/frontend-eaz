import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductReviews from "./ProductReviews";

const mockUser = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser(), loading: false }),
}));

const mockReviews = vi.fn();
const mockMyReview = vi.fn();
const mockEligibility = vi.fn();
vi.mock("@/hooks/queries/useProductReviews", () => ({
  useProductReviews: () => mockReviews(),
  useMyProductReview: () => mockMyReview(),
  useReviewEligibility: () => mockEligibility(),
  useSubmitProductReview: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateProductReview: () => ({ mutate: vi.fn(), isPending: false }),
}));

function baseProduct() {
  return { _id: "prod1", name: "Test Product", ratingSummary: { average: null, count: 0 } };
}

describe("ProductReviews eligibility fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.mockReturnValue({ _id: "u1", name: "Ama" });
    mockReviews.mockReturnValue({ data: { data: [], total: 0 }, isLoading: false });
    mockMyReview.mockReturnValue({ data: null, isLoading: false });
  });

  it("hides the review form and shows the verified-purchasers message when the eligibility query errors", () => {
    // `data` is undefined on an errored query (network failure, 500, etc.) —
    // this is the exact shape that exercises the `?? false` fallback.
    mockEligibility.mockReturnValue({ data: undefined, isLoading: false, isError: true });

    render(<ProductReviews product={baseProduct()} />);

    expect(screen.queryByText(/write a review/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit review/i })).not.toBeInTheDocument();
    expect(screen.getByText(/verified purchasers only/i)).toBeInTheDocument();
  });

  it("shows the review form when the eligibility query resolves canReview: true", () => {
    mockEligibility.mockReturnValue({
      data: { canReview: true, alreadyReviewed: false, verifiedPurchase: true },
      isLoading: false,
    });

    render(<ProductReviews product={baseProduct()} />);

    expect(screen.getByText(/write a review/i)).toBeInTheDocument();
    expect(screen.queryByText(/verified purchasers only/i)).not.toBeInTheDocument();
  });
});
