import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// T48: the homepage cards must show the view count the API reports. They were
// shipped wired to `product.views` but the list endpoint's aggregation did not
// project the field, so every card rendered without it — this pins the whole
// path from API payload to card.
const mockGet = vi.fn();
vi.mock("@/lib/api", () => ({ api: { get: (...args) => mockGet(...args) } }));

import RecentProducts from "./RecentProducts";

const product = {
  _id: "p1",
  slug: "iphone-17e",
  name: "iPhone 17e",
  category: "Phones",
  price: 850000,
  stock: 12,
  images: [],
  views: 1240,
  sold: 3,
};

describe("RecentProducts — popularity on the homepage card (T48)", () => {
  it("shows the view count the API reports", async () => {
    mockGet.mockResolvedValue({ data: [product] });

    render(<RecentProducts />);

    await waitFor(() => expect(screen.getByText(/1\.2k views/)).toBeTruthy());
    expect(screen.getByText(/3 sold/)).toBeTruthy();
  });

  it("still shows a view count for a product nobody has opened yet", async () => {
    mockGet.mockResolvedValue({ data: [{ ...product, views: 0, sold: 0 }] });

    render(<RecentProducts />);

    await waitFor(() => expect(screen.getByText(/0 views/)).toBeTruthy());
    // No sale yet — that half stays quiet rather than reading "0 sold".
    expect(screen.queryByText(/sold/)).toBeNull();
  });
});
