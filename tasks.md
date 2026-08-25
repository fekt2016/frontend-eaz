# EazWorld Frontend — Issue & Fix Tracker

> This is the **frontend-eaz** half of the issue tracker. Backend items live in
> **`backend-eaz/tasks.md`**. Cross-app tasks are listed in their primary repo and
> cross-referenced.
>
> Source of truth: **`AUDIT.md`** (full end-to-end audit run 2026-08-18 — 112 backend + 31
> frontend tests passing, build + lint clean). This file turns that audit's findings into
> trackable tasks. Check the box when done and add a PR/commit reference.
>
> **Status key:** `[ ]` open · `[~]` in progress · `[x]` done · `[-]` won't fix / N/A
> **Priority:** **P0** blocking · **P1** important · **P2** improvement
>
> **Convention:** the **user** ticks boxes off (checks with issues); the agent **adds** new
> issues to both `backend-eaz/tasks.md` and `frontend-eaz/tasks.md` when reported.
>
> ⚠️ The older `AUDIT_REPORT.md` in the repo is **stale** (it describes a pre-migration
> Vite/React SPA with no auth). Its "critical" items are already resolved in the current
> code — see the reconciliation note at the bottom. Do **not** re-open those tasks.

---

## P0 — Critical / Blocking

_None. The app builds, all tests pass, no broken or insecure feature blocks use._
(Verification tasks that gate a production release are tracked under P1 below.)

---

## P1 — Important

_None open._

---

## P2 — Improvements

_None open._

---

## Missing Features (new work — mirrors backend-eaz/tasks.md's "Missing Features" section)

- [ ] **T45 · Pre-order support for products** — storefront side of the pre-order feature; the
  model/order/payment design lives in `backend-eaz/tasks.md` → T45. Currently the shop blocks
  add-to-cart / checkout on zero stock, so items that are out of stock or not yet available in
  Ghana can't be ordered at all.
  - **What this needs here:** product card + detail page show a "Pre-order" badge and
    expected-availability copy (from the backend `preorder.availableFrom`/`note` fields)
    instead of "Out of stock"; the add-to-cart button becomes "Pre-order" for those items;
    the cart/checkout surfaces that a line item is a pre-order.
  - **Open questions (resolve with backend before building):** upfront payment vs. deposit
    changes the checkout copy/flow; how a pre-order line renders in order history / track-order.
  - **Backend:** `backend-eaz/tasks.md` → T45.

---

## Ad-hoc fixes (found during work, outside the original audit)

- [ ] **T43 · Money display bypasses the single `formatGhs` formatter**
  - **Issue:** The convention is to render money with `formatGhs(pesewas)` from `lib/shop.js`.
    These pages hand-roll `GH₵{...toFixed(2)}` / `GH₵{...toLocaleString()}` raw templates:
  - **Location:**
    - `src/app/dashboard/pos/sell/page.jsx` (~lines 416, 435, 462, 481, 536, 565)
    - `src/app/dashboard/pos/jobs/new/page.jsx` (~lines 456, 463, 469)
    - `src/app/dashboard/pos/jobs/[id]/page.jsx` (~lines 426, 435, 540, 546, 552)
    - `src/app/dashboard/pos/jobs/[id]/_components/JobInvoice.jsx` (~lines 38–89)
    - `src/components/pos/PosOverview.jsx` (~lines 69, 70, 77, 95)
    - `src/app/dashboard/page.jsx` (~lines 242–243)
    - `src/app/track/[token]/page.jsx` (~lines 378, 383)
    - `src/components/pos/Receipt.jsx` (~lines 100–108)
  - **Fix:** Replace with `formatGhs(value)` where `value` is integer pesewas (POS/shop). For
    the float-GHS hosting/domain/service pages, either convert to pesewas or keep raw — see
    T44 for that decision. Track both together.
  - **Status: POS/shop portion partially shipped 2026-08-21 — the fix note's premise
    ("value is integer pesewas") turned out to be false for most of the listed locations.
    User asked to verify before touching anything; audit below, then scoped to the safe
    subset.**
  - **Audit of all 8 locations (confirmed before any fix, per user's request):**
    - **Genuine bugs — shipped:** `PosOverview.jsx:69,70,77` (`stats.totalRevenue`/
      `todayRevenue`/`totalExpenses` hand-rolled `/100`+`toLocaleString()`, while
      `stats.netProfit` right below correctly used `formatGhs` on the same object);
      `dashboard/page.jsx:242,243` (same pattern; `o.total` elsewhere in the file
      correctly used `formatGhs`); `Receipt.jsx:100,103,105,106,108` (a local `c(n)`
      helper duplicated `formatGhs`'s own `/100`+`toFixed(2)` logic).
    - **NOT bugs — left alone:** `sell/page.jsx`, `jobs/new/page.jsx`,
      `jobs/[id]/page.jsx`, and `JobInvoice.jsx` all deliberately convert
      pesewas→cedis the moment an item enters cart/form state (e.g.
      `jobs/[id]/page.jsx` has explicit `// pesewas → cedis` comments; `JobInvoice.jsx`
      has a file-header doc-comment saying exactly this), then convert back to
      pesewas only at the API-submission boundary. The flagged `toFixed(2)`/
      `toLocaleString()` lines are correct today *because* of this — wrapping them in
      `formatGhs` as-is would silently divide every number by 100 twice (a 100x-too-small
      display bug). Fixing this properly means refactoring 4 files' state to hold
      pesewas throughout, a materially bigger change than a display-formatter swap;
      user declined that scope for now, keeping T43 as a display fix only.
    - **Judgment call — left alone:** `PosOverview.jsx:95` is a compact "1.2k"-style
      chart-bar-label abbreviation for large pesewas totals — a different formatting
      job than `formatGhs`'s always-full-precision output, not an omission.
    - **Out of scope — belongs to T41:** `track/[token]/page.jsx:378,383`
      (`unitPriceGhs`/`partsSubtotalGhs`) is T41's documented float-GHS-cart issue, whose
      own fix note explicitly says the real fix is a cart-unit refactor there, not a
      display swap here. Every *other* money display in that file (11 other call sites)
      already correctly uses `formatGhs` — confirmed no bug there.
  - **Shipped:**
    - `src/components/pos/PosOverview.jsx` — 3 stat tiles switched to `formatGhs`.
    - `src/app/dashboard/page.jsx` — 2 stat tiles switched to `formatGhs`.
    - `src/components/pos/Receipt.jsx` — totals section (`Subtotal`/`Discount`/`TOTAL`/
      `Paid`/`Change`) switched to `formatGhs`; kept the local `c(n)` helper narrowly for
      the item-table cells, which intentionally omit the "GH₵" prefix per row (the
      column header already carries it, and the receipt is print-width constrained) —
      not the same bug, so not folded into the formatGhs swap.
    - `src/components/pos/PosOverview.test.jsx` (new, 1 test) and
      `src/components/pos/Receipt.test.jsx` (new, 4 tests): assert the fixed tiles/rows
      render via `formatGhs`'s exact output, and that the Receipt item-table cell stays
      prefix-free (no double "GH₵").
  - **Remaining (not this pass):** items 4–7 above (cedis-state refactor across
    `sell/page.jsx`, `jobs/new/page.jsx`, `jobs/[id]/page.jsx`, `JobInvoice.jsx`) would
    need their own task if the codebase later wants full pesewas-throughout consistency;
    `track/[token]/page.jsx:378,383` is T41's to fix, not T43's.
  - **Verified:** `PosOverview.test.jsx` + `Receipt.test.jsx` 5/5 pass; `next lint` 0
    warnings/errors; full suite `npm test` 13 files / 78 tests pass; `npm run build`
    compiles successfully, exit 0.

---

## Notes / Reconciliation with `AUDIT_REPORT.md` (stale)

`AUDIT_REPORT.md` predates the migration to the current stack and is **superseded** by
`AUDIT.md`. Its items were checked against today's code:

| AUDIT_REPORT.md claim | Status in current code |
|-----------------------|------------------------|
| "Auth API missing / frontend calls non-existent `/auth/*`" | ✅ **Resolved** — full auth is implemented and mounted (`authRoutes`, `protect`, `restrictTo`, JWT cookie, 2FA, reset). |
| "No auth on contacts/projects/uploads/domain orders" | ✅ **Resolved** — all gated with `protect`/`restrictTo('admin')`; IDOR ownership checks on orders/domains/hosting (test-backed). |
| "DomainOrder create will fail (schema mismatch)" | ✅ **Resolved** — domain payment + retry flows are test-backed and passing. |
| "Env/PORT mismatch, Vite proxy can't reach API" | ✅ **N/A** — no Vite; Next.js rewrites → `NEXT_PUBLIC_API_URL`; backend on 5000. |
| "Debug `console.log` in `DomainAndHostingPricingSection.jsx`" | ✅ **N/A** — that Vite component no longer exists. |
| "Not on target stack (Next.js/Tailwind/Namecheap/PM2/Nginx)" | ✅ **Done** — current stack is exactly that. |
| "npm audit vulnerabilities" (Vite/react-router/styled-components CVEs) | ➡️ **Superseded** — re-audit the current deps under **T11**; old CVE list is obsolete. |

**Recommendation:** treat `AUDIT.md` + `backend-eaz/tasks.md` + `frontend-eaz/tasks.md` as
authoritative; archive or delete `AUDIT_REPORT.md` to avoid confusion.
