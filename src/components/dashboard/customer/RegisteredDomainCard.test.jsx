import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// T26: computes active/expiring-soon/expired from expiresAt (mirroring the
// hosting order detail page's own 7-day-threshold convention), since the
// stored `status` field is never updated after registration.
import { RegisteredDomainCard } from "./CustomerCards";

function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();
}

describe("RegisteredDomainCard (T26)", () => {
  it("shows Active for a domain expiring well in the future, no Renew CTA", () => {
    render(<RegisteredDomainCard domain={{ domain: "example.com", expiresAt: daysFromNow(300) }} />);

    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText("Renew")).not.toBeInTheDocument();
  });

  it("shows Expiring soon within 7 days, with a Renew CTA", () => {
    render(<RegisteredDomainCard domain={{ domain: "example.com", expiresAt: daysFromNow(3) }} />);

    expect(screen.getByText("Expiring soon")).toBeInTheDocument();
    expect(screen.getByText(/3 days left/)).toBeInTheDocument();
    expect(screen.getByText("Renew").closest("a")).toHaveAttribute("href", "/domains");
  });

  it("shows Expired for a past expiry date, with a Renew CTA", () => {
    render(<RegisteredDomainCard domain={{ domain: "example.com", expiresAt: daysFromNow(-5) }} />);

    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Renew")).toBeInTheDocument();
  });
});
