import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// T26: the Domains page rendered domain *orders* (useDomainOrders); should
// show the caller's actually-registered domains instead.
const mockDomains = vi.fn();
vi.mock("@/hooks/queries/useDomains", () => ({
  useMyRegisteredDomains: () => ({ data: mockDomains(), isLoading: false }),
}));

import CustomerDomainsPage from "./page";

describe("Domains page — registered domains, not orders (T26)", () => {
  it("renders each registered domain with its expiry status", () => {
    mockDomains.mockReturnValue([
      { _id: "d1", domain: "myshop.com", expiresAt: new Date(Date.now() + 300 * 86400000).toISOString() },
    ]);
    render(<CustomerDomainsPage />);

    expect(screen.getByText("myshop.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows an empty state when no domains are registered", () => {
    mockDomains.mockReturnValue([]);
    render(<CustomerDomainsPage />);

    expect(screen.getByText("No domains registered yet.")).toBeInTheDocument();
  });
});
