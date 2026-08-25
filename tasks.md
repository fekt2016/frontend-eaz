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

---

## Ad-hoc fixes (found during work, outside the original audit)

- [ ] **T69 · Chat monitoring UI — staff attribution, supervisor view, metrics**
  - **Frontend half of `backend-eaz/tasks.md` → T69.** Admin/superadmin want to monitor the
    quality of staff↔customer chats; the data model and endpoints land on the backend first.
  - **Attribution:** staff bubbles in `/dashboard/chats` show *which* staff member replied
    (currently a bare "admin"/"Eazy" label) once messages carry `senderName`.
  - **Supervisor mode:** admins read transcripts read-only until they explicitly Claim a session —
    ends silent double-replies and makes "watching" distinct from "answering".
  - **Metrics:** quality cards + per-staff table on the chats page (ui-kit `SectionCard`/`Badge`,
    date filters) fed by the backend Phase 3 endpoint; CSAT display if that phase lands too.
  - **Blocked on backend phases 1–3 landing first.**

- [~] **T67 · "Save GH₵0" was shown on every annual hosting plan** — ✅ frontend fix done 2026-08-25
  - **Was:** `saving = plan.monthlyPrice * 12 - plan.annualPrice`, rendered unguarded. Every tier in
    `config/hostingPlans.js` has `annualPrice === monthlyPrice * 12`, so the saving is always 0 and
    customers picking Annual saw a green **"Save GH₵ 0"** plus a tab reading **"Annual (Save GH₵ 0)"**.
  - **Fixed:** all three render sites now require `saving > 0` —
    `src/app/hosting/page.jsx:310`, `src/app/hosting/checkout/page.jsx:351` and `:362`
    (the tab falls back to a plain "Annual"). Suite green: 47 files / 301 tests.
  - **Still open in `backend-eaz/tasks.md` → T67:** whether annual should carry a real discount.
    If it should, set `annualPrice` per tier and the saving line reappears with no further UI work.

- [ ] **T68 · Dashboard queue for hosting orders that need manual provisioning**
  - **Frontend half of `backend-eaz/tasks.md` → T68.** VPS, Cloud and Email orders are paid but
    never provisioned; staff only see a count on the admin dashboard, with no list to act on.
  - **What this needs here:** a page mirroring `dashboard/commerce/preorders` — waiting orders
    oldest first, and a form to enter the cPanel/VM credentials created by hand in Starlight
    Manager, which marks the order active and triggers the credentials email. Plus a nav entry,
    since this becomes a recurring job the moment VPS tiers sell.
  - **Blocked on the backend endpoints landing first.**

- [ ] **T65 · Stop advertising `.com.gh` / `.gh` / `.africa` (or decide to sell them another way)**
  - **Why:** the registrar is Spaceship now (backend T64) and its API returns `tldNotSupported`
    for all three — verified live 2026-08-25. The storefront still promotes them, so a customer
    can be pushed toward a domain that cannot be bought. Backend already rejects these before
    any API call, so the failure is a clean error rather than a charge — but the copy is wrong.
  - **Where:**
    - `src/app/domains/page.jsx:7` — SEO description names `.com.gh` and `.africa`.
    - `src/app/hosting/checkout/page.jsx:187` — actively *suggests* `.com.gh` when the chosen
      domain is taken. This is the worst one: it steers people into a dead end.
    - `src/data/serviceDetails.js:112` — FAQ answer lists `.gh` and `.africa` as supported.
    - `backend-eaz/src/seedBlog.js` — a published post on registering a `.com.gh`, with
      GH₵250–450/yr pricing claims. SEO traffic lands here.
  - **Also:** `src/data/pricingData.js` (`domainPricing`, `getDomainPrice`) is **dead code** —
    nothing imports it. It lists all three TLDs at USD prices, contradicting the GH₵ convention.
    Delete it rather than update it.
  - **Blocked on the business decision in `backend-eaz/tasks.md` → T65.** Don't rewrite the copy
    until it's settled whether these are dropped or sold manually.

- [ ] **T62 · Surface the tracking number, and mirror the transactional emails**
  - **Why:** a customer pays and lands on the order-confirmation page, which shows the
    order number but **not the tracking number** — even though the order already has one
    from the moment it is created. For a pre-order they will check on for weeks, that is
    the difference between the T45 tracking journey being reachable and not.
  - **What this needs here:**
    - `src/app/order-confirmation/[reference]/page.jsx` — show the tracking number and
      link straight to `/track/order/<number>`, rather than only linking to the
      `/track-order` lookup form. The API already returns the field on this lookup; it
      is simply not rendered.
    - Where a pre-order is involved, say so on the confirmation page and set the
      expectation ("you'll be emailed when it reaches our shop").
    - Any new email template that needs a matching page/link should point at existing
      routes — `/track/order/:trackingNumber` already renders the full journey.
  - **Backend:** `backend-eaz/tasks.md` → T62 has the full audit of which areas send
    email today and which send nothing.

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
