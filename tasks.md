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

- [ ] **T4 · Add frontend test coverage**
  - **Issue:** Only 3 frontend test files (31 tests) vs. a large app — UI/hook regressions
    can slip through. Backend is well covered (112 tests).
  - **Impact:** MEDIUM (regression risk).
  - **Location:** `frontend-eaz` (vitest)
  - **Fix:** Add tests for checkout, dashboard recent-orders wiring, order tracking page,
    repair parts search, and auth context.
  - **Source:** AUDIT.md §28, §29 P1

---

## P2 — Improvements

- [ ] **T7 · Consolidate data-fetching + drop unused axios**
  - **Issue:** Two patterns coexist (react-query hooks vs. raw `useEffect`+`api.js`);
    `axios` is a dependency on both apps but effectively unused on the client.
  - **Location:** `src/hooks`, various pages, both `package.json`
  - **Fix:** Standardize new/edited code on react-query; migrate the manual part-search
    debounce to the shared `useInventorySearch`; remove the unused axios dep.
  - **Source:** AUDIT.md §20, §27 (#1, #3)

- [ ] **T9 · Remove dead `/dashboard/pos/inventory` route dir**
  - **Issue:** Directory exists with no `page.jsx` (inventory lives under
    `/dashboard/commerce/inventory`).
  - **Location:** `src/app/dashboard/pos/inventory/`
  - **Fix:** Delete the empty directory.
  - **Source:** AUDIT.md §3 note, §27 (#5)

- [ ] **T17 · Registration form: allow email OR phone**
  - **Issue:** The register form marks `email` as required, but users should be able to
    register using **either** an email **or** a phone number. (Backend schema/controller
    changes live in `backend-eaz/tasks.md` → T17.)
  - **Location:** `src/app/auth/register/page.jsx`
  - **Fix:** Make email optional when phone is provided (and vice versa); require at least
    one identifier on the client. Adjust the redirect on registration to send verification
    to whichever identifier was chosen. Match the backend validation.
  - **Backend part:** `backend-eaz/tasks.md` → T17.

- [ ] **T18 · Hide "Cancel Job" button once job is ready + add confirmation modal**
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

---

## Ad-hoc fixes (found during work, outside the original audit)

- [ ] **T21 · Hide ALL hosting/domain content for technicians**
  - **Issue:** Technicians should see **nothing** related to hosting or domains anywhere in the
    dashboard. Currently the sidebar shows `baseNav` (Overview, Shop Orders, My Repairs,
    **Hosting**, **Domains**) to every logged-in user, and technicians may still surface
    hosting/domain links, badges, or widgets.
  - **Location:** `src/app/dashboard/dashboardNav.js` (`baseNav`),
    `src/app/dashboard/Sidebar.jsx`, `src/app/dashboard/page.jsx` (MyDashboard),
    any other page/card that renders hosting/domain for technicians
  - **Fix:** Role-gate **every** hosting/domain UI element so `technician` never sees them —
    sidebar links, dashboard widgets/cards, badges, and any "Hosting"/"Domains" reference.
    Confirm whether `staff` keeps them. Backend must also refuse technicians on those routes
    (see `backend-eaz/tasks.md` → T21).

- [ ] **T19 · Change "Customer will bring device in" → "Device received" once diagnosing starts**
  - **Issue:** On the repair job detail page, the customer/device card shows
    "Customer will bring device in" (or "Rider pickup requested") based on `job.dropoff`.
    Once the teller clicks **Start Diagnosing** (status `received` → `diagnosing`) **or**
    **Skip to Repairing** (status `received` → `repairing`), the device has been handed over
    and the label should read **"Device received"** instead.
  - **Location:** `src/app/dashboard/pos/jobs/[id]/_components/CustomerDeviceCard.jsx` (line 32)
  - **Fix:** Derive the label from `job.status` — show "Device received" when the job has left
    the `received` stage (whether via **Start Diagnosing** or **Skip to Repairing**), otherwise
    keep the existing dropoff-based copy.
  - **Backend note:** none required (frontend-only display change); see `backend-eaz/tasks.md` → T19.

- [ ] **T20 · Hide the repair/technician form once the job is done or cancelled**
  - **Issue:** On the repair job detail page, the "Technician Update" form (repair work, labour
    charge, diagnosis fee, estimated completion, diagnosis, status, internal notes, warranty) and
    the "Parts" section remain editable after the job is finished or cancelled. They should be
    hidden (or made read-only) when the job is `ready`/`collected` (work done) or `cancelled`.
  - **Location:** `src/app/dashboard/pos/jobs/[id]/page.jsx` (Technician Update card ~lines 243–357,
    Parts card ~lines 359+)
  - **Fix:** Render the Technician Update + Parts sections only for active statuses
    (`received`, `diagnosing`, `repairing`); for `ready`/`collected`/`cancelled` show a
    read-only summary instead. Confirm the teller-side payment/close controls still work.
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