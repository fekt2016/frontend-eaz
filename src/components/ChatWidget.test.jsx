import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T69 phase 4 — the customer-facing half of CSAT: after a chat a person handled
// closes, the widget asks for a rating once, sends it, and then shows the score
// back instead of asking again.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

const SESSION_ID = "ew_test_session";
vi.mock("@/lib/cookies", () => ({
  getCookie: (name) => (name === "ew_session" ? SESSION_ID : ""),
  setCookie: vi.fn(),
  removeCookie: vi.fn(),
}));

import ChatWidget from "./ChatWidget";

/** The widget's mount fetch — messages + the session's meta. */
function mockSession(meta) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: [{ _id: "m1", role: "admin", content: "All sorted for you!", createdAt: new Date().toISOString() }],
        meta,
      }),
    })
  );
}

async function openWidget() {
  render(<ChatWidget />);
  fireEvent.click(await screen.findByRole("button", { name: /open chat/i }));
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChatWidget — post-chat rating (T69)", () => {
  it("asks for a rating once a human-handled chat has closed", async () => {
    mockSession({ resolved: true, humanAccepted: true, humanRequested: false });
    await openWidget();

    expect(await screen.findByText("How did we do?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 stars" })).toBeInTheDocument();
  });

  it("posts the score and thanks the customer instead of asking again", async () => {
    mockSession({ resolved: true, humanAccepted: true, humanRequested: false });
    await openWidget();

    fireEvent.click(await screen.findByRole("button", { name: "4 stars" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/chat/sessions/${SESSION_ID}/rating`,
        expect.objectContaining({ method: "POST", body: JSON.stringify({ rating: 4 }) }),
      )
    );
    expect(await screen.findByText(/Thanks for the feedback/)).toBeInTheDocument();
    expect(screen.queryByText("How did we do?")).not.toBeInTheDocument();
  });

  it("shows a rating the customer already left rather than asking twice", async () => {
    mockSession({ resolved: true, humanAccepted: true, humanRequested: false, rating: 3 });
    await openWidget();

    expect(await screen.findByText(/Thanks for the feedback/)).toBeInTheDocument();
    expect(screen.queryByText("How did we do?")).not.toBeInTheDocument();
  });

  it("does not ask for a rating on a chat only the bot handled", async () => {
    mockSession({ resolved: true, humanAccepted: false, humanRequested: false });
    await openWidget();

    // The chat is over…
    expect(await screen.findByRole("button", { name: /start new chat/i })).toBeInTheDocument();
    // …but nobody from the team was ever in it, so there's nothing to rate.
    expect(screen.queryByText("How did we do?")).not.toBeInTheDocument();
  });

  it("does not ask while the conversation is still live", async () => {
    mockSession({ resolved: false, humanAccepted: true, humanRequested: true });
    await openWidget();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByText("How did we do?")).not.toBeInTheDocument();
  });
});
