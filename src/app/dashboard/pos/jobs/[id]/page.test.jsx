import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

// Neither charge hook is exercised by the T18 tests — stub both to plain idle
// state. The args ARE captured, because what the page passes as `balanceDue` is a
// money-unit boundary (T43): the hooks multiply by 100 themselves.
const momoArgs = vi.fn();
const cardArgs = vi.fn();
vi.mock("@/hooks/useMomoCharge", () => ({
  useMomoCharge: (args) => (momoArgs(args), {
    momoPhone: "", setMomoPhone: vi.fn(), momoProvider: "mtn", setMomoProvider: vi.fn(),
    momoAmount: "", setMomoAmount: vi.fn(), momoStatus: "idle", momoRef: null, momoMsg: "",
    momoLoading: false, initiateMomo: vi.fn(), cancelMomo: vi.fn(),
  }),
}));
vi.mock("@/hooks/useCardCharge", () => ({
  useCardCharge: (args) => (cardArgs(args), {
    cardAmount: "", setCardAmount: vi.fn(), cardStatus: "idle", cardRef: null,
    cardUrl: "", cardMsg: "", cardLoading: false, initiateCard: vi.fn(), cancelCard: vi.fn(),
  }),
}));

// Part search is a react-query hook — not under test here (the QueryClient
// below supplies its provider; the hook is still stubbed to an empty list).
vi.mock("@/hooks/queries/useInventory", () => ({
  useInventorySearch: () => ({ data: [] }),
}));

// JobPhotos pulls in its own react-query mutations — irrelevant to T18, stub it out.
vi.mock("@/components/pos/JobPhotos", () => ({ default: () => null }));

import JobDetailPage from "./page";

// The job detail + mutations are real react-query hooks now — they call the
// mocked `@/lib/api` (mockGet/mockPatch), so supply a QueryClientProvider with
// `retry: false` (a rejected lookup must surface immediately, like the track test).
// The client is created per render (not per file) so each test starts with a cold
// cache — otherwise the detail query's 15s staleTime would skip the next fetch.
function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

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
  render(
    <QueryClientProvider client={makeClient()}>
      <JobDetailPage />
    </QueryClientProvider>,
  );
  await waitFor(() => expect(mockGet).toHaveBeenCalledWith("/pos/jobs/job1"));
  // Let the fetched job settle into state before interacting.
  await screen.findByText(job.jobNumber ? new RegExp(job.jobNumber) : /./);

  // ...and specifically into the FORM, which the job number appearing does not
  // prove. The money fields start as "" and are filled by a separate effect, so
  // a click landing between those two moments submits `Number("")` — zero — and
  // the failure reads "expected +0 to be 2500", which looks like a money bug
  // rather than a race. Waiting on the field itself closes the window.
  // The STATUS select is the general signal that seeding has finished: the whole
  // form, including which action buttons exist, is driven from local state that
  // one effect fills in. "Cancel Job" is gated on `status`, so a click arriving
  // before that effect runs fails with "unable to find a button named /cancel
  // job/i" — which reads as the button being missing rather than early.
  if (job.status && job.status !== "ready") {
    await waitFor(() =>
      expect(
        screen.queryAllByRole("combobox").some((el) => el.value === job.status),
      ).toBe(true),
    );
  }

  // Money is seeded by the same effect but worth asserting separately: these
  // fields start as "" and submit as Number("") — zero — so a click landing
  // early produces "expected +0 to be 2500", which reads as a money bug.
  if (job.laborCost != null) {
    const expected = String(job.laborCost / 100);
    await waitFor(() =>
      expect(
        screen.queryAllByRole("spinbutton").some((i) => i.value === expected),
      ).toBe(true),
    );
  }
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

// T43: this page used to hold money as cedis floats (`pesewas / 100` on load,
// `× 100` again on submit) while rendering some figures through formatGhs, which
// expects pesewas — two units in one file. State is integer pesewas now. These
// pin the boundaries, because every mistake here is a silent 100x money error.
describe("Job detail — money units (T43)", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPatch.mockReset();
    momoArgs.mockReset();
    cardArgs.mockReset();
  });

  // GH₵90 part, GH₵25 labour, GH₵10 diagnosis fee, GH₵30 already paid.
  const moneyJob = () => baseJob({
    requiresDiagnosis: true,
    diagnosisFee: 1000,
    laborCost: 2500,
    parts: [{ partId: "p1", name: "Screen", quantity: 1, priceAtTime: 9000, costAtTime: 6000 }],
    payments: [{ _id: "pay1", amount: 3000, method: "cash" }],
  });

  it("renders the invoice totals through formatGhs, in cedis", async () => {
    await renderWithJob(moneyJob());

    // parts 90 + labour 25 + diagnosis 10 = GH₵125.00; paid 30 → balance GH₵95.00.
    // Each figure appears in more than one place (invoice card and summary), which
    // is the point — they all read the same value through the same formatter.
    expect((await screen.findAllByText("GH₵125.00")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("GH₵30.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GH₵95.00").length).toBeGreaterThan(0);
    // The 100x failure modes, stated explicitly.
    expect(screen.queryByText("GH₵12,500.00")).not.toBeInTheDocument();
    expect(screen.queryByText("GH₵1.25")).not.toBeInTheDocument();
  });

  it("hands the charge hooks CEDIS, since they multiply by 100 themselves", async () => {
    await renderWithJob(moneyJob());

    // Balance is 9500 pesewas. The hooks must receive 95, not 9500 — passing
    // pesewas here would charge the customer GH₵9,500 for a GH₵95 repair.
    await waitFor(() => expect(momoArgs).toHaveBeenCalled());
    expect(momoArgs.mock.calls.at(-1)[0].balanceDue).toBe(95);
    expect(cardArgs.mock.calls.at(-1)[0].balanceDue).toBe(95);
  });

  it("submits labour and diagnosis fees as integer pesewas", async () => {
    await renderWithJob(moneyJob());
    mockPatch.mockResolvedValue({ data: moneyJob() });

    fireEvent.click(screen.getByRole("button", { name: /save|update/i }));

    await waitFor(() => expect(mockPatch).toHaveBeenCalled());
    const payload = mockPatch.mock.calls.at(-1)[1];
    expect(payload.laborCost).toBe(2500);     // GH₵25 round-tripped unchanged
    expect(payload.diagnosisFee).toBe(1000);  // GH₵10
    expect(payload.parts[0].cost).toBe(9000); // GH₵90 part price preserved
  });
});
