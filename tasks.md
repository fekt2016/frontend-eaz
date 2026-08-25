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

- [x] **T45 · Pre-order support for products** — ✅ done 2026-08-25 (both halves) — storefront side of the pre-order feature; the
  model/order/payment design lives in `backend-eaz/tasks.md` → T45. Currently the shop blocks
  add-to-cart / checkout on zero stock, so items that are out of stock or not yet available in
  Ghana can't be ordered at all.
  - **What this needs here:** product card + detail page show a "Pre-order" badge and
    expected-availability copy (from the backend `preorder.availableFrom`/`note` fields)
    instead of "Out of stock"; the add-to-cart button becomes "Pre-order" for those items;
    the cart/checkout surfaces that a line item is a pre-order.
  - **Decisions (2026-08-25):** paid in full up front, an optional per-product cap,
    staff release the order manually once stock lands, email at release. See
    `backend-eaz/tasks.md` → T45 for the reasoning.
  - **Shipped:**
    - `lib/shop.js` — `stockBadge(stock, preorderEnabled)` (the second argument is
      optional, so every existing caller is unchanged), plus `canPreorder` and
      `preorderAvailability`. `canPreorder` mirrors the server rule exactly: offering
      what checkout would refuse, or refusing what it would allow, are both bugs the
      customer sees.
    - `ShopGrid.jsx` / `RecentProducts.jsx` — the card badge reads "Pre-order" rather
      than a dead "Out of stock", and the shop card's line says "Available to pre-order".
    - `ProductDetail.jsx` — the button becomes **Pre-order** and stays enabled; the
      quantity ceiling switches to the product's cap; the copy says the shopper pays now
      and gives the expected date, the note and the limit. An in-stock product is still
      sold normally however the flag is set.
    - `dashboard/commerce/preorders/page.jsx` (new) — the release queue: waiting orders
      oldest-first, only the lines actually waiting, and a Release button that surfaces
      the server's reason when the stock has not really arrived.
    - `useOrders.js` — `usePreorders` + `useReleasePreorder`, invalidating the whole
      `orders` prefix because a released order also appears in the order lists.
    - `dashboardNav.js` — a Pre-orders entry, since releasing is a recurring job.
  - **Tests:** `lib/preorder.test.js` (8), `ProductDetail.test.jsx` (+4),
    `commerce/preorders/page.test.jsx` (6). Also re-pointed T24's nav test: it asserted
    `marketplaceNav` had exactly **one** entry, which is not what T24 protects — the
    point was that Inventory was merged away, not that the section can never grow.
  - **Verified:** full frontend suite 45 files / 291 tests, exit 0; `next lint` clean.
  - **Backend:** `backend-eaz/tasks.md` → T45.

---

## Ad-hoc fixes (found during work, outside the original audit)

- [x] **T43 · Money display bypasses the single `formatGhs` formatter** — ✅ done 2026-08-25 (both halves)
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
  - **Completed 2026-08-25 — the cedis-state refactor (items 4–7) is done.** All four
    files now hold **integer pesewas** in state and render through `formatGhs`. Only
    genuinely typed values stay cedis strings (`amountPaid`, `discount`, `laborCost`,
    `diagnosisFee`, `payAmount`) — converted once, where they are read.
    - `sell/page.jsx` — cart `unitPrice` keeps the API's pesewas; `subtotal`/`total`/
      `disc`/`paid`/`changeDue` are pesewas; the `×100` at submit is gone because the
      values arrive already converted. Amount-box prefills convert the other way.
    - `jobs/new/page.jsx` — `cost` and `totalParts` in pesewas (display-only here;
      parts post as `{partId, quantity}` and the server re-prices). The
      "covered by payment" check converts the typed side rather than comparing units.
    - `jobs/[id]/page.jsx` — parts `cost`/`costAtTime`, `totalPaid`, and every derived
      total in pesewas, with `laborCostPesewas`/`diagnosisFeePesewas` computed once.
    - `JobInvoice.jsx` — takes pesewas and uses `formatGhs`; its doc-comment said the
      opposite and is rewritten.
  - **The dangerous find.** `useMomoCharge` / `useCardCharge` do
    `Math.round(Number(amount) * 100)` themselves, so they need **cedis**. Handing them
    the now-pesewas `balanceDue` would have charged a GH₵95 repair as **GH₵9,500** on a
    real Mobile Money prompt. The call sites convert explicitly and say why. Two quieter
    unit mixes were fixed alongside: `totalPaid < Number(diagnosisFee)` and a
    `totalParts + Number(laborCost)` visibility guard, both comparing pesewas to cedis
    after the change.
  - **Left converting on purpose:** `printRepairReceipt` renders cedis and is not
    T43's to rewrite, so `handlePrint` converts at that boundary — one place, commented.
  - **Also confirmed fixed elsewhere:** `track/[token]/page.jsx` no longer has the
    float-GHS cart at all (T41 shipped), so that item is closed too.
  - **Tests:** 5 added to `sell/page.test.jsx` (a 9000-pesewas part reads GH₵90.00;
    typed cedis reach the API as pesewas for `amountPaid` and `discount`; change due;
    the underpayment guard at its exact boundary) and 3 to `jobs/[id]/page.test.jsx`
    (invoice totals via `formatGhs`, including explicit "not 100x" assertions; the
    charge hooks receive cedis; labour/diagnosis/part cost round-trip as pesewas).
    The hook mocks now capture their arguments, since that argument is the unit boundary.
  - **Verified:** full frontend suite 43 files / 271 tests, exit 0; `next lint` clean.
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
