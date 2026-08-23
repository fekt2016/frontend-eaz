import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// T18: "Cancel Job" now opens a confirmation modal instead of firing
// immediately, and hides once the job is `ready` (parity with the backend's
// canTransitionJobStatus guard, which already rejects ready->cancelled — T53).
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "job1" }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "staff" } }),
}));

const mockGet = vi.fn();
const mockPatch = vi.fn();
vi.mock("@/lib/api", () => ({
  api: {
    get: (...args) => mockGet(...args),
    patch: (...args) => mockPatch(...args),
    post: vi.fn(),
  },
}));

// Neither charge hook is exercised by this test — stub both to plain idle state.
vi.mock("@/hooks/useMomoCharge", () => ({
  useMomoCharge: () => ({
    momoPhone: "", setMomoPhone: vi.fn(), momoProvider: "mtn", setMomoProvider: vi.fn(),
    momoAmount: "", setMomoAmount: vi.fn(), momoStatus: "idle", momoRef: null, momoMsg: "",
    momoLoading: false, initiateMomo: vi.fn(), cancelMomo: vi.fn(),
  }),
}));
vi.mock("@/hooks/useCardCharge", () => ({
  useCardCharge: () => ({
    cardAmount: "", setCardAmount: vi.fn(), cardStatus: "idle", cardRef: null,
    cardUrl: "", cardMsg: "", cardLoading: false, initiateCard: vi.fn(), cancelCard: vi.fn(),
  }),
}));

// Part search is a react-query hook — not under test here, no QueryClientProvider in this test.
vi.mock("@/hooks/queries/useInventory", () => ({
  useInventorySearch: () => ({ data: [] }),
}));

// JobPhotos pulls in its own react-query mutations — irrelevant to T18, stub it out.
vi.mock("@/components/pos/JobPhotos", () => ({ default: () => null }));

import JobDetailPage from "./page";

function baseJob(overrides = {}) {
  return {
    _id: "job1",
    jobNumber: "REP-2026-0001",
    status: "diagnosing",
    requiresDiagnosis: true,
    customer: { name: "Ama", phone: "0201234567" },
    device: { brand: "Apple", model: "iPhone 12" },
    parts: [],
    payments: [],
    ...overrides,
  };
}

async function renderWithJob(job) {
  mockGet.mockResolvedValue({ data: job });
  render(<JobDetailPage />);
  await waitFor(() => expect(mockGet).toHaveBeenCalledWith("/pos/jobs/job1"));
  // Let the fetched job settle into state before interacting.
  await screen.findByText(job.jobNumber ? new RegExp(job.jobNumber) : /./);
}

describe("Job detail page — Cancel Job confirmation (T18)", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPatch.mockReset();
  });

  it("shows the Cancel Job button for a live, non-ready status", async () => {
    await renderWithJob(baseJob({ status: "diagnosing" }));
    expect(screen.getByRole("button", { name: /cancel job/i })).toBeInTheDocument();
  });

  it("hides the Cancel Job button once the job is ready (parity with the backend guard)", async () => {
    await renderWithJob(baseJob({ status: "ready" }));
    expect(screen.queryByRole("button", { name: /cancel job/i })).not.toBeInTheDocument();
  });

  it("clicking Cancel Job opens a confirmation modal without firing the status change yet", async () => {
    await renderWithJob(baseJob({ status: "diagnosing" }));
    fireEvent.click(screen.getByRole("button", { name: /cancel job/i }));

    expect(await screen.findByText(/cancel job\?/i)).toBeInTheDocument();
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("'Keep Job' closes the modal without patching the status", async () => {
    await renderWithJob(baseJob({ status: "diagnosing" }));
    fireEvent.click(screen.getByRole("button", { name: /cancel job/i }));
    await screen.findByText(/cancel job\?/i);

    fireEvent.click(screen.getByRole("button", { name: /keep job/i }));

    await waitFor(() => expect(screen.queryByText(/cancel job\?/i)).not.toBeInTheDocument());
    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("confirming in the modal patches the job to cancelled", async () => {
    mockPatch.mockResolvedValue({ data: {} });
    await renderWithJob(baseJob({ status: "diagnosing" }));
    fireEvent.click(screen.getByRole("button", { name: /cancel job/i }));
    await screen.findByText(/cancel job\?/i);

    // Two buttons now share the "Cancel Job" name — the trigger (now hidden
    // behind the modal) and the modal's own confirm button; the modal's is last.
    const confirmButtons = screen.getAllByRole("button", { name: /cancel job/i });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith("/pos/jobs/job1", { status: "cancelled" }));
  });
});
