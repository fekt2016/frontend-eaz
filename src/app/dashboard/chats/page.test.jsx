import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

// T69 — the chat console's supervisor half: agent bubbles say who replied,
// answering requires claiming the conversation (so two agents can't silently
// double-reply), and admins get the quality panel.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

let mockUser = { _id: "admin1", name: "Kofi Admin", role: "admin" };
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));

const mockGet   = vi.fn();
const mockPost  = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    get:    (...args) => mockGet(...args),
    post:   (...args) => mockPost(...args),
    patch:  vi.fn(() => Promise.resolve({ success: true, data: {} })),
    delete: vi.fn(() => Promise.resolve({ success: true, data: {} })),
  },
}));

import AdminChatsPage from "./page";

const NOW = "2026-08-26T10:00:00.000Z";

function makeSession(over = {}) {
  return {
    sessionId: "s1",
    name: "Ama Customer",
    email: "ama@example.com",
    resolved: false,
    humanRequested: true,
    humanAccepted: true,
    humanAcceptedAt: NOW,
    acceptedBy: "staff1",
    acceptedByName: "Ama Front-Desk",
    createdAt: NOW,
    lastActivity: NOW,
    messages: [
      { role: "user",  content: "my screen is cracked", createdAt: NOW },
      { role: "admin", content: "we can fix that today", createdAt: NOW, senderId: "staff1", senderName: "Ama Front-Desk" },
    ],
    ...over,
  };
}

const METRICS = {
  range: { from: NOW, to: NOW },
  totals: { sessions: 12, humanRequested: 8, accepted: 7, resolved: 6, resolutionRate: 50 },
  firstResponse: { medianMs: 90000, sampleSize: 7 },
  resolution:    { medianMs: 3600000, sampleSize: 6 },
  csat:          { average: 4.5, count: 4, responseRate: 66.7 },
  perStaff: [
    { staffId: "staff1", name: "Ama Front-Desk", claimed: 5, replies: 20, resolved: 4, medianFirstResponseMs: 60000, firstResponseSample: 5, csatAverage: 4.5, csatCount: 4 },
    { staffId: null,     name: "Unattributed (before staff tracking)", claimed: 0, replies: 3, resolved: 0, medianFirstResponseMs: null, firstResponseSample: 0, csatAverage: null, csatCount: 0 },
  ],
};

function routeGet(sessions) {
  mockGet.mockImplementation((path) => {
    if (path === "/chat/sessions")   return Promise.resolve({ success: true, data: sessions });
    if (path.startsWith("/chat/metrics")) return Promise.resolve({ success: true, data: METRICS });
    return Promise.resolve({ success: true, data: sessions[0] });
  });
}

/** Render the page and open the first session's transcript. */
async function openSession(sessions) {
  routeGet(sessions);
  render(<AdminChatsPage />);
  const card = await screen.findByRole("button", { name: /Ama Customer/ });
  fireEvent.click(card);
}

beforeEach(() => {
  // jsdom has no layout engine; the transcript auto-scrolls on every render.
  Element.prototype.scrollIntoView = vi.fn();
  mockUser = { _id: "admin1", name: "Kofi Admin", role: "admin" };
  mockGet.mockReset();
  mockPost.mockReset();
});

describe("chat console — agent attribution (T69)", () => {
  it("labels an agent bubble with the staff member who sent it", async () => {
    await openSession([makeSession()]);

    const bubble = await screen.findByText("we can fix that today");
    expect(within(bubble.closest("div").parentElement).getByText("Ama Front-Desk")).toBeInTheDocument();
    // The old console labelled every agent bubble "You (Admin)".
    expect(screen.queryByText("You (Admin)")).not.toBeInTheDocument();
  });

  it("labels your own replies 'You'", async () => {
    await openSession([makeSession({
      acceptedBy: "admin1",
      acceptedByName: "Kofi Admin",
      messages: [{ role: "admin", content: "on it", createdAt: NOW, senderId: "admin1", senderName: "Kofi Admin" }],
    })]);

    const bubble = await screen.findByText("on it");
    expect(within(bubble.closest("div").parentElement).getByText("You")).toBeInTheDocument();
  });

  it("falls back to a generic label for replies stored before attribution existed", async () => {
    await openSession([makeSession({
      messages: [{ role: "admin", content: "legacy reply", createdAt: NOW }],
    })]);

    expect(await screen.findByText("EazWorld team")).toBeInTheDocument();
  });
});

describe("chat console — supervisor mode (T69)", () => {
  it("is read-only on a chat another agent owns", async () => {
    await openSession([makeSession()]);

    expect(await screen.findByText(/Ama Front-Desk is handling this chat/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /take over/i })).toBeInTheDocument();
  });

  it("taking over claims the session and unlocks the reply box", async () => {
    mockPost.mockResolvedValue({ success: true, data: { acceptedBy: "admin1", acceptedByName: "Kofi Admin" } });
    await openSession([makeSession()]);

    fireEvent.click(await screen.findByRole("button", { name: /take over/i }));

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/chat/sessions/s1/claim"));
    expect(await screen.findByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText(/You're handling this/)).toBeInTheDocument();
  });

  it("offers Claim, not Take over, on an unclaimed conversation", async () => {
    await openSession([makeSession({ acceptedBy: null, acceptedByName: "" })]);

    expect(await screen.findByText(/claim it to reply/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /claim chat/i })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("lets the owner reply straight away", async () => {
    await openSession([makeSession({ acceptedBy: "admin1", acceptedByName: "Kofi Admin" })]);

    expect(await screen.findByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /take over/i })).not.toBeInTheDocument();
  });
});

describe("chat console — customer rating (T69 phase 4)", () => {
  it("shows the customer's score on the transcript", async () => {
    await openSession([makeSession({ resolved: true, rating: 5 })]);

    expect(await screen.findByText(/★★★★★ 5\/5/)).toBeInTheDocument();
  });

  it("shows nothing where a conversation went unrated", async () => {
    await openSession([makeSession({ resolved: true })]);

    await screen.findByText("we can fix that today");
    expect(screen.queryByText(/\/5/)).not.toBeInTheDocument();
  });
});

describe("chat console — quality panel (T69)", () => {
  it("shows metrics to an admin on demand", async () => {
    routeGet([makeSession()]);
    render(<AdminChatsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /quality/i }));

    expect(await screen.findByText("50%")).toBeInTheDocument();   // resolution rate
    expect(screen.getByText("1m 30s")).toBeInTheDocument();        // median first reply
    expect(screen.getByText("1h")).toBeInTheDocument();            // median time to close

    expect(screen.getByText("4.5 / 5")).toBeInTheDocument();       // CSAT
    expect(screen.getByText(/4 rated · 66.7% of closed/)).toBeInTheDocument();

    const perAgentTable = screen.getByRole("table");
    expect(within(perAgentTable).getByText("Ama Front-Desk")).toBeInTheDocument();
    expect(within(perAgentTable).getByText("20")).toBeInTheDocument();   // replies
    expect(within(perAgentTable).getByText("Unattributed")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/chat/metrics?from="));
  });

  it("hides the panel from staff — the endpoint is admin-only", async () => {
    mockUser = { _id: "staff1", name: "Ama Front-Desk", role: "staff" };
    routeGet([makeSession()]);
    render(<AdminChatsPage />);

    await screen.findByRole("button", { name: /Ama Customer/ });
    expect(screen.queryByRole("button", { name: /quality/i })).not.toBeInTheDocument();
  });
});
