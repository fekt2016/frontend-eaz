ed# EazWorld Frontend — Issue & Fix Tracker

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

- [x] **T4 · Add frontend test coverage** ✅ done 2026-08-20
  - **Issue:** Only 3 frontend test files (31 tests) vs. a large app — UI/hook regressions
    can slip through. Backend is well covered (112 tests).
  - **Impact:** MEDIUM (regression risk).
  - **Location:** `frontend-eaz` (vitest)
  - **Fix:** Add tests for checkout, dashboard recent-orders wiring, order tracking page,
    repair parts search, and auth context.
  - **Shipped:**
    - `src/context/AuthContext.test.jsx` — 9 tests: fetch-me on mount, login success/2FA/
      verification-required/other-error, logout-clears-user-even-on-API-failure, register,
      useAuth-outside-provider guard.
    - `src/components/CheckoutForm.test.jsx` — 5 tests: required-field validation, sanitized
      submit + Paystack redirect, registration-period price multiplier, API failure, missing
      `authorizationUrl` fallback.
    - `src/app/dashboard/page.jsx` — exported `RecentOrdersList` (was module-local) so it's
      directly testable; `src/app/dashboard/RecentOrdersList.test.jsx` — 6 tests: loading
      skeleton, empty state, shop-order rendering, part-order rendering, missing-partName/job
      fallback, combined list.
    - `src/hooks/queries/usePublicParts.test.jsx` — 7 tests: query-string construction (q,
      category, both, "all" sentinel, whitespace trim), empty-data fallback, `enabled: false`.
    - `src/app/track/[token]/page.test.jsx` — 6 tests: loading spinner, not-found error state,
      job number/device/fault/status-badge rendering, all-status label mapping, `?paid=1`
      banner, unrecognized-status fallback badge.
  - **Verified:** full frontend suite — 9 files / 67 tests pass (up from 4 files / 31 tests);
    `npm run lint` clean; `npm run build` succeeds.
  - **Source:** AUDIT.md §28, §29 P1

---

## P2 — Improvements

- [x] **T7 · Consolidate data-fetching + drop unused axios** ✅ done 2026-08-20
  - **Issue:** Two patterns coexist (react-query hooks vs. raw `useEffect`+`api.js`);
    `axios` is a dependency on both apps but effectively unused on the client.
  - **Location:** `src/hooks`, various pages, both `package.json`
  - **Fix:** Standardize new/edited code on react-query; migrate the manual part-search
    debounce to the shared `useInventorySearch`; remove the unused axios dep.
  - **Shipped:**
    - `src/hooks/queries/useInventory.js` — `useInventorySearch` now accepts
      `includeProducts`/`retail`/`limit` and folds them into the query key (so a
      parts-only caller and a products-included caller never collide in cache);
      `src/lib/queryKeys.js` — `qk.inventory.search(term, params)` updated to match.
    - `src/app/dashboard/pos/jobs/new/page.jsx` — replaced the hand-rolled
      `useEffect` + `setTimeout` part-search debounce with `useDebounce` +
      `useInventorySearch` (same pattern already used by the job-detail page).
    - `src/app/dashboard/pos/sell/page.jsx` — replaced the "search as you type"
      manual debounce effect with `useDebounce` + `useInventorySearch({ includeProducts:
      true })`; left the imperative Enter/barcode-scan lookup (`qc.fetchQuery` for
      `/pos/scan/:code` + its inventory fallback) as-is — that's a one-shot action on
      a keypress, not a duplicate of the reactive-typing pattern, and it already goes
      through react-query's cache rather than a bespoke fetch.
    - `package.json` — removed the unused `axios` dependency (frontend has zero
      imports of it; `lib/api.js`'s fetch wrapper is the only HTTP client) and ran
      `npm uninstall axios` to update the lockfile.
    - **Not touched:** `backend-eaz/package.json`'s `axios` — confirmed it's actively
      used by `services/whm.js`, `services/cyberpanel.js`, `services/namecheap.js`;
      removing it there would break those integrations.
    - `src/app/dashboard/commerce/inventory/page.jsx` intentionally left on its own
      `useEffect`+`api.js` fetch — it's a paginated list/filter admin page, not a
      typeahead search, so it isn't an instance of the duplicated debounce pattern
      this task targets.
  - **Verified:** full frontend suite — 9 files / 67 tests pass; `npm run lint` clean;
    `npm run build` succeeds. Not verified in a live browser — this host has no working
    headless/real browser (Playwright dropped macOS 12 support, see T3a); only the
    internal data-fetching logic changed, JSX/rendering was untouched.
  - **Source:** AUDIT.md §20, §27 (#1, #3)

- [x] **T8 · Update to the renamed `unitPricePesewas`/`amountPesewas` POS field names** ✅ done 2026-08-20
  - **Issue:** Originally filed as backend-only (`backend-eaz/tasks.md` → T8: rename
    `PartOrder`/`RepairOrder`'s misleadingly-named `unitPriceGhs`/`amountGhs` fields —
    already pesewas post money-migration — to `unitPricePesewas`/`amountPesewas`). Turned
    out **not** to be backend-only: those field names are part of the API response
    contract for two frontend pages, so the rename would have silently broken them
    (`formatGhs(undefined)` → `GH₵0.00`) if left unchanged.
  - **Location:** `src/app/track/[token]/page.jsx` (public repair-tracking page — parts
    list + part-order history), `src/app/dashboard/pos/orders/page.jsx` (staff POS
    orders list)
  - **Fix:** Read the new field names from the API responses.
  - **Shipped:**
    - `src/app/track/[token]/page.jsx` — `part.priceGhs` → `part.pricePesewas` (parts
      list price + the value passed into `addToCart`'s `sellingPrice`), `o.amountGhs` →
      `o.amountPesewas` (part-order history row).
    - `src/app/dashboard/pos/orders/page.jsx` — `order.amountGhs` → `order.amountPesewas`
      (staff orders list amount column).
    - **Not touched (deliberately):** `track/[token]/page.jsx` also has a *local*,
      client-only cart-state field that happens to share the old name
      (`cart[].unitPriceGhs`, `partsSubtotalGhs` — derived as `part.sellingPrice / 100`
      for display, never sent to or read from the backend). It's a naming coincidence,
      not the same field, and isn't part of this API-contract fix — flagged in
      `backend-eaz/tasks.md` → T8 as a residual quirk if a future cleanup wants it.
  - **Verified:** `npm run lint` on both files clean; `npm run build` succeeds
    (`/track/[token]` and `/dashboard/pos/orders` both compile). Not verified in a live
    browser — see T7's note on this host's browser limitation.
  - **Source:** `backend-eaz/tasks.md` T8 (AUDIT.md §27 (#4))

- [x] **T9 · Remove dead `/dashboard/pos/inventory` route dir** ✅ already resolved — confirmed 2026-08-20
  - **Issue:** Directory exists with no `page.jsx` (inventory lives under
    `/dashboard/commerce/inventory`).
  - **Location:** `src/app/dashboard/pos/inventory/`
  - **Fix:** Delete the empty directory.
  - **Verified:** `src/app/dashboard/pos/inventory/` does not exist on disk, and no file
    in the codebase references `dashboard/pos/inventory` — already gone before this task
    was picked up (removed at some earlier, undated point). No code change made.
  - **Source:** AUDIT.md §3 note, §27 (#5)

- [x] **T17 · Registration form: allow email OR phone** — ✅ done 2026-08-23
  - **Issue:** The register form marks `email` as required, but users should be able to
    register using **either** an email **or** a phone number. (Backend schema/controller
    changes live in `backend-eaz/tasks.md` → T17.)
  - **Location:** `src/app/auth/register/page.jsx`
  - **Fix:** Make email optional when phone is provided (and vice versa); require at least
    one identifier on the client. Adjust the redirect on registration to send verification
    to whichever identifier was chosen. Match the backend validation.
  - **Backend part:** `backend-eaz/tasks.md` → T17.
  - **Shipped:**
    - **`src/app/auth/register/page.jsx`** — dropped the email input's hard `required`
      attribute (a phone-only submit must not be native-HTML5-blocked); validation now
      requires name + password + (email OR phone), matching the backend's rule exactly.
      The post-register redirect to `/auth/verify` now picks `?email=` or `?phone=` based
      on whichever identifier was actually submitted, instead of always assuming email
      (the original code even had a latent bug here — it read the raw `email` state, not
      the sanitized `cleanEmail`, for the redirect).
    - **`src/app/auth/verify/page.jsx`** — turned out to need real changes too, not just
      "receive whichever param the redirect sends": the whole page was hardcoded to
      `email` — the query param name, the header copy ("Check your email"), the fallback
      identifier input, and both the `verify-pin`/`resend-pin` request bodies. Now reads
      `email` or `phone` from the query string, and when neither is present (direct
      navigation) shows one generic "Email or phone number" input; on submit, the typed/
      pre-filled value is sent as `{ email }` or `{ phone }` based on a simple
      `/\S+@\S+\.\S+/` shape check (mirrors the backend's own detection in `verifyPin`/
      `resendPin`). Header, icon, and button copy ("Check your email/phone", "Verify
      Email/Phone →") switch on which param arrived.
    - **`src/app/auth/login/page.jsx`** — found and fixed the same gap on the "please
      verify your account" redirect from a failed login: it always built `?email=...`
      even when the account backend returned no `email` (a phone-only account) and fell
      back to whatever the user typed to log in, which could be a phone number labeled as
      `email`. Now picks the matching param name by the same shape check. Small,
      necessary for a phone-only account to ever reach a correctly-labeled verify page
      via this path — not a separate task, this is the same T17 redirect concern.
    - `src/app/auth/register/page.test.jsx` (4 tests) + `src/app/auth/verify/page.test.jsx`
      (4 tests) — email-only and phone-only registration redirect targets, neither-given
      rejected without calling the API, verify page pre-filled by each query param vs.
      typed-in fallback (detected by shape), and resend showing the phone-specific
      success message. `login/page.test.jsx`'s existing 5 tests unaffected.
  - **Verified:** full suite 30 files/146 tests pass (up from 28/138); `npm run lint` 0
    errors; `next build` succeeds.

- [x] **T18 · Hide "Cancel Job" button once job is ready + add confirmation modal** — ✅
  done 2026-08-23
  - **Issue:** On the repair job detail page, the "Cancel Job" button is shown for statuses
    `received`, `diagnosing`, `repairing`, **and `ready`** — but once a job is `ready` for
    collection it should no longer be cancellable, so the button should hide at that stage.
  - **Also requested:** The "Cancel Job" button should not cancel immediately — it should
    open a **confirmation/warning modal** first, and the cancellation only happens when the
    user confirms (or is aborted) from the modal.
  - **Location:** `src/app/dashboard/pos/jobs/[id]/page.jsx` (~line 499,
    `["received","diagnosing","repairing","ready"].includes(status)`)
  - **Fix:** Remove `ready` from the status list that renders the "Cancel Job" button
    (i.e. only show cancel for `received`/`diagnosing`/`repairing`); replace the immediate
    `quickStatus("cancelled")` call with a confirmation modal, then cancel on confirm.
  - **Backend parity:** `backend-eaz/tasks.md` → T18.
  - **Shipped:**
    - The button's status list (line ~592 by the time this landed, the file had grown
      since the fix note was written) had `waiting_for_parts` in it already, which the fix
      note's literal `received`/`diagnosing`/`repairing` list didn't mention — kept it
      rather than removing it: the backend's `canTransitionJobStatus` guard (T53) already
      allows `cancelled` from any live status except `ready`, including
      `waiting_for_parts`, so dropping it here would have hidden a capability the backend
      still permits. Only `ready` was removed, matching backend parity exactly rather
      than the fix note's narrower literal list.
    - New `showCancelConfirm` state; the button now opens a modal instead of calling
      `quickStatus("cancelled")` directly. Modal styling mirrors the existing block/
      unblock-user confirm modal in `src/app/dashboard/(admin)/users/page.jsx` (this
      app's only prior confirm-modal precedent — no shared component existed to reuse).
      "Keep Job" closes without effect; "Cancel Job" (confirm) closes the modal and then
      fires the same `quickStatus("cancelled")` call as before.
    - `page.test.jsx` (new, 5 tests): button shown for a live non-ready status, hidden for
      `ready`, clicking opens the modal without patching yet, "Keep Job" closes without
      patching, confirming patches `{ status: "cancelled" }`.
  - **Verified:** full suite 31 files/151 tests pass (up from 30/146); `npm run lint` 0
    errors; `next build` succeeds.

---

## Missing Features (new work — mirrors backend-eaz/tasks.md's "Missing Features" section)

- [x] **T12 · In-app notifications / alert center** — filed backend-only in `backend-eaz/tasks.md`,
  turned out to need frontend work too (see that entry for the full scope/decisions/bug-fix note).
  - **What shipped here:** `hooks/queries/useNotifications.js` (list/unread-count/mark-read/
    mark-all-read, matching the app's existing react-query hook conventions); `NotificationBell`
    (bell + unread badge + recent-notifications dropdown) wired into both `DashboardShell`'s and
    `PosShell`'s topbars — `/dashboard/commerce` already reuses `DashboardShell` via its own
    `layout.jsx`, so it needed no separate change; a `/dashboard/notifications` page (all/unread
    filter, pagination, mark-all-read), following the existing pager pattern from
    `pos/expenses/page.jsx`.
  - **Unread-badge polling:** `refetchInterval: 30_000` — matches the app's global 30s
    `staleTime` default (`lib/queryClient.js`); auto-pauses while the tab is backgrounded
    (react-query default).
  - **Tests:** `useNotifications.test.jsx` (7 tests: unread-count shape/default, list query-string
    building, mark-read/mark-all-read mutations). Full `vitest run`: 27 files / 126 tests passed.
    Lint clean; `next build` succeeded (`/dashboard/notifications` compiles).
  - **Backend:** `backend-eaz/tasks.md` → T12.

- [x] **T14 · General business settings** — filed backend-only in `backend-eaz/tasks.md`,
  turned out to need frontend work too (see that entry for the full scope/decisions/bug-fix note).
  The backend (T6, done earlier) already supported editing `Settings.business` via
  `PATCH /api/v1/settings`; there was simply no admin UI for it anywhere in the app —
  `/dashboard/settings` is the personal account page shared by every role, not a
  business-settings editor.
  - **What shipped here:** new admin-only `/dashboard/business-settings` page — Shop Profile
    (name/phone/WhatsApp/email/location/hours/consultation path), Services & Pricing
    (add/edit/remove rows, saved as a whole-list replace matching the backend's contract),
    and Tax / VAT (the 4 new T14 fields, display-only — no order/checkout math reads them).
    Reuses the existing `useSettings`/`useUpdateSettings` hooks unchanged. New `adminNav`
    sidebar entry; the page sits under the `(admin)` route group so it inherits that group's
    existing admin/superadmin role gate for free.
  - **Bug found + fixed:** the VAT-rate input had both `max="100"` and a JS clamp-on-submit.
    HTML5 constraint validation silently blocks form submission when a number input exceeds
    its `max` — so a user typing an out-of-range value and clicking Save would hit a native
    validation block and nothing would happen, never reaching the JS clamp. Removed `max`
    (kept `min="0"`), matching this app's existing convention (e.g. the repair-job labour-cost
    input) of leaving upper-bound enforcement to the backend rather than a native `max`
    attribute. A test that deliberately submitted 250 caught this — it got 0 mock calls
    instead of the expected clamped `100` payload.
  - **Tests:** `page.test.jsx` (5 tests: renders fetched values across all 3 sections, saves
    shop profile, hides/shows + saves VAT fields on toggle, the vatRate-clamp regression,
    add/remove service row). Full `vitest run`: 28 files / 131 tests passed. Lint clean;
    `next build` succeeded (`/dashboard/business-settings` compiles).
  - **Backend:** `backend-eaz/tasks.md` → T14.

- [x] **T15 · Refunds** — filed backend-only in `backend-eaz/tasks.md`, turned out to need a
  small frontend addition too (see that entry for the full design writeup — atomicity,
  crash-safety ordering, webhook-recovery paths, and the live sandbox finding that changed
  the reconcile job's polling interval).
  - **What shipped here:** a `RefundSection` on the admin order detail page
    (`/dashboard/orders/[id]`), admin-only (staff excluded, matching the backend's role
    gate) — a confirm-then-submit "Refund this order" flow (full amount, optional reason)
    when the order is in a refundable state; a "Refund in progress" state with a manual
    "Check status now" button (`POST /orders/:id/refund/sync`) for when the
    refund.processed webhook doesn't arrive; a "Refunded" state with the amount/date; and a
    "Refund failed" state linking to the Activity Log (no retry UI — see the backend
    entry's explicit out-of-scope note on why). Matches this page's existing raw-`api`-call
    style rather than introducing react-query hooks into a page that doesn't use them.
  - **Tests:** 7 new tests in the existing `page.test.jsx` (button visibility for
    admin/staff/ineligible-status, confirm-and-submit, check-status, completed, failed).
    Full `vitest run`: 28 files / 138 tests passed. Lint clean; `next build` succeeded.
  - **Backend:** `backend-eaz/tasks.md` → T15.

---

## Ad-hoc fixes (found during work, outside the original audit)

- [x] **T61 · 2FA PIN email logged as `other` — not filterable in EmailLog** ✅ done 2026-08-20
  - **Issue:** Backend — `utils/email.js` `sendTwoFactorPin` sends `type: 'other'` (line 284), so
    2FA code emails land in `EmailLog` under `other` and can't be filtered.
  - **Location:** backend — `utils/email.js:281-284`; frontend — `src/app/dashboard/(admin)/emails/page.jsx`
    `TYPE_LABELS` (15-26) + `typeColors` (39+).
  - **Fix:** Backend change `type` to `'two_factor'`; **frontend part** — add
    `two_factor: "2FA Pin"` to `TYPE_LABELS` and a `typeColors` entry on the emails page so the
    filter shows the new type.
  - **Backend detail:** `backend-eaz/tasks.md` → T61.
  - **Shipped:** `src/app/dashboard/(admin)/emails/page.jsx` — added
    `two_factor: "2FA Pin"` to `TYPE_LABELS` (the filter dropdown is generated from this
    object, so no separate dropdown change needed) and an amber entry to `typeColors`
    (unused color in the existing palette). `npm run lint` clean on the file; `next build`
    succeeds.

- [x] **T60 · Hosting `createOrder` returns 500 instead of 400 for unknown plan/tier** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T60 for the full Shipped/Verified notes
  - **Issue:** Backend — `getPlanPrice` **throws** on unknown `planType`/`tier`
    (`config/hostingPlans.js:330-336`) and `createOrder` doesn't catch it, so a bad plan hits
    the 500 error handler instead of the intended 400. The `planTotal == null` check only covers
    the `cloud/enterprise` custom tier.
  - **Location:** backend — `config/hostingPlans.js` (`getPlanPrice` 328-336),
    `controllers/hostingOrderController.js:77`.
  - **Fix:** Backend change only — return `{ total: null }` for unknown type/tier so the existing
    400 path fires; add a test. No frontend work.
  - **Backend detail:** `backend-eaz/tasks.md` → T60.

- [x] **T59 · Service orders: free-form status + unclamped pagination** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T59 for the full Shipped/Verified notes
  - **Issue:** Backend — `updateServiceOrder` persists any `status` string via `findByIdAndUpdate`
    (no validators), and `getServiceOrders` doesn't clamp `page`/`limit`.
  - **Location:** backend — `controllers/serviceOrderController.js` (`getServiceOrders` 133-146,
    `updateServiceOrder` 151-163).
  - **Fix:** Backend change only — validate status (enum + forward-only) and clamp page/limit.
    No frontend work.
  - **Backend detail:** `backend-eaz/tasks.md` → T59.

- [x] **T58 · POS part/repair order status allows backward moves** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T58 for the full Shipped/Verified notes
  - **Issue:** Backend — `updatePartOrder`/`updateRepairOrder` validate the status enum but allow
    `paid → pending`/`paid → cancelled`; cancelling a paid part order leaves the linked job at
    `waiting_for_parts` with no re-evaluation.
  - **Location:** backend — `controllers/pos/inventoryController.js` (`updatePartOrder` 308-332),
    `controllers/pos/jobController.js` (`updateRepairOrder` 802-826).
  - **Fix:** Backend change only — forbid leaving `paid` backwards (mirror `canTransition`) and
    reset the linked job off `waiting_for_parts` when a paid part order is cancelled. No frontend work.
  - **Backend detail:** `backend-eaz/tasks.md` → T58.

- [x] **T57 · POS `updateJob` accepts money fields from technicians (bill understatement)** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T57 for the full Shipped/Verified notes
  - **Issue:** Backend — `PATCH /pos/jobs/:id` is open to all POS roles incl. `technician`, and
    `jobController.updateJob` applies `laborCost`, `depositPaid`, `diagnosisFee`, and client-priced
    custom parts straight from the body. Inventory parts are price-anchored to `Part.sellingPrice`,
    but a technician can zero `laborCost`, add free custom parts, or claim a `depositPaid`.
  - **Location:** backend — `controllers/pos/jobController.js` (`updateJob` lines 327-334, 341-367);
    `routes/posRoutes.js:62`.
  - **Fix:** Backend change only — role-guard the money fields (staff/admin for `depositPaid` +
    client-priced custom parts) and add a test. No frontend work.
  - **Backend detail:** `backend-eaz/tasks.md` → T57.

- [x] **T56 · POS job detail page missing `waiting_for_parts` status** ✅ done 2026-08-20
  - **Issue:** `src/app/dashboard/pos/jobs/[id]/page.jsx:29` — `STATUSES` omits `waiting_for_parts`,
    a real backend status set by the online part-order webhook. A job in that state shows an
    unmapped `<select>` value and has no quick-action button, so staff can't advance it with one tap.
  - **Location:** `src/app/dashboard/pos/jobs/[id]/page.jsx` — `STATUSES` (line 29), `<select>`
    (306-307), quick-status buttons (468-501).
  - **Fix:** Frontend change only — add `waiting_for_parts` to `STATUSES` and a quick-action case
    (`waiting_for_parts → repairing`).
  - **Backend detail:** n/a — backend already supports the status end-to-end.
  - **Shipped:**
    - `STATUSES` — added `waiting_for_parts` between `diagnosing` and `repairing`, matching
      the backend's own enum order (`RepairJob.status`).
    - Quick-action buttons — new `status === "waiting_for_parts"` block: "Parts arrived →
      Start Repairing" (`quickStatus("repairing")`), same pattern as the other status
      blocks. Also added `waiting_for_parts` to the cancel-eligible array (it's an active,
      non-terminal status — matches the backend's own `ACTIVE_JOB_STATUSES` treating it as
      equally active/cancellable as `received`/`diagnosing`/`repairing`/`ready`).
    - `_components/jobStatus.js` — added a `waiting_for_parts` entry to `STATUS_COLORS`
      (amber, distinct from the six existing colors on this page) and a new
      `STATUS_LABELS`/`statusLabel()` export, since the existing
      `s.charAt(0).toUpperCase() + s.slice(1)` capitalize logic (and the `<p className="capitalize">`
      CSS approach) both render snake_case badly (`Waiting_for_parts`). `statusLabel()` maps
      `waiting_for_parts` → `"Waiting for Parts"`, matching the copy already used on the
      public `track/[token]` page for the same status, and falls back to the old
      capitalize-first-letter behavior for every other (single-word) status.
    - `page.jsx`'s `<select>` options and status banner, and `JobInvoice.jsx`'s status
      badge, all switched to `statusLabel()` — the badge/label fix wasn't explicitly in
      the task's location list (JobInvoice.jsx has the identical capitalize pattern) but
      was cheap and directly served the task's own goal (no unmapped/ugly status
      display), so included it.
    - No test added — this repo's frontend test suite doesn't yet cover the authenticated
      POS job-detail page (T4's coverage was checkout/dashboard-recent-orders/track/
      parts-search/auth-context), and the task's own fix note didn't ask for one.
  - **Verified:** `npm run lint` clean on all 3 touched files; `next build` succeeds; full
    vitest suite (9 files / 67 tests) still passes.

- [x] **T55 · Credentials/PINs generated with non-crypto `Math.random()`** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T55 for the full Shipped/Verified notes
  - **Issue:** Backend — 6-digit verification/2FA PINs (`authController.js:11` generatePin, 4 call
    sites) and cPanel/CyberPanel account passwords (`whm.js`, `cyberpanel.js`) are generated with
    `Math.random`, a PRNG not a CSPRNG; compounds the PIN brute-force risk in T46.
  - **Location:** backend — `controllers/authController.js:11`, `services/whm.js:22-31`,
    `services/cyberpanel.js:22-28`.
  - **Fix:** Backend change only — `crypto.randomInt` for the PIN, `crypto.randomBytes`/`randomInt`
    for passwords; add a PIN range/format test. No frontend work.
  - **Backend detail:** `backend-eaz/tasks.md` → T55.

- [x] **T54 · Hosting order domain fee is client-trusted — Namecheap lookup never matches** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T54 for the full Shipped/Verified notes
  - **Issue:** Backend — `hostingOrderController.createOrder` indexes `getPricing()` with a
    dot-less TLD (`"com"`) while the price map keys are dot-prefixed (`".com"`), so the
    server-side price always misses and the client-supplied `domainRegistrationFee` (capped
    GH₵0–500) is trusted. A buyer can zero it out (free domain on a hosting order).
  - **Location:** backend — `controllers/hostingOrderController.js` (`createOrder` ~lines 84-104).
  - **Fix:** Backend change only — use `extractTLD(domain_s)` for the lookup and drop the
    redundant USD→GHS re-conversion. No frontend work (checkout already shows the server price).
  - **Backend detail:** `backend-eaz/tasks.md` → T54.

- [x] **T53 · POS `updateJob` allows backward / terminal-to-live status transitions** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T53 for the full Shipped/Verified notes
  - **Issue:** Backend — `jobController.updateJob` sets `job.status` with no transition
    validation (unlike `orderController.canTransition`), so a repair job can move backwards
    (`collected`→`received`) or out of a terminal state (`cancelled`→`repairing`); `completedAt`/
    `warrantyExpires` are never cleared on backward moves.
  - **Location:** backend — `controllers/pos/jobController.js` (`updateJob`), `models/RepairJob.js`.
  - **Fix:** Backend change only — forward-only `STATUS_RANK` guard mirroring
    `orderController.canTransition`, `cancelled` terminal, clear `completedAt`/`warrantyExpires`
    on backward moves. No frontend work beyond the existing T18 cancel-guard UI.
  - **Backend detail:** `backend-eaz/tasks.md` → T53.

- [x] **T52 · Dashboard admin gates exclude superadmin** ✅ done 2026-08-21
  - **Issue:** Multiple admin pages gate on `user?.role === "admin"` / `!== "admin"`; a superadmin
    (site owner) is redirected away or the admin data never loads: hosting-orders (redirects),
    domain-orders (redirects + query disabled), consultations, blog, chats, users (no auto-fetch),
    emails, hosting order detail.
  - **Location:** `src/app/dashboard/(admin)/hosting-orders/page.jsx:107`;
    `domain-orders/page.jsx:35,38,41,57`; `consultations/page.jsx:187,207,231`;
    `blog/page.jsx:126,140,186`; `chats/page.jsx:58,63`; `users/page.jsx:511`;
    `emails/page.jsx:71`; `src/app/dashboard/hosting/[orderId]/page.jsx:176`.
  - **Fix:** Use `["admin", "superadmin"].includes(user?.role)` everywhere admin views are gated
    (ideally a small shared helper in `lib/`). `middleware.js` and `DashboardShell` already handle
    superadmin correctly.
  - **Backend parity:** `backend-eaz/tasks.md` → T52.
  - **Shipped:**
    - `src/lib/roles.js` (new) — `ADMIN_ROLES = ["admin", "superadmin"]` + `isAdminRole(role)`,
      per the fix note's "ideally a small shared helper" (15 call sites across 8 files
      justified it, unlike the backend's 8 one-off sites in T51).
    - Swapped all 15 gate sites to `isAdminRole(user?.role)` /
      `!isAdminRole(user?.role)`: `hosting-orders/page.jsx` (4 — redirect guard + 2 fetch
      guards + render guard, line numbers shifted to 108/141/146/222 since the audit was
      written), `domain-orders/page.jsx` (1, the derived `isAdmin` var reused at the other
      3 audit-listed lines), `consultations/page.jsx` (3), `blog/page.jsx` (3),
      `chats/page.jsx` (2), `users/page.jsx` (1 — the fetch guard; the page itself had no
      redirect guard to begin with), `emails/page.jsx` (1), `hosting/[orderId]/page.jsx` (1).
    - **Deliberately left alone:** `chats/page.jsx`'s `msg.role === "admin"` (~line 500) —
      that's labeling a chat message's author, not a page gate, out of scope.
      `activity-logs/page.jsx:201` was already correct
      (`user?.role === "admin" || user?.role === "superadmin"`), confirming the audit's
      claim that some pages already handle this right.
    - `src/lib/roles.test.js` (new, 2 tests): admin/superadmin both pass; staff/technician/
      user/undefined all fail.
  - **Verified:** `npm test` 10 files / 69 tests pass (2 new); `npm run lint` (`next lint`)
    clean, 0 warnings/errors; `npm run build` compiles successfully, exit 0 (the
    `ECONNREFUSED`/`fetch failed` noise mid-build is pre-existing — unrelated pages doing
    server-side data fetching at static-generation time against a backend that isn't
    running in this environment; the 8 touched pages are all `"use client"` and fetch
    their admin data from a `useEffect` after mount, so they hit no such fetch during the
    build's static-generation step regardless of their `○`/`ƒ` marker).

- [x] **T51 · Backend hosting/domain order routes downgrade superadmin to regular user** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T51 for the full Shipped/Verified notes
  - **Issue:** Backend — `protect`-only hosting/domain order routes re-check
    `req.user.role === 'admin'` in the controller, so a superadmin sees only their own orders and
    gets 403 on other users' orders, invoices, cPanel SSO, service status, and cPanel password
    resets (the same views these admin dashboards render).
  - **Location:** backend — `controllers/hostingOrderController.js`,
    `controllers/domainController.js`.
  - **Fix:** Backend change only (route-level `restrictTo('admin')` or superadmin-aware checks).
  - **Backend detail:** `backend-eaz/tasks.md` → T51.

- [x] **T50 · `resetPassword` / `verifyPin` don't check `isBlocked`** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T50 for the full Shipped/Verified notes
  - **Issue:** Backend — a blocked user with a valid reset link or verification PIN can obtain
    a fresh token because `resetPassword`/`verifyPin` don't gate on `isBlocked` (unlike
    `login`). Impact limited (protect rejects on next request).
  - **Location:** backend — `controllers/authController.js`.
  - **Fix:** Backend change only. No frontend work.

- [x] **T49 · `verifyPin` / `twoFactorPin` stored and compared in plaintext** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T49 for the full Shipped/Verified notes
  - **Issue:** Backend — 6-digit PINs stored unhashed on `User` and compared with plain `!==`.
  - **Location:** backend — `models/User.js`, `controllers/authController.js`.
  - **Fix:** Backend change only (hash or constant-time compare). No frontend work.

- [x] **T48 · `api.js` drops the `requiresVerification` flag from error responses** ✅ done 2026-08-21
  - **Issue:** Login 403 for an unverified account sends `requiresVerification: true` + `email`
    in the body, but `lib/api.js` only copies `error`/`errors`/`status` onto the thrown Error.
    `AuthContext.login` therefore depends on brittle message matching
    (`err.message.toLowerCase().includes('verify')`).
  - **Location:** `src/lib/api.js` (error construction ~lines 20–26),
    `src/context/AuthContext.jsx` (login ~lines 32–40), `src/app/auth/login/page.jsx`
    (uses `err.requiresVerification` ~line 50).
  - **Fix:** In `api.js`, spread the rest of `data` onto the Error (`Object.assign(err, data)`)
    so `requiresVerification`/`email` survive; in `AuthContext.login`, check
    `err.requiresVerification` instead of message text, and forward `err.email` to the verify
    redirect.
  - **Backend:** none needed (see `backend-eaz/tasks.md` → T48).
  - **Shipped:**
    - `src/lib/api.js` — on a non-ok response, forwards every other JSON body field
      (e.g. `requiresVerification`, `email`, `success`) onto the thrown `Error`, skipping
      only `error`/`message`/`stack` so they can't clobber the Error's own fields
      (avoided a destructure-and-omit here since `next lint`'s `no-unused-vars` doesn't
      allow the `_prefix` escape hatch the backend's ESLint config does — used an
      explicit skip-set + `for...of` instead).
    - `src/context/AuthContext.jsx` (`login`) — dropped the message-text-matching
      workaround (`err.message.toLowerCase().includes('verify')`) entirely; `api.js` now
      attaches the real flag, so `login` just lets the error propagate unchanged.
    - `src/app/auth/login/page.jsx` — verify-redirect now prefers the backend's
      `err.email` over the client-typed `cleanIdentifier`, falling back to it if absent.
    - `src/lib/api.test.js` (new, 4 tests): message + status on a plain error; extra
      fields (`requiresVerification`, `email`) forwarded; a stray `data.message`/
      `data.stack` does NOT clobber the real `Error.message`/`.stack`; validation
      `errors` array still attached.
    - `src/context/AuthContext.test.jsx` — rewrote the two `login` error tests: the old
      "attaches requiresVerification when the message mentions verify" test asserted the
      now-removed string-matching behavior; replaced with a test asserting `login`
      rethrows `api.js`'s error (mocked) unchanged, including `requiresVerification`/
      `email`. The "rethrows unrelated errors" test needed no behavior change.
  - **Verified:** `src/lib/api.test.js` + `src/context/AuthContext.test.jsx` 13/13 pass;
    `next lint` 0 warnings/errors; full suite `npm test` 11 files / 73 tests pass;
    `npm run build` compiles successfully, exit 0.

- [x] **T47 · `updateProfile` missing phone-uniqueness pre-check** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T47 for the full Shipped/Verified notes
  - **Issue:** Backend — setting an in-use phone via the profile settings form returns an
    unhandled 500 (duplicate-key) instead of a friendly 409.
  - **Location:** backend — `controllers/authController.js` (`updateProfile` ~line 497).
  - **Fix:** Backend change only. No frontend work (error already surfaces in the form).

- [x] **T46 · `/api/v1/auth/verify` rate limit is dead code — PIN endpoints unthrottled** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T46 for the full Shipped/Verified notes
  - **Issue:** Backend — the strict 10/15min limiter is mounted on `/api/v1/auth/verify`, which
    matches nothing; the real `/verify-pin`, `/resend-pin`, `/2fa/verify` routes only get the
    global 150/15min limit, so 6-digit PINs are brute-forceable.
  - **Location:** backend — `app.js` (~line 158), `routes/authRoutes.js`.
  - **Fix:** Backend change only (mount limits on the real paths). No frontend work.

- [x] **T45 · `expenseController`: unescaped supplier regex + no activity logs** ✅ done 2026-08-21 — backend-only, see `backend-eaz/tasks.md` → T45 for the full Shipped/Verified notes
  - **Issue:** `getSuppliers` uses `{ $regex: q }` with no `escapeRegex`; expense/supplier
    mutations aren't activity-logged. Backend-only (see `backend-eaz/tasks.md` → T45).
  - **Location:** backend — `controllers/pos/expenseController.js`.
  - **Fix:** Backend change only. No frontend work.

- [ ] **T44 · Hosting/domain/service amounts stored as major-GHS floats**
  - **Issue:** Hosting/domain/service orders store money as **major GHS floats** (e.g.
    `GH₵{order.amount}`), not integer pesewas. This is a deviation from the money rule and
    is why several of these admin pages render raw `GH₵{...}` instead of `formatGhs`.
  - **Location:** `src/app/dashboard/(admin)/domain-orders/page.jsx` (~lines 96, 171),
    `src/app/dashboard/(admin)/hosting-orders/page.jsx` (~line 422),
    `src/app/dashboard/hosting/[orderId]/page.jsx` (~line 212),
    `src/app/dashboard/hosting/new-account/page.jsx` (~line 150),
    `src/components/dashboard/customer/CustomerCards.jsx` (~lines 67, 118),
    `src/components/CheckoutForm.jsx` (~lines 104, 111),
    `src/components/ServicePaymentModal.jsx` (~lines 123, 127, 252),
    `src/app/services/web-design/page.jsx` (~lines 211, 224),
    `src/app/hosting/page.jsx` (~line 194), `src/components/domains/DomainsSearch.jsx` (~line 20).
  - **Fix (decision needed):** Either migrate these flows to integer pesewas end-to-end
    (backend + webhook + these displays switch to `formatGhs`) or explicitly document the
    float-GHS exception. Backend part: `backend-eaz/tasks.md` → T44.

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

- [ ] **T42 · `BlogArticle` renders markdown via `dangerouslySetInnerHTML` — stored-XSS risk**
  - **Issue:** Blog post content is markdown→HTML-converted with regex and injected via
    `dangerouslySetInnerHTML` (lines 39, 52, 62) with **no escaping**. A post body containing
    HTML/JS (admin-authored or compromised) executes for every reader.
  - **Location:** `src/components/blog/BlogArticle.jsx` (`renderContent` lines 20–67;
    the three `dangerouslySetInnerHTML` usages).
  - **Fix:** Escape HTML entities **before** the markdown regexes (so `**bold**` still works
    but `<script>`/`onclick`/`javascript:` become inert), or render via a safe markdown
    library. Also add a test for a malicious post body.
  - **Backend defense-in-depth:** sanitize post `content` on write — see `backend-eaz/tasks.md`
    → T42.

- [ ] **T41 · Public track page part-order cart mixes float-GHS and pesewas**
  - **Issue:** On `/track/[token]`, `addToCart` stores `unitPriceGhs: Math.round(Number(part.sellingPrice)) / 100`
    (float GHS) and computes `totalPesewas = partsSubtotalGhs * 100 + shippingPesewas`
    (float × 100), while `addPartToShopCart` (line 105) stores integer pesewas
    (`price: Math.round(Number(part.sellingPrice))`). Two cart paths, two money conventions —
    float-rounding risk; display also uses raw `GH₵{...}` (see T43).
  - **Location:** `src/app/track/[token]/page.jsx` (`addToCart` ~line 120, totals ~lines
    124–126, display ~lines 378/383).
  - **Fix:** Keep the part-order cart in **integer pesewas** like `addPartToShopCart`:
    `unitPricePesewas: Math.round(Number(part.sellingPrice))`, subtotal in pesewas, add
    shipping pesewas directly, and display with `formatGhs`. (Backend re-prices from the
    `Part` model — items carry only `partId`+`quantity` — so this is safe.)
  - **Backend:** none needed (see `backend-eaz/tasks.md` → T41).

- [x] **T40 · `authController.logout` calls `jwt.decode` without importing `jsonwebtoken`** ✅ done 2026-08-20
  - **Issue:** Backend bug — `jwt.decode(token)` at `controllers/authController.js` ~line 283
    is a ReferenceError (`jsonwebtoken` never imported). Swallowed by try/catch, so logout
    succeeds but the logout activity entry never records who logged out.
  - **Location:** backend — `controllers/authController.js` (imports lines 1–6; logout
    ~lines 276–303).
  - **Fix:** Backend change only (add `require('jsonwebtoken')`). No frontend work.
  - **Shipped:** see `backend-eaz/tasks.md` → T40 — fixed backend-only, out of queue order,
    surfaced by the new ESLint tooling (T10).

- [ ] **T39 · Product detail page: add Description and Reviews tabs**
  - **Issue:** On `/shop/[slug]` the product description is rendered as a plain paragraph
    under the price (~line 211) and `ProductReviews` is stacked full-width below the
    product grid (~line 323) — a long "small page" you have to scroll. The page should
    instead have **tabs** — e.g. **Description** and **Reviews** — so shoppers can switch
    between the detailed description/specs and the review list without scrolling.
  - **Location:** `src/components/shop/ProductDetail.jsx` (description <p> ~line 211,
    specs block ~249–270, `ProductReviews` mount ~line 323),
    `src/components/shop/ProductReviews.jsx` (review summary + list; could host the tab
    switch or a new sibling component)
  - **Fix:** Add a tab bar below the product header (e.g. `Description` | `Reviews`), state
    `activeTab`, render the full description + `product.specs` table under Description and
    the `<ProductReviews>` (rating summary + list + review form) under Reviews. Keep the
    Reviews tab count in the label (`Reviews (n)`). Scroll to top of the tab content on
    switch. Tabs work without a page reload; initial tab = Description.
  - **Backend:** none needed (see `backend-eaz/tasks.md` → T39).

- [ ] **T38 · Cart overlay: fit all content within the viewport**
  - **Issue:** The cart overlay that opens when clicking **Add to Cart** on a product detail
    page (`/shop/[slug]`) is a right-side drawer whose contents should fit **within one
    viewport**. On shorter screens the drawer is `w-full max-w-md` with `top-0 bottom-0` and
    its items area scrolls, but the header + scrollable items + subtotal/buttons footer can
    still feel like a separate "small page" that doesn't fit — all cart content (header,
    items, subtotal, Checkout + Continue Shopping buttons) must be visible inside the
    viewport with no vertical scroll of the page behind.
  - **Location:** `src/components/cart/CartDrawer.jsx` (drawer container ~line 42, header
    ~46–62, scrollable items area ~64–66, footer ~68–89), `src/components/cart/CartItems.jsx`
  - **Fix:** Keep the drawer as a flex column that fits the viewport height: `max-h-[100dvh]`,
    compact header padding, `flex-1 min-h-0 overflow-y-auto` on the items area, and a footer
    that never pushes content off-screen. Ensure `h-full`/`dvh` (not content-driven height)
    so on small screens the footer buttons are always reachable. Verify at ~667px and ~800px
    tall viewports.
  - **Backend:** none needed (see `backend-eaz/tasks.md` → T38).

- [x] **T37 · Sell page: show item images in search results and cart/summary** — ✅ done
  2026-08-23 (both halves; backend half added `images` to the product select, see
  `backend-eaz/tasks.md` → T37)
  - **Issue:** On `/dashboard/pos/sell`, searching for a product/part shows a text-only list
    (name, category, stock, price) and the cart rows are text-only too. The item's **image**
    should appear in the search results dropdown **and** in the cart/summary (right column)
    so cashiers can visually confirm they're scanning the right item.
  - **Location:** `src/app/dashboard/pos/sell/page.jsx` (search results ~lines 368–386,
    cart rows ~lines 408–441; `addToCart` cart item shape ~lines 111–121)
  - **Fix:** Store `image: part.images?.[0] || null` in each cart item; render a shared
    `ProductImage` thumbnail (40×40, rounded, `object-cover`, gray placeholder background)
    in both the search results dropdown and cart rows.
  - **Deviated from the fix note's literal `part.images?.[0] || part.image || null`:**
    dropped the `|| part.image` fallback. Neither `Part` (`models/Part.js`) nor `Product`
    (`models/Product.js`) has ever had a singular `image` field — only `images` (array) —
    confirmed by grepping both schemas. There's no legacy data it could recover; it would be
    dead defensive code for a field that can't exist, which `CLAUDE.md` says not to add.
  - **Note:** Part search already returned `images`; product search omitted them — fixed on
    the backend (see `backend-eaz/tasks.md` → T37).
  - **Depends on T33 (part image input) for parts to actually have photos — done.**
  - **Tests:** `src/app/dashboard/pos/sell/page.test.jsx` (new, 2 tests) — a thumbnail
    renders per search result including a photo-less product (shared placeholder, no
    crash), and the clicked result's image carries into the cart row.

- [x] **T36 · Suppliers: add WhatsApp and WeChat contact fields** — ✅ done 2026-08-23 (both
  halves; backend half added `whatsapp`/`wechat` to `Supplier`, see `backend-eaz/tasks.md` →
  T36)
  - **Issue:** Suppliers will be sourced from China (WeChat/1688/AliExpress vendors + freight
    forwarders) — messaging happens via **WhatsApp** and **WeChat**, not just phone/email.
    Add dedicated contact fields so staff can open a chat directly (e.g. `wa.me` links,
    WeChat ID display/copy).
  - **Location:** `src/app/dashboard/pos/suppliers/page.jsx` (add + inline-edit forms,
    rows), `src/app/dashboard/pos/suppliers/[id]/page.jsx` (contact card)
  - **Fix:** Added `whatsapp` and `wechat` fields to the add form, inline-edit form, and list
    rows in `suppliers/page.jsx` — `whatsapp` renders as an `https://wa.me/<digits>` link
    (`FaWhatsapp`, `react-icons/fa` — matches the icon already used for WhatsApp elsewhere in
    the app), `wechat` as a plain labeled badge (`FaWeixin`) since WeChat has no universal deep
    link scheme. Detail page (`[id]/page.jsx`) contact card gained the same `wa.me` link plus a
    click-to-copy WeChat ID button (`navigator.clipboard.writeText`, 2s "copied" checkmark —
    same pattern as the existing tracking-link copy button on the job detail page). Kept phone
    fully separate from WhatsApp per the fix note (a China number could be both, but they're
    independent fields).
  - **Tests:** `suppliers/page.test.jsx` (2 tests: row renders `wa.me` link + WeChat text, add
    form submits both fields) and `[id]/page.test.jsx` (2 tests: detail `wa.me` link, WeChat
    copy-to-clipboard) — both new. Full suite: 35 files/163 tests pass, lint clean, `next
    build` succeeds.
  - **Backend part:** `backend-eaz/tasks.md` → T36.

- [x] **T35 · Variant form: add a price input for each variant** — ✅ done 2026-08-24
  - **Issue:** The variant editor in `ProductForm` has SKU, attributes, stock, and images —
    but **no price input**. Every variant therefore shares the product's base price, which
    doesn't work for size/color/storage pricing differences. Add a per-variant **price**
    field and send it to the API.
  - **Location:** `src/components/commerce/ProductForm.jsx` (variant block ~lines 339–424 —
    add a `price` field next to SKU/stock; `addVariant`/`updateVariant`/payload at
    ~lines 174–235; `variants.map` in handleSubmit)
  - **Fix:** Add `price` (GH₵) to each variant row (default to the product price), convert to
    pesewas (`Math.round(Number(v.price) * 100)`), and include it in the submitted
    `variants[]` payload. Display the variant price on product detail and order lines.
  - **Backend part:** `backend-eaz/tasks.md` → T35.
  - **Shipped:** "Price (GH₵)" input added to each variant row (blank = unset — falls back to
    base price server-side, never coerced to 0). New variant rows added via "Add variant" are
    pre-filled with the current base price as a convenience, per the fix note; existing variants
    loaded from the API keep whatever they actually have (blank if never set), so the
    unset/explicit-free distinction survives editing. Found and fixed the same base-price-only
    bug independently in two other places the fix note didn't call out by file:
    `ProductDetail.jsx` (the variant selector changed the SKU/stock shown but never the
    displayed price) and `CartContext.jsx` (`addItem` always stored `product.price` on the cart
    line, ignoring the selected variant) — both now resolve the same way as the backend. 3 new
    tests in `CartContext.test.jsx`. Order-line/receipt display (`orders/[id]/page.jsx`,
    `track-order`, `CartItems.jsx`) needed no change — they already render the stored
    `item.price`, which the backend now resolves correctly at order-creation time. 36
    files/170 tests pass, lint clean, `next build` succeeds.

- [x] **T34 · Product form: main images should be uploadable locally, not just URL** — ✅ done 2026-08-24
  - **Issue:** In the product add/edit form, the main **Image URLs (one per line)** field is a
    textarea that only accepts URLs. Staff should be able to **upload images from their local
    device** (Cloudinary) for the main product image, not just paste URLs. (Variants + gallery
    already have `StringListEditor` upload buttons; the main images field does not.)
  - **Location:** `src/components/commerce/ProductForm.jsx` (line ~315 — the "Image URLs" textarea
    → replace with a `StringListEditor`/`UploadButton` + URL input, same pattern as variants/gallery)
  - **Fix:** Reuse the existing `StringListEditor` (which already has the Cloudinary
    `UploadButton`) for the main `images` list so staff can upload locally and/or add a URL.
  - **Backend note:** upload endpoint (`POST /api/v1/uploads`) already exists and is used by the
    form; no backend change expected (see `backend-eaz/tasks.md` → T34).
  - **Shipped:** `images` state changed from a newline-joined string (split/joined only in the
    old textarea's local state — `Product.images` was always a real Mongoose array in storage
    and over the API, so this was a UI-only representation change, not a data migration) to a
    plain array, matching `galleryImages`. The textarea was swapped for the same
    `StringListEditor` component gallery/variant images already use. 4 new tests
    (`ProductForm.test.jsx`): upload adds to `images[]`, manual URL entry still works, an
    existing product's images load and remain exactly unchanged when saved untouched, and
    removing one existing image works. 36 files/170 tests pass, lint clean, `next build` succeeds.

- [x] **T33 · Inventory part form has no image input** — ✅ done 2026-08-23
  - **Issue:** The inventory part add/edit form (PartModal) has no field to upload/attach an
    **image** for a repair part. Parts should support a photo (shown in inventory, sell search,
    job parts, receipts) like shop products already do (`product.images`).
  - **Location:** `src/app/dashboard/commerce/inventory/page.jsx` (`PartModal` payload,
    ~lines 20–80), part list rendering
  - **Fix:** Add an image upload input to the part form (single image via the existing
    Cloudinary upload endpoint — see `backend-eaz/tasks.md` → T33), store it on the `Part`
    model, display it in inventory rows/search results.
  - **Backend part:** `backend-eaz/tasks.md` → T33.
  - **Shipped:**
    - **`PartModal`** lives at `src/app/dashboard/commerce/page.jsx` now, not the
      `inventory/` path in the fix note — T24 moved it there; `inventory/page.jsx` is
      just T24's redirect shim. Added a `images` state (array, matching the backend's
      `Part.images` field) and a Photo field: shows an `UploadButton` when empty, or a
      56×56 thumbnail + Remove control once a URL exists. `images` included in both
      create and update payloads.
    - **`src/components/common/UploadButton.jsx`** — new. Extracted verbatim out of
      `ProductForm.jsx`, where it already existed for gallery/variant image uploads
      (`POST /api/v1/uploads`) but was private to that file — reused here instead of
      duplicated, per the fix note's own "existing Cloudinary upload endpoint."
      `ProductForm.jsx` now imports it; no behavior change there.
    - Parts table row gained a 36×36 `ProductImage` thumbnail (`p.images?.[0]`),
      matching the existing product row's exact pattern one tab over — same component,
      same graceful placeholder-on-missing/broken-image fallback (T16).
    - `UploadButton.test.jsx` (3, isolated: uploads and calls back with the URL,
      surfaces an error without calling back, no-op on a dismissed file picker) +
      3 new tests in `commerce/page.test.jsx` (upload swaps in a thumbnail + Remove and
      the save payload includes it, Remove reverts to the Upload button, an existing
      part's photo renders in the table row).
  - **Verified:** full suite 32 files/157 tests pass (up from 31/151); `npm run lint` 0
    errors; `next build` succeeds.

- [x] **T32 · Reports page: staff see only their own report; admin sees all staff + per-staff activity** — ✅ done 2026-08-25
  - **Issue:** The POS Reports page (`/dashboard/pos/reports`) shows **shop-wide** analytics to
    every role (only technicians are blocked). Requirements:
    - **staff** → should see **only their own** report (their jobs, their POS sales, their
      repair payments, their activity) — not the whole shop's numbers.
    - **admin / superadmin** → should see **all staff reports** and be able to drill into
      **each staff member's activity** (jobs created/assigned, sales rung up, payments, logs).
  - **Location:** `src/app/dashboard/pos/reports/page.jsx` (`useReportsAnalytics`),
    `src/hooks/queries/useReports.js`; add a staff picker (role filter / per-staff tab) for admin.
  - **Fix:** Pass a `staffId`/`assignedTo`/`cashier` filter to the analytics endpoint; staff's
    request is scoped to `req.user._id` server-side (never trust a client id). Admin gets a
    staff selector + per-staff activity breakdown. Add a "My Report" view for staff.
  - **Backend part:** `backend-eaz/tasks.md` → T32.
  - **Shipped:** `useReportsAnalytics(range, staffId, options)` gained a `staffId` param (only
    caller updated). New `StaffPicker` component (admin/superadmin only, hidden entirely for
    `staff`/`technician`) — its options come straight from `data.scope.staffList` in the
    analytics response itself, so no separate request is needed to populate it. `Header` shows
    "My Report" (staff, forced server-side) or "Report — {name}" (admin with a staff member
    selected) instead of the generic "Reports & Analytics" title. Every section already had an
    `EmptyState` fallback for zero data (verified before touching anything), so a staff-scoped
    view with orders legitimately empty needed no extra empty-state work. 5 new tests
    (`page.test.jsx`) covering the staff/admin/technician role branches and the picker's
    re-query on selection. 37 files/175 tests pass, lint clean, `next build` succeeds.

- [ ] **T31 · Sell page must sell products (accessories) as well as parts**
  - **Issue:** The POS Sell page is expected to sell **both** repair parts **and** shop
    products/accessories, found via **search**, **inventory**, and **product lookup** — not
    parts only. Confirm the full flow works for products end-to-end.
  - **Location:** `src/app/dashboard/pos/sell/page.jsx` (`handleScanOrSearch` already queries
    `/pos/inventory?...includeProducts=true`; `addToCart` keys products via `_kind: 'product'`
    → `productId`; `completeSale` sends `productId`)
  - **Fix:** Verify products (accessories) appear in scan/search/inventory results, add to the
    cart correctly, complete the sale without error, and print a correct receipt. If products
    don't surface (or the 500 from **T30** also hits products), fix and add tests.
  - **Backend part:** `backend-eaz/tasks.md` → T31. Relates to T30 (the 500 on Complete Sale).

- [ ] **T30 · POS Sell page: "Complete Sale" returns Request failed (500) when selling parts**
  - **Symptom:** On the Sell page (`/dashboard/pos/sell`), clicking **Complete Sale** with
    parts in the cart fails with **"Request failed (500)"** — no friendly error, no sale recorded.
    The failure happens with **all payment options** (Cash, MoMo, Card).
  - **Location:** `frontend-eaz/src/app/dashboard/pos/sell/page.jsx` (`completeSale`, ~line 251)
    → `backend-eaz/controllers/pos/salesController.js` (`createSale`)
  - **Fix (investigate):**
    - Reproduce and capture the actual backend error (check server logs / `errorHandler` output;
      the 500 hides the real cause).
    - Check `createSale` for crashes when selling **parts** — e.g. `Sale.create` array response
      handling (`data: sale` returns an array), missing `saleNumber`/schema pre-save hooks,
      stock `$inc`/transaction abort issues, or a `part` validation error.
    - Ensure the frontend surfaces a readable error instead of the raw 500.
  - **Backend part:** `backend-eaz/tasks.md` → T30.

- [x] **T29 · Role-based landing pages after login** ✅ done 2026-08-21
  - **Issue:** After login, admin/superadmin are redirected **away** from the overview:
    `login/page.jsx` sends `technician`/`admin` → `/dashboard/pos` and `superadmin`/`staff` →
    `/dashboard/pos/sell`. Landing pages should be role-specific:
  - **Fix:**
    - **admin / superadmin** → land on the **Overview** page (`/dashboard`) first.
    - **staff** → land on the **Sell** page (`/dashboard/pos/sell`) first.
    - **technician** → `/dashboard/pos` (jobs) — unchanged.
    - **customer** → `/` (homepage) — unchanged.
    - Apply the same redirects after email verification (`/auth/verify`) and 2FA
      (`/auth/verify-2fa`).
  - **Location:** `src/app/auth/login/page.jsx` (lines ~45–47), `src/app/auth/verify/page.jsx`,
    `src/app/auth/verify-2fa/page.jsx` (post-verify redirects)
  - **Backend note:** none required (frontend-only); see `backend-eaz/tasks.md` → T29.
  - **Shipped:**
    - `src/lib/roles.js` — new `landingPathForRole(role)`: admin/superadmin → `/dashboard`,
      staff → `/dashboard/pos/sell`, technician → `/dashboard/pos` (unchanged), else → `/`
      (unchanged). Alongside T52's `isAdminRole` in the same file.
    - `src/app/auth/login/page.jsx` — replaced the wrong grouping
      (`technician`/`admin` → `/dashboard/pos`, `superadmin`/`staff` → `/dashboard/pos/sell`)
      with `router.push(landingPathForRole(...))`.
    - `src/app/auth/verify/page.jsx` and `src/app/auth/verify-2fa/page.jsx` — both
      previously did an unconditional `router.push("/dashboard")` with **no role branching
      at all**; now use the same `landingPathForRole(...)` call.
    - `src/lib/roles.test.js` — 4 new tests for `landingPathForRole`.
    - `src/app/auth/login/page.test.jsx` (new, 5 tests) — mocks `next/navigation` and
      `AuthContext`, submits the real form, and asserts the exact `router.push` target for
      admin, superadmin, staff, technician (unchanged), and customer (unchanged).
  - **Verified:** 11/11 new tests pass; `next lint` 0 warnings/errors; full suite `npm test`
    14 files / 87 tests pass; `npm run build` compiles successfully, exit 0.

- [x] **T28 · Admin orders page: link to detail page; move all edit/update there** ✅ done 2026-08-21
  - **Issue:** For admin/superadmin, the orders list page (`/dashboard/orders`) has an inline
    "Update status" dropdown + button on every row. All order editing/updating should happen on
    the **order detail page** (`/dashboard/orders/[id]`), and the list should be read-only with
    a clear link to each order's detail page.
  - **Also requested:** Convert the **card-based** order lists to **tables** — the POS orders
    page (`/dashboard/pos/orders`) renders shop/part orders as cards, and the orders list should
    use a table layout like the other admin lists.
  - **Location:** `src/app/dashboard/orders/page.jsx`,
    `src/app/dashboard/orders/[id]/page.jsx`,
    `src/app/dashboard/pos/orders/page.jsx` (card → table)
  - **Fix:** Remove the inline status dropdown/update controls from the list; keep a "View /
    Manage" link per row to the detail page. Ensure the detail page (admin view) holds all
    edit/update actions (status, tracking update, notes). Rebuild the POS orders page as a
    table. Consider whether the same applies to `/dashboard/commerce/orders` (marketplace
    orders list).
  - **Backend note:** none required (frontend-only); see `backend-eaz/tasks.md` → T28.
  - **Shipped:**
    - `src/app/dashboard/orders/page.jsx` — removed the inline status
      `<select>` + "Update" button column and its supporting state
      (`drafts`, `useUpdateOrderStatus`); the list is now read-only, linking
      to `/dashboard/orders/[id]` (which already had a full "Add tracking
      update" form gated behind `seesAll` — no detail-page work needed). The
      link label reads "Manage" for admin/staff, "View" for customers.
    - `src/app/dashboard/commerce/orders/page.jsx` — same treatment: removed
      the inline status `<select>` column (was updating on every `onChange`
      with no confirmation); its detail page
      (`/dashboard/commerce/orders/[id]`) already had *more* edit surface
      than the other one (a status-button row **and** a full tracking-update
      form), so nothing needed to move there either. Addressed the fix
      note's explicit "consider whether the same applies" — it does, same
      duplicated-editing problem.
    - `src/app/dashboard/pos/orders/page.jsx` — rebuilt from stacked cards to
      a table (shared `Table`/`Th`/`Td` helpers) for both the Shop Orders and
      Part Orders tabs. **Left the inline status `<select>` in place here** —
      unlike the other two lists, there is no `/dashboard/pos/orders/[id]`
      detail page to move editing to, and the fix note's ask for this page
      was specifically "rebuild as a table," not "remove inline editing."
      Removed the now-dead `StatusBadge`/`STATUS_COLORS` (the select's
      current value already shows status; a card-era decoration with no
      surviving purpose).
    - Tests (new, 6 total): `orders/page.test.jsx` (2) — no `combobox` for
      either role, "Manage" vs "View" link label and target; `commerce/
      orders/page.test.jsx` (1) — no `combobox`, links to detail;
      `pos/orders/page.test.jsx` (3) — renders as a real `<table>`, inline
      status update still fires the mutation with the right args, tab switch
      renders the Part Orders table too.
  - **Verified:** 6/6 new tests pass; `next lint` 0 warnings/errors; full
    suite `npm test` 17 files / 93 tests pass; `npm run build` compiles
    successfully, exit 0.

- [x] **T27 · Add a product review form to the customer order detail page** ✅ done 2026-08-21
  - **Issue:** The customer order detail page (`/dashboard/orders/[id]`) shows the order items
    but has **no way to review** the products that were ordered. Customers should be able to
    submit a rating + comment per product from this page.
  - **Location:** `src/app/dashboard/orders/[id]/page.jsx` (Items section)
  - **Fix:** Add a review form per order item (rating + comment), posting to the existing
    `POST /api/v1/products/:productId/reviews` (authenticated; one review per user per product).
    Pre-fill/disable if the user already reviewed (via `GET …/reviews/mine`); show the review
    confirmation/inline state. Only show for delivered/fulfilled items.
  - **Backend part:** endpoints already exist (`productRoutes.js`); see `backend-eaz/tasks.md` → T27.
  - **Shipped:**
    - `src/app/dashboard/orders/[id]/page.jsx` — new `OrderItemReview` component,
      one per order line item. Fetches `GET /products/:id/reviews/eligibility` once;
      renders nothing (`canReview: false` and no existing review), a rating+comment
      form (`canReview: true` → `POST .../reviews`), or the existing review with an
      "Edit review" toggle (`alreadyReviewed: true` → fetches `GET .../reviews/mine`,
      edits via `PATCH .../reviews/mine`). `productId` resolves to `item.product ||
      item.part` (order items can reference either, per the backend's own dual
      product/part review lookup).
    - Gated two ways, matching the fix note plus one correction: **only on the
      customer's own view** (`!seesAll` — an admin/staff viewing someone else's order
      must never trigger a review submission attributed to their own account), and
      only when `order.status` is `paid` or `delivered` — this matches the backend's
      actual `hasVerifiedPurchase` rule (`status: { $in: ['paid','delivered'] }`)
      exactly, rather than the fix note's looser "delivered/fulfilled" wording, so the
      frontend gate never disagrees with the backend's own eligibility check.
    - `src/app/dashboard/orders/[id]/page.test.jsx` (new, 5 tests): shows the form for
      a verified unreviewed purchase; submits and shows the confirmation message with
      the right payload; shows an existing review + Edit toggle without a form;
      shows nothing at all on the admin/staff view (and never calls the eligibility
      endpoint there); shows nothing for a pending (unverified) order.
  - **Verified:** 5/5 new tests pass; `next lint` 0 warnings/errors; full suite
    `npm test` 18 files / 98 tests pass; `npm run build` compiles successfully, exit 0.

- [x] **T26 · Domain page should show the list of registered domains** ✅ done 2026-08-21
  - **Issue:** The Domains page (`/dashboard/domains`) currently renders **domain orders**
    (`useDomainOrders` → `DomainCard`). It should instead show the list of **registered
    domains** — the actual names the user owns, with their registration/expiry status —
    not just order records.
  - **Location:** `src/app/dashboard/domains/page.jsx`,
    `src/components/dashboard/customer/CustomerCards.jsx` (`DomainCard`),
    `src/hooks/queries/useDomains.js`
  - **Fix:** Back this page with a registered-domains source (either a new
    `GET /api/v1/domains`/`my domains` endpoint returning the owned/registered domains, or
    derive it from orders and display registered domain names + status/expiry). Show each
    registered domain (name, registrar status, expiry, renewal CTA) instead of order cards.
  - **Backend part:** `backend-eaz/tasks.md` → T26.
  - **Shipped:**
    - `src/hooks/queries/useDomains.js` — new `useMyRegisteredDomains` (`GET
      /domain/my`), kept separate from `useDomainOrders`, which
      `dashboard/page.jsx`'s overview widget still legitimately needs for its
      recent-activity feed — out of this task's scope.
    - `src/components/dashboard/customer/CustomerCards.jsx` — new
      `RegisteredDomainCard` (kept **separate** from the existing `DomainCard`,
      which stays exactly as-is since the overview widget still passes it
      order-shaped data — repurposing `DomainCard` in place would have broken
      that unrelated consumer). Computes active/expiring-soon/expired from
      `expiresAt` client-side (mirroring the hosting order detail page's own
      7-day-threshold convention) rather than trusting the stored `status`
      field, which the backend never updates after initial registration.
      Added two new `statusConfig` entries (`expired`, `expiring-soon`) to the
      shared `StatusBadge`. Shows a "Renew" CTA (linking to `/domains`, the
      public search/registration page — there's no dedicated renewal flow to
      link to; not building one here) only when expiring soon or expired.
    - `src/app/dashboard/domains/page.jsx` — swapped `useDomainOrders` →
      `useMyRegisteredDomains` and `DomainCard` → `RegisteredDomainCard`.
    - Tests (new, 5 total): `RegisteredDomainCard.test.jsx` (3) — Active/no CTA
      for a far-future expiry, Expiring-soon + CTA within 7 days, Expired +
      CTA for a past date; `domains/page.test.jsx` (2) — renders registered
      domains from the hook, empty state when none.
  - **Verified:** 5/5 new tests pass; `next lint` 0 warnings/errors; full suite
    `npm test` 20 files / 103 tests pass; `npm run build` compiles
    successfully, exit 0.

- [x] **T25 · Hosting page should only show hosting-account related content** ✅ already resolved (audited 2026-08-21)
  - **Issue:** The Hosting page (`/dashboard/hosting`) currently mixes content that isn't
    strictly about the user's hosting account(s). It should only show things related to the
    hosting account itself — no unrelated promotions, cross-sell, domain-only orders, or
    generic links.
  - **Location:** `src/app/dashboard/hosting/page.jsx`,
    `src/components/dashboard/customer/CustomerCards.jsx` (`HostingCard`),
    `src/app/dashboard/hosting/[orderId]/page.jsx`
  - **Fix:** Audit the hosting list + detail page and strip anything not directly about the
    hosting account (plan, status, cPanel login, renewal, domain attached to the account).
    Keep the "+ New Order" CTA only if it belongs; move unrelated content elsewhere.
  - **Backend note:** none required (frontend-only); see `backend-eaz/tasks.md` → T25.
  - **Already resolved:** full line-by-line audit of all 3 files (an earlier pass had
    spot-checked and explicitly declined to call it either way — this pass read both
    files in full and cross-referenced the underlying data flow before concluding).
    - `hosting/page.jsx` — list page, `useHostingOrders` hits the dedicated `/hosting/
      orders` endpoint only, no mixing with domain orders; no promotional content.
    - `HostingCard` — plan/tier, status, attached domain, cPanel username, view/manage
      links. Nothing extraneous.
    - `hosting/[orderId]/page.jsx` — order details, cPanel login/password reset,
      renewal + expiry warnings, invoice download, bank-transfer proof upload, admin
      delete. The nameserver-instructions block is for the domain *attached to this
      hosting account* (bring-your-own-domain setup, `HostingOrder.domainMode`) — the
      fix note's own whitelist explicitly keeps "domain attached to the account," so
      this isn't a stray domain order leaking in.
    - Specifically checked whether a hosting order's bundled domain registration
      (`domainMode: 'new'`) could count as a "domain-only order" per the issue's
      wording — it doesn't; that's domain data intrinsic to *this* hosting purchase.
    - A third file exists in this route tree not in the task's location list,
      `hosting/new-account/page.jsx` — checked it too: a staff-only provisioning tool,
      unrelated to this customer-facing concern.
    - Every element present matches the fix note's own explicit keep-list (plan,
      status, cPanel login, renewal, domain attached to the account); nothing matching
      "unrelated promotions, cross-sell, domain-only orders, or generic links" was found
      anywhere in scope.

- [x] **T24 · Merge "Marketplace" and "Inventory" into one page** ✅ done 2026-08-21
  - **Issue:** The Marketplace page (`/dashboard/commerce`) is a thin landing page of cards
    linking to Inventory, Delivery Zones, and Orders — with **Inventory** the primary/only
    landing card for most staff. It should be merged so Marketplace and Inventory are one
    integrated page.
  - **Location:** `src/app/dashboard/commerce/page.jsx`,
    `src/app/dashboard/commerce/inventory/page.jsx`,
    `src/app/dashboard/dashboardNav.js` (`marketplaceNav`)
  - **Fix:** Merge Marketplace + Inventory into a single page (e.g. make `/dashboard/commerce`
    render inventory directly, keep Orders/Delivery Zones as links or tabs). Unify nav so only
    one "Marketplace"/"Inventory" entry appears; remove the duplicate sidebar links. Preserve
    role-gating and the low-stock badge wiring.
  - **Shipped:**
    - `src/app/dashboard/commerce/page.jsx` — the old thin 3-card landing page replaced with
      the full former Inventory page content (Parts/Products tabs, `PartModal`, barcode
      scanner wiring, low-stock banner — moved verbatim). Delivery Zones (admin-only,
      matching the old card's own `isAdmin` gate — **not** staff, unlike the page's own
      overall `admin/superadmin/staff` gate) and Orders now render as header links instead
      of separate landing-card destinations.
    - `src/app/dashboard/commerce/inventory/page.jsx` — turned into a redirect shim to
      `/dashboard/commerce`, mirroring the **already-existing**
      `/dashboard/commerce/products → /dashboard/commerce/inventory` shim found in the same
      directory (evidence this exact "fold a page into a tab, leave a redirect" pattern was
      already established here from an earlier merge).
    - Updated the 4 other internal links that pointed at the old `/dashboard/commerce/
      inventory` path so they go straight to `/dashboard/commerce` (avoiding an unnecessary
      double-redirect hop): `commerce/products/page.jsx` (the pre-existing shim itself),
      `commerce/products/new/page.jsx`, `commerce/products/[id]/edit/page.jsx` (post-save
      redirects), and `pos/suppliers/[id]/page.jsx` (2 "manage inventory" links).
    - `dashboardNav.js` — `marketplaceNav` collapsed from 2 entries to 1
      (`/dashboard/commerce`, label "Marketplace"); removed the now-unused `Boxes` icon
      import.
    - `Sidebar.jsx` — the low-stock badge condition
      (`item.href === "/dashboard/commerce/inventory"`) updated to
      `item.href === "/dashboard/commerce"`, preserving the exact same badge behavior on
      the single merged nav entry.
    - Tests (new, 5 total): `commerce/page.test.jsx` (3) — renders inventory content
      directly with an Orders link; shows Delivery Zones for admin; hides it for staff
      (the admin-only gate specifically, not the page's broader staff-inclusive gate);
      `commerce/inventory/page.test.jsx` (1) — redirects to `/dashboard/commerce`;
      `dashboardNav.test.js` (1) — `marketplaceNav` has exactly one entry.
  - **Verified:** 5/5 new tests pass; `next lint` 0 warnings/errors; full suite `npm test`
    23 files / 108 tests pass; `npm run build` compiles successfully, exit 0 — confirmed
    `/dashboard/commerce/inventory`'s build size shrank to 1.31 kB, matching the existing
    `/dashboard/commerce/products` shim's size exactly.

- [x] **T23 · Remove "New Job" button from the Overview dashboard** ✅ done 2026-08-21
  - **Issue:** The Overview page (`/dashboard`) has a **New Job** button (top-right, both in
    `MyDashboard` and `FullDashboard`). It should not be there — creating a repair job belongs
    in the POS/Jobs area, not on the overview.
  - **Location:** `src/app/dashboard/page.jsx` (lines ~216 and ~278: `href="/dashboard/pos/jobs/new"`),
    plus the "Create first job →" empty-state link (~line 150)
  - **Fix:** Remove the Overview "New Job" buttons and the empty-state create link; the action
    stays available from the POS Jobs page. Confirm no other dashboard widget duplicates it.
  - **Backend note:** none required (frontend-only); see `backend-eaz/tasks.md` → T23.
  - **Shipped:** `src/app/dashboard/page.jsx` — removed the "New Job" button from both
    `MyDashboard`'s and `FullDashboard`'s headers (dropped the now-single-child
    `flex justify-between` wrapper along with it), and the "Create first job →" link
    from `RecentJobsList`'s empty state. Removed the now-unused `Plus` icon import.
    Confirmed no other duplicate: grepped the whole file and `src/components/dashboard/`
    for `jobs/new`/"New Job" — the only remaining references are on `PosShell` and the
    POS Jobs page itself, exactly where the action is meant to stay. Exported
    `RecentJobsList` (matching the existing `RecentOrdersList` export-for-testing
    precedent in the same file).
    `src/app/dashboard/RecentJobsList.test.jsx` (new, 1 test): empty state shows "No
    jobs yet." with no "Create first job" link/text anywhere.
  - **Verified:** 1/1 new test passes; `next lint` 0 warnings/errors; full suite
    `npm test` 24 files / 109 tests pass; `npm run build` compiles successfully, exit 0.

- [x] **T22 · Integrate "My Repairs" and "My Jobs" into one page** ✅ done 2026-08-21
  - **Issue:** Two separate pages show repair jobs: `/dashboard/repairs` ("My Repairs" —
    customer-facing, matched by phone, read-only) and `/dashboard/pos` ("My Jobs" — technician
    repair dashboard with stats + active/completed tabs). They overlap and should be merged
    into one integrated repair page.
  - **Location:** `src/app/dashboard/repairs/page.jsx`, `src/app/dashboard/pos/page.jsx`,
    `src/app/dashboard/dashboardNav.js` (nav entries "My Repairs" / "My Jobs")
  - **Fix:** Merge into a single destination (e.g. keep `/dashboard/repairs` and redirect
    `/dashboard/pos` → it for the repair view, or vice-versa); unify the data hook
    (`useMyRepairs` vs `useJobs`), status labels, and navigation so technicians/owners see one
    consolidated jobs list. Confirm which fields/actions each role needs and preserve
    role-gating.
  - **Design decision (not the fix note's literal suggestion):** went the *other* direction
    from "keep `/dashboard/repairs`, redirect `/dashboard/pos` → it." `/dashboard/pos` turned
    out to be technicians' purpose-built landing page (`posNav`'s "My Jobs" entry) rendered
    inside `PosShell` — a completely different, mobile-first shell (horizontal top nav, no
    sidebar) from the standard `DashboardShell`/`Sidebar` that `/dashboard/repairs` uses.
    Redirecting `/dashboard/pos` away would have pulled every technician out of their
    dedicated UI on every login (`landingPathForRole` from T29 sends them there directly).
    Also found `posNav` splits staff from technicians: staff/admin/superadmin's real
    destination is a *different* page, `/dashboard/pos/jobs` ("Jobs" — a full filterable
    list), not `/dashboard/pos` at all. So `/dashboard/repairs` now redirects each role to
    *its own* existing, better-suited page instead: technicians → `/dashboard/pos`,
    staff/admin/superadmin → `/dashboard/pos/jobs`. Customers keep this page unchanged — it
    was already their only repairs view. No hook unification needed: each audience already
    uses its own correctly-scoped hook/endpoint (customer: `useMyRepairs`/`/track/mine`
    matched by phone/email; staff: `useJobs`/`/pos/jobs`), the redirect just stops staff ever
    reaching the read-only, assignment-unscoped duplicate this page used to show them.
  - **Location correction:** `dashboardNav.js`'s "My Repairs" entry needed no change — it
    still makes sense as a click target for every role now that it correctly routes onward.
  - **Shipped:**
    - `src/app/dashboard/repairs/page.jsx` — added the role-based redirect (`useEffect`,
      gated on `authLoading`); `useMyRepairs` now passes `enabled: false` for
      technician/staff-like roles so the fetch never fires for a role that's about to be
      redirected away; simplified the row-link logic (dropped the now-dead `isStaff` branch
      pointing at `/dashboard/pos/jobs/:id`, since only customers ever reach the table now).
    - `src/app/dashboard/repairs/page.test.jsx` (new, 5 tests): technician → `/dashboard/pos`;
      staff/admin/superadmin → `/dashboard/pos/jobs` (3 separate role checks); customer is
      never redirected and still sees their own repairs table.
  - **Verified:** 5/5 new tests pass; `next lint` 0 warnings/errors; full suite `npm test`
    25 files / 114 tests pass; `npm run build` compiles successfully, exit 0.

- [x] **T21 · Hide ALL hosting/domain content for technicians**
  - **Issue:** Technicians should see **nothing** related to hosting or domains anywhere in the
    dashboard. Currently the sidebar shows `baseNav` (Overview, Shop Orders, My Repairs,
    **Hosting**, **Domains**) to every logged-in user, and technicians may still surface
    hosting/domain links, badges, or widgets.
  - **Location:** `src/app/dashboard/dashboardNav.js` (`baseNav`),
    `src/app/dashboard/Sidebar.jsx`, `src/app/dashboard/page.jsx` (MyDashboard),
    any other page/card that renders hosting/domain for technicians
  - **Fix:** `baseNav`'s Hosting/Domains entries gained `hideRoles: ["technician"]`
    (`dashboardNav.js`); `Sidebar.jsx` filters `baseNav` through it before rendering
    (same pattern already used for `posNav`'s per-item `roles`). `staff` keeps both links —
    only `technician` is excluded, matching the backend's `denyRoles('technician')` scope.
    Audited `page.jsx`: `DashboardContent` routes `staff`/`technician` to `MyDashboard`, never
    to `CustomerOverview` (which owns the Hosting/Domains stat cards + recent-orders widgets),
    and `MyDashboard` itself has no hosting/domain reference — no other change needed there.
    Grepped the rest of `dashboard/` for "Hosting"/"Domains" strings — no other nav/card
    surfaces them. `/dashboard/hosting` and `/dashboard/domains` pages have no client-side
    role guard, consistent with every other role-restricted page in this app (e.g.
    `/dashboard/users`) — they rely on the hidden nav link + the backend 403
    (`backend-eaz/tasks.md` → T21) which now denies technician on those endpoints.

- [x] **T19 · Change "Customer will bring device in" → "Device received" once diagnosing starts**
  - **Issue:** On the repair job detail page, the customer/device card shows
    "Customer will bring device in" (or "Rider pickup requested") based on `job.dropoff`.
    Once the teller clicks **Start Diagnosing** (status `received` → `diagnosing`) **or**
    **Skip to Repairing** (status `received` → `repairing`), the device has been handed over
    and the label should read **"Device received"** instead.
  - **Location:** `src/app/dashboard/pos/jobs/[id]/_components/CustomerDeviceCard.jsx` (line 32)
  - **Fix:** Label now derived from `job.status !== "received"` instead of always showing the
    dropoff copy — reads "Device received" for every status past `received` (`diagnosing`,
    `waiting_for_parts`, `repairing`, `ready`, `collected`, `cancelled`), otherwise keeps the
    existing dropoff-based copy (`job.dropoff === "rider"` vs the default). `pickupAddress`
    display was left untouched (out of scope — task only asked to change the label).
    Added `CustomerDeviceCard.test.jsx` (5 tests: pre-arrival customer/rider copy, the two
    named transitions, and the later statuses). `npx vitest run` on the new file: 5/5 passed;
    lint clean.
  - **Backend note:** none required (frontend-only display change); see `backend-eaz/tasks.md` → T19.

- [x] **T20 · Hide the repair/technician form once the job is done or cancelled**
  - **Issue:** On the repair job detail page, the "Technician Update" form (repair work, labour
    charge, diagnosis fee, estimated completion, diagnosis, status, internal notes, warranty) and
    the "Parts" section remain editable after the job is finished or cancelled. They should be
    hidden (or made read-only) when the job is `ready`/`collected` (work done) or `cancelled`.
  - **Location:** `src/app/dashboard/pos/jobs/[id]/page.jsx` (Technician Update card ~lines 243–357,
    Parts card ~lines 359+)
  - **Fix:** Added `isEditable = !["ready","collected","cancelled"].includes(status)`. Deviated
    from the fix note's literal active-list (`received`/`diagnosing`/`repairing`) by also keeping
    `waiting_for_parts` editable — it's a mid-repair status too, and locking the form during it
    would strand a technician who needs to log notes/parts while parts are in transit; only the
    three "job is over" statuses go read-only, matching the task title. Both the Technician
    Update card and the Parts card now render a read-only summary (plain text, no inputs, no
    search/add/remove) when `!isEditable`; the warranty-expiry banner is shared between both
    branches. The status-progression buttons, payment/close controls, and MoMo/card panels were
    untouched — they already had their own status/`isTechnician` gates — verified them still
    render correctly for each status.
  - **Backend note:** none required (frontend-only); see `backend-eaz/tasks.md` → T20.

- [x] **T16 · Homepage / shop crash on external product images** ✅ done 2026-08-18
  - **Symptom:** homepage showed "Something went wrong" (error boundary); the "Recent
    Products" section appeared to be missing.
  - **Root cause:** product/part images come from **37 external supplier hosts**
    (cdn.shopify.com, apple.com, samsung.com, belkin.com, jbl.com, …), but
    `next.config.mjs` whitelisted only 6. `next/image` throws a hard "hostname not
    configured" error on any un-whitelisted host, which bubbled to the page error
    boundary and took down the whole page (homepage **and** every shop page). Not a
    data or backend problem — 57 active products exist.
  - **Fix:** `next.config.mjs` → `remotePatterns: [{ protocol: "https",
    hostname: "**" }]` — allow any **HTTPS** image host (http excluded), dev + prod.
    Optimized images are still served same-origin via `/_next/image`, so the browser
    CSP `img-src 'self'` is unaffected.
  - **Verified:** the exact crashing `belkin.com` URL now optimizes to `200 image/jpeg`;
    homepage returns 200; products API returns 8 items incl. the Belkin product.
  - **Follow-ups (optional, not done):**
    - [ ] `components/home/RecentProducts.jsx` swallows fetch errors (`.catch(() => {})`)
      and self-hides when empty → an API outage looks identical to "no products." Add a
      visible "couldn't load products" fallback.
    - [ ] Longer term, host product images on **Cloudinary** (the configured, optimized
      host) instead of arbitrary supplier URLs, so a closed allowlist can be restored.

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