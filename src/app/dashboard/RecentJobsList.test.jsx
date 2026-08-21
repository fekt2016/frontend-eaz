import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// T23: the Overview page's "New Job" buttons (MyDashboard/FullDashboard
// headers) and the "Create first job →" empty-state link here were removed —
// creating a job belongs on the POS Jobs page, not the Overview.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

import { RecentJobsList } from "./page";

describe("Dashboard RecentJobsList — no create-job link (T23)", () => {
  it("shows a plain empty state with no 'Create first job' link", () => {
    render(<RecentJobsList jobs={[]} loading={false} />);

    expect(screen.getByText("No jobs yet.")).toBeInTheDocument();
    expect(screen.queryByText(/create first job/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /create first job/i })).not.toBeInTheDocument();
  });
});
