# EazWorld Frontend — Issue & Fix Tracker

> This is the **frontend-eaz** half of the issue tracker. Backend items live in
> **`backend-eaz/tasks.md`**. Cross-app tasks are listed in their primary repo and
> cross-referenced.
>
> Sources of truth: **`REVIEWFULL.md`** (full audit 2026-08-29 — build + lint clean, 927 backend
> tests passing; tasks T81-T100 come from it) and the earlier **`AUDIT.md`** (2026-08-18 — 112 backend + 31
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

- [ ] **T97 · `FRONTEND_URL` falls back to localhost, silently breaking every canonical URL** (audit ref EZ-006)
  - **Issue:** `export const SITE_URL = process.env.FRONTEND_URL || "http://localhost:3000";`
    (`src/lib/seo.js:1`) — a silent localhost default. `SITE_URL` feeds canonicals, `metadataBase`,
    Open Graph URLs, `sitemap.xml` and `robots.txt`. `amplify.yml` does not set the variable.
  - **Impact:** If it is unset in the deploy environment, every canonical tag, OG URL and sitemap entry
    ships as `http://localhost:3000`. Search engines de-index or ignore the pages and social previews
    break — with **no runtime error** to notice. Classified POTENTIAL RISK in the audit because the
    deployed environment could not be inspected from here; verify before treating as resolved.
  - **Repro:** Build with `FRONTEND_URL` unset, then inspect `/sitemap.xml` and any page's canonical tag.
  - **Expected:** A production build without `FRONTEND_URL` fails fast.
  - **Actual:** Builds successfully and emits localhost URLs.
  - **Fix:** Throw at module load when `NODE_ENV === 'production'` and `FRONTEND_URL` is unset; keep the
    localhost default for development. Set the variable in the Amplify environment.
  - **Location:** `src/lib/seo.js:1`; `amplify.yml`
  - **Acceptance:**
    - [ ] Production build fails with a clear message when `FRONTEND_URL` is missing
    - [ ] Development still works with no configuration
    - [ ] Deployed `sitemap.xml`, canonicals and OG URLs use the real domain
    - [ ] The variable is set in the deployment environment

---

## P2 — Improvements

- [ ] **T98 · Six public pages ship with no metadata** (audit ref EZ-013)
  - **Issue:** No `export const metadata` and no `generateMetadata` on `src/app/hosting/page.jsx`,
    `seo/page.jsx`, `repair/page.jsx`, `reviews/page.jsx`, `services/web-design/page.jsx`,
    `track-order/page.jsx`. They inherit only the root defaults — no page title, description, canonical
    or Open Graph data. (25 of 89 pages have metadata; the rest are dashboard/auth/transactional and
    correctly `disallow`ed in `robots.js`.)
  - **Impact:** Revenue pages — hosting, repair, web design, SEO services — compete in search with
    generic titles and no descriptions, and share incorrect social previews.
  - **Repro:** `for f in $(find src/app -name page.jsx | grep -vE "/dashboard/|/auth/"); do grep -q
    "export const metadata\|generateMetadata" $f || echo $f; done`
  - **Fix:** Add `metadata` exports built on the existing `src/lib/seo.js` helpers so canonical/OG
    construction stays consistent. `track-order` is transactional — prefer `robots: { index: false }`
    over marketing metadata.
  - **Location:** the six files above
  - **Acceptance:**
    - [ ] Each listed page has a unique title and description
    - [ ] Canonical URLs derive from `SITE_URL`
    - [ ] Transactional pages are marked noindex rather than given marketing metadata
    - [ ] Build and lint stay clean

- [ ] **T99 · Plan the Next.js 16 upgrade to clear two high-severity PostCSS advisories** (audit ref EZ-014)
  - **Issue:** `npm audit --omit=dev` reports 2 high-severity PostCSS advisories (arbitrary `.map` file
    read / information disclosure via attacker-controlled `sourceMappingURL`; XSS via unescaped
    `</style>`), reaching the app transitively through `next`
    (`node_modules/next/node_modules/postcss`). `npm audit fix --force` resolves them by installing
    **`next@16.3.3` — a major version bump**.
  - **Impact:** Build-time/tooling-scoped rather than a live request path, so not an exploitable
    production endpoint today — but a standing high-severity item that will block security review.
  - **Fix:** Schedule Next 14 → 16 as its own piece of work (App Router changes, middleware API, build
    config). **Do not run `--force` casually** — it is a breaking change to the framework the whole
    frontend sits on.
  - **Location:** `package.json`; transitive via `next`
  - **Acceptance:**
    - [ ] Upgrade path assessed and scheduled
    - [ ] After upgrade, `npm audit --omit=dev` is clean
    - [ ] Build, lint and all frontend tests pass
    - [ ] Middleware auth/maintenance behaviour verified after the upgrade

- [ ] **T100 · Checkout shows "Validation failed" and discards the field detail it already has** (audit ref EZ-018)
  - **Issue:** Zod failures return `{ error: "Validation failed", errors: [{ field, message }] }`
    (`backend-eaz/middleware/errorHandler.js:16`). `src/lib/api.js:24` already attaches `errors` to the
    thrown Error — but checkout renders only `err.message`.
  - **Impact:** Users see "Validation failed" with no indication of which field is wrong and no way to
    fix it. This is exactly how the recent delivery-method defect presented: the actionable detail was
    on the wire and thrown away.
  - **Repro:** Submit a checkout request that fails schema validation and read the message.
  - **Expected:** The first field message, or per-field annotations. **Actual:** a bare generic string.
  - **Fix:** Where an error carries `errors[]`, render the first message (or map them onto fields).
    Applies to any form using `lib/api.js`, not just checkout.
  - **Location:** `src/app/checkout/page.jsx` (quote + submit error handling); `src/lib/api.js:24`
  - **Acceptance:**
    - [ ] Validation failures show a specific, actionable message
    - [ ] Non-validation errors still show their message
    - [ ] No raw internal detail is shown to users

---

## Missing Features (new work — mirrors backend-eaz/tasks.md's "Missing Features" section)

- [ ] **T80 · E2 Shipping Expansion: Frontend Checkout + Tracking Integration** (see `backend-eaz/tasks.md` T80 for full scope)
  - **Sub-tasks:**
    - [x] T80j · `src/app/checkout/page.jsx` — region→city→neighborhood cascade from `/api/v1/locations`; pickup location selector for `bus_station_pickup`; send `region`/`pickupLocationId` to quote
    - [x] T80k · `src/app/track/order/[trackingNumber]/page.jsx` — pickup panel when `shippingMethod === 'bus_station_pickup'`
    - [x] T80l · `src/app/order-confirmation/[reference]/page.jsx` — pickup info when applicable
    - [x] T80m · `src/hooks/queries/useShippingAdmin.js` — add `useLocations`, `usePickups` hooks + queryKeys
    - [x] T80m2 · `src/lib/queryKeys.js` — add location/pickup query keys

---

## Ad-hoc fixes (found during work, outside the original audit)

_None._

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
