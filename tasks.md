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

- [x] **T69 · Chat monitoring UI — staff attribution, supervisor view, metrics** — ✅ done 2026-08-26
  - **Frontend half of `backend-eaz/tasks.md` → T69.** Admin/superadmin want to monitor the
    quality of staff↔customer chats. Backend phases 0–4 landed in the same pass, so this is no
    longer blocked.
  - **Attribution — ✅** agent bubbles in `/dashboard/chats` name the sender: "You" for your own
    replies, the staff member's name otherwise, and a generic "EazWorld team" for messages stored
    before `senderName` existed. Every bubble used to read **"You (Admin)"** regardless of who
    typed it — which is precisely what made quality unmeasurable by eye.
  - **Supervisor mode — ✅** replying now requires owning the conversation. A chat someone else
    holds shows "*Ama* is handling this chat" with a **Take over**; an unclaimed one shows
    "watching — claim it to reply" with a **Claim chat**; both `POST …/claim` and unlock the reply
    box in place. Pending requests are unchanged — **Accept** claims as it connects. The session
    list carries an owner line so a supervisor can see at a glance which chats are covered.
    Also removed a hardcoded **"Watching"** pill that sat on every session and meant nothing.
  - **Metrics — ✅** `QualityMetrics.jsx` (a `SectionCard` beside the console, admin-only, opened
    from a **Quality** toggle so the admin-only endpoint doesn't fire on every front-desk page
    load): sessions, live chats accepted, resolution rate, median first reply, median time to
    close, 7/30/90-day range, plus a per-agent table. CSAT included now that backend phase 4
    landed: a "Customer rating" card (`x / 5`, with rated-count + response-rate as the hint so
    the denominator is never a mystery) and a ★ column per agent.
  - **Customer rating (T69 phase 4) — ✅** `ChatWidget.jsx` asks for stars once a chat a *person*
    handled has closed (bot-only conversations are never asked), submits optimistically to
    `POST /chat/sessions/:id/rating`, and on later visits shows the saved score instead of
    asking again (`meta.rating` from polling). The console surfaces each session's score as
    tinted ★★☆☆☆ badges in both the list and the transcript header.
  - **Tests:** `src/app/dashboard/chats/page.test.jsx` (11) covers attribution, the claim/take-over
    gating, the panel's admin-only visibility, and the rating display; `ChatWidget.test.jsx` (new,
    5) covers ask-once-after-close, submit, restore-instead-of-re-ask, and bot-only chats never
    being asked. Suite: 49 files / 317 tests green; lint clean.

- [~] **T67 · "Save GH₵0" was shown on every annual hosting plan** — ✅ frontend fix done 2026-08-25
  - **Was:** `saving = plan.monthlyPrice * 12 - plan.annualPrice`, rendered unguarded. Every tier in
    `config/hostingPlans.js` has `annualPrice === monthlyPrice * 12`, so the saving is always 0 and
    customers picking Annual saw a green **"Save GH₵ 0"** plus a tab reading **"Annual (Save GH₵ 0)"**.
  - **Fixed:** all three render sites now require `saving > 0` —
    `src/app/hosting/page.jsx:310`, `src/app/hosting/checkout/page.jsx:351` and `:362`
    (the tab falls back to a plain "Annual"). Suite green: 47 files / 301 tests.
  - **Still open in `backend-eaz/tasks.md` → T67:** whether annual should carry a real discount.
    If it should, set `annualPrice` per tier and the saving line reappears with no further UI work.

- [~] **T68 · Dashboard queue for hosting orders that need manual provisioning** — ✅ done 2026-08-26 (backend + frontend; purchase-confirmation email folds into T62)
  - **Frontend half of `backend-eaz/tasks.md` → T68.** VPS, Cloud and Email orders are paid but
    never provisioned; staff only see a count on the admin dashboard, with no list to act on.
  - **Shipped — `dashboard/hosting/awaiting-provisioning`**, mirroring
    `dashboard/commerce/preorders`: paid skipped orders oldest first, each card showing plan,
    customer, whole-cedi amount (`GH₵{amount}` raw — hosting money is the T44 exception, not
    pesewas) and a credentials form. Entering the username/password created by hand in Starlight
    Manager calls `PATCH …/mark-provisioned`, which activates the order and emails the same
    credentials email auto-provisioned accounts get. The password goes to the email once and is
    never stored.
  - **Nav:** "Awaiting Provisioning" in the admin+staff section beside Pre-orders/Shipments —
    same reasoning as T45: a recurring job someone has to go looking for, not a detail of one
    order. Title mapping added so the topbar `<h1>` matches.
  - **Hooks:** `useAwaitingProvisioning` / `useMarkProvisioned` in `useHosting.js`, invalidating
    the whole hosting domain so the order leaves the queue and the admin lists refresh.
  - **Tests:** `page.test.jsx` (6) — listing with whole-cedi rendering, credential submit,
    domain prefill, server-refusal surface, empty state, customer role gate. Suite:
    50 files / 323 tests green; lint clean.

- [x] **T65 · Stop advertising `.com.gh` / `.gh` / `.africa`** — ✅ closed 2026-08-26
  - **Product answer (user, 2026-08-26): we don't resell them** — customers register via a
    ghNIC-accredited registrar; EazWorld connects the domain. The shipped copy work (commit
    4a064a4: domains SEO copy, checkout suggestion, services FAQ) already implements exactly
    that, so this closes. Full detail in `backend-eaz/tasks.md` → T65.
  - **Why:** the registrar is Spaceship now (backend T64) and its API returns `tldNotSupported`
    for all three — verified live 2026-08-25. Backend rejects them before any API call, so the
    old copy steered people into a dead end.

- [x] **T5 · Expenses open to admin (frontend half)** — ✅ done 2026-08-26
  - Backend admitted `admin` to expense read+write (`routes/posRoutes.js`, backend T5). The
    Expenses nav entry now includes `admin`, and `pos/expenses/page.jsx` gates manage actions
    on superadmin+admin instead of superadmin alone.

- [x] **T62 · Surface the tracking number, and mirror the transactional emails** — ✅ done (page in cb41a45; backend emails landed 2026-08-26)
  - **Why:** a customer pays and lands on the order-confirmation page, which shows the
    order number but **not the tracking number** — even though the order already has one
    from the moment it is created. For a pre-order they will check on for weeks, that is
    the difference between the T45 tracking journey being reachable and not.
  - **Shipped here (cb41a45):** the confirmation page shows the tracking number with a
    direct `/track/order/<number>` link instead of only offering the lookup form, and a
    pre-order line sets the expectation ("you'll be emailed when it reaches our shop").
  - **Backend half done 2026-08-26:** the emails this page promised now exist — shop
    receipt with the same tracking link (`order_confirmation`), status moves
    (`shop_status_update`), refund outcomes, domain and service confirmations. Full
    detail in `backend-eaz/tasks.md` → T62. No further frontend work needed: every new
    template points at existing routes.
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
