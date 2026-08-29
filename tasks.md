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


## P1 — Important

- [~] **T97 · `FRONTEND_URL` falls back to localhost, silently breaking every canonical URL** (audit ref EZ-006)
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
    - [x] Production build fails with a clear message when `FRONTEND_URL` is missing
    - [x] Development still works with no configuration
    - [ ] Deployed `sitemap.xml`, canonicals and OG URLs use the real domain  ← verified in a local production build; NOT verified on the deployed site
    - [ ] The variable is set in the deployment environment  ← must be set in the Docker env (build arg + runtime)

  ### Implementation Notes (2026-08-29 — awaiting review)

  - **`src/lib/seo.js`** — replaced the silent `|| "http://localhost:3000"` default with
    `resolveSiteUrl()`. Development keeps the localhost fallback; when
    `NODE_ENV === "production"` and `FRONTEND_URL` is unset (or blank) it throws at module
    load, which fails the build. A configured value now also has trailing slashes stripped
    so `${SITE_URL}${path}` cannot emit `//shop`.
  - **`amplify.yml` deleted** (2026-08-29, after review) — the app is hosted on **Spaceship via
    Docker**, not AWS Amplify, so that file was dead config and the `preBuild` guard I first put
    there would never have run. No replacement guard was added: the Dockerfile lives outside this
    repo, and a `prebuild` npm script would run *before* Next loads `.env.local`, failing local
    builds that are correctly configured. `src/lib/seo.js` is the right mechanism precisely
    because it runs inside Next's env loading. The container must supply `FRONTEND_URL` at
    **both** image-build time and run time — `sitemap.js`/`robots.js` can render per-request.
  - **`.env.local.example`** — documents that requirement; the domain stays out of the repo.
  - **`src/lib/seo.test.js`** — new, 6 cases: dev fallback, production throw, blank-string
    treated as unset, configured origin, trailing-slash strip, canonical/OG construction.
  - **Verified — development:** `next dev` with `FRONTEND_URL` empty serves
    `Sitemap: http://localhost:3000/sitemap.xml` and `canonical="http://localhost:3000"`,
    no errors.
  - **Verified — production fail-fast:** `FRONTEND_URL= next build` exits 1 at
    "Collecting page data" with the configuration error.
  - **Verified — production output:** `FRONTEND_URL=https://www.eazworld.co next build`
    exits 0; `robots.txt`, `sitemap.xml`, canonicals and `og:url`/`og:image` all use the
    domain. `grep localhost:3000` over the prerendered output returns nothing.
  - Tests: 330 passed / 4 failed — the 4 are **pre-existing** on clean `main` (see T101),
    unrelated to this change. Lint: PASS (0 warnings). Build: PASS. Type check: N/A (JS only).
  - **Still open — deployment side:** `FRONTEND_URL` must actually be set in the Docker
    environment (build arg + runtime env) in the out-of-repo Dockerfile; that cannot be done or
    verified from here. Confirm the canonical host
    (`https://www.eazworld.co` vs apex `https://eazworld.co`) before setting it — the repo
    references both, and the choice must match the redirect the CDN serves.

---

## P2 — Improvements

- [~] **T98 · Six public pages ship with no metadata** (audit ref EZ-013)
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
    - [ ] Each listed page has a unique title and description  ← 5 of 6 done; /seo is a redirect shim, see T103
    - [x] Canonical URLs derive from `SITE_URL`
    - [x] Transactional pages are marked noindex rather than given marketing metadata
    - [x] Build and lint stay clean

  ### Implementation Notes (2026-08-29 — awaiting review)

  **The audit's premise was only partly right.** Its repro greps `page.jsx` alone, but in the App
  Router metadata may live in a sibling `layout.jsx`. Checked all six against the built HTML:

  | Page | Audit said | Actually |
  |---|---|---|
  | `hosting` | no metadata | ✅ already complete via `hosting/layout.jsx` |
  | `reviews` | no metadata | ✅ has metadata via `reviews/layout.jsx` (but see T104) |
  | `services/web-design` | no metadata | ✅ already complete via its `layout.jsx` |
  | `track-order` | no metadata | ⚠️ had title + noindex, but **no description and no canonical** |
  | `repair` | no metadata | ❌ genuinely bare — fixed |
  | `seo` | no metadata | ❌ bare, but it is a **redirect shim**, not a content page — see T103 |

  - **`src/app/repair/layout.jsx`** (new) — `/repair` is the 329-line booking form and is
    `"use client"`, so it cannot export `metadata` itself; a layout is the only route. Title
    targets booking intent ("Book a Device Repair in Accra") so it does not compete with the
    `/services/phone-repair` marketing page for the same query. Deliberately carries no
    "| EazWorld" — the root template appends it (see T104).
  - **`src/app/track-order/layout.jsx`** — added a description and its own canonical, kept
    `robots: { index: false, follow: true }`. It had been inheriting the root canonical, which
    told crawlers `/track-order` **is** the homepage. Left without Open Graph copy on purpose:
    T98's own guidance is noindex over marketing metadata for transactional pages.
  - **`/seo` left alone deliberately** — it is a 13-line client-side `router.replace()` to
    `/services/seo` with no content. Marketing metadata is the wrong tool; it needs a real
    server-side redirect and removal from `sitemap.js`. Logged as **T103**.
  - **Verified in the built HTML** (`FRONTEND_URL=https://www.eazworld.co next build`, exit 0):
    - `/repair` → `Book a Device Repair in Accra | EazWorld`, own description,
      `canonical=https://www.eazworld.co/repair`, `og:url` matching
    - `/track-order` → own description, `canonical=https://www.eazworld.co/track-order`,
      `robots=noindex, follow` retained
    - Brand-suffix stutter count unchanged at 7 — this change introduced none
  - Tests: 339 passed / 4 failed (the pre-existing T101 four). Lint: PASS. Build: PASS.
  - **Known gap:** `/track-order`'s `og:url` still inherits the root. Harmless while the page is
    noindex, and adding OG copy would contradict the acceptance criterion above.

- [~] **T99 · Plan the Next.js 16 upgrade to clear two high-severity PostCSS advisories** (audit ref EZ-014)
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
    - [x] Upgrade path assessed and scheduled
    - [ ] After upgrade, `npm audit --omit=dev` is clean  ← requires the upgrade itself
    - [ ] Build, lint and all frontend tests pass  ← requires the upgrade itself
    - [ ] Middleware auth/maintenance behaviour verified after the upgrade  ← requires the upgrade itself

  ### Assessment (2026-08-29 — planning only, no upgrade performed)

  **The advisory count in the Issue above is wrong, and understates it.** `npm audit`'s
  "2 high severity vulnerabilities" counts 2 **packages**, not 2 advisories. The JSON shows:

  | Package | Advisories | Highest CVSS | Fix |
  |---|---|---|---|
  | `next@14.2.35` | **21** | **8.6** (SSRF via WebSocket upgrades) | `next@16.3.3` (semver-major) |
  | `postcss` (via next) | 4 | 7.5 | same bump |

  The Issue's "build-time/tooling-scoped, not a live request path" holds for **PostCSS only**.
  Most of the 21 `next` advisories are runtime. Reachability triage against this codebase:

  - **Reachable — image optimizer.** `next.config.mjs:11` sets `remotePatterns: [{ protocol:
    "https", hostname: "**" }]`, i.e. any HTTPS host. That is precisely the configuration named
    by "DoS via Image Optimizer remotePatterns configuration" and "Unbounded next/image disk
    cache growth". **This is the most exposed item and it is a live endpoint.**
  - **Reachable — App Router RSC.** "DoS with Server Components", "cache poisoning in RSC
    responses", "cache confusion of response bodies" all apply to an App Router app.
  - **Not reachable — Server Actions** (4 advisories): `grep '"use server"'` returns nothing.
  - **Not reachable — Pages-Router i18n bypass**: no `i18n` config, App Router only.
  - **Not reachable — CSP nonce XSS**: the CSP in `next.config.mjs` uses `'unsafe-inline'`, no nonces.
  - **Partly reachable — `beforeInteractive` XSS**: used once (`layout.jsx:80`, theme init), but
    the injected string is static, not user input.

  **Migration surface measured in this repo** (14 → 16 crosses *two* majors, so both guides apply):

  | Change | This repo |
  |---|---|
  | Async `params`/`searchParams` (sync access **removed** in 16) | **9 server files** must `await params`: `blog/[slug]/{layout,page,opengraph-image}.jsx`, `portfolio/[slug]/{layout,page}.jsx`, `services/[slug]/{layout,page}.jsx`, `shop/[slug]/page.jsx`, `shop/category/[category]/page.jsx` |
  | Client component taking `params` as a prop | **1**: `order-confirmation/[reference]/page.jsx` → needs `use(props.params)` |
  | `opengraph-image` `params`/`id` become Promises | `blog/[slug]/opengraph-image.jsx` — hit by this **and** the async-params change |
  | `middleware` → `proxy` rename; **`edge` runtime unsupported in `proxy`** | `src/middleware.js` is 158 lines: `jose` JWT verify, 5 role gates, maintenance redirect, module-scope 30s cache. Moving to `proxy` means the Node runtime — the module-scope cache becomes per-instance |
  | React 18 → **19.2** required | `react`/`react-dom` are `^18`. Also bumps `@testing-library/react`, `framer-motion`, `@vitejs/plugin-react` |
  | Node **20.9+** | Local is v20.20.2 ✅. **The Docker base image's Node version must be confirmed ≥ 20.9 before upgrading** (Dockerfile is outside this repo) |
  | `next lint` **removed**; ESLint flat config | `package.json:9` is `"lint": "next lint"`, and `.eslintrc.json` is legacy format on `eslint@^8`. Needs ESLint 9 + flat config (codemod exists) |
  | `scroll-behavior` no longer overridden | `globals.css:16` sets `scroll-behavior: smooth` globally → add `data-scroll-behavior="smooth"` to `<html>` to keep today's behaviour |
  | Turbopack default for `dev` **and** `build` | No custom `webpack` config ✅ — low risk |
  | `next/image` defaults: `qualities` → `[75]`, `minimumCacheTTL` 60s → 4h, `imageSizes` drops 16, `maximumRedirects` → 3 | No `quality=` props anywhere ✅; the TTL and redirect changes need a visual check against supplier image hosts |
  | Next 15: `fetch` uncached by default | **No impact** — `lib/products.js:7` always sets an explicit `next.revalidate` or `cache:"no-store"`; `sitemap.js:42` and `middleware.js:19` likewise |
  | Parallel routes need `default.js` | No `@slot` directories ✅ |
  | AMP, `serverRuntimeConfig`, `next/legacy/image`, `@next/font`, `experimental-edge`, `NextRequest.geo/ip`, `revalidateTag` | None used ✅ |

  **Proposed staged plan** (each stage its own branch + review):

  1. **Pre-work (no Next change):** migrate `next lint` → ESLint CLI + flat config (`npx
     @next/codemod@canary next-lint-to-eslint-cli .`), bump ESLint 8 → 9. Confirm the Docker
     base image runs Node 20.9+. Doing this first keeps the lint gate working *through* the
     upgrade instead of breaking with it.
  2. **React 19 first, still on Next 14.2.35** if it installs cleanly — isolates React-vs-Next
     breakage. Run the suite; `@testing-library/react@16.3.2` already supports 19.
  3. **The upgrade itself:** `npx @next/codemod@canary upgrade latest`, then
     `npx @next/codemod@canary next-async-request-api .` (the `upgrade` codemod does *not* run
     the async-params migration). Hand-verify the 10 param files and the OG image route.
  4. **Middleware → proxy:** rename + rename the export, and re-verify every guard by hand —
     this file is the app's entire authorization boundary. **Acceptance criterion 4 lives here.**
  5. **Verify:** `npm audit --omit=dev` clean, build, lint, full suite, and a manual pass over
     login/logout, each role's dashboard gating, POS access, and maintenance mode.
  6. **Then revisit `remotePatterns: "**"`** — the image-optimizer advisories are the reachable
     ones, and a wildcard host allowlist keeps that surface open even on 16. Worth its own task.

  **Recommendation on sequencing:** this is not a same-day change. Stage 1 is safe to do now and
  is independently useful. Stages 2-4 want a quiet window and a real device/browser pass, since
  the middleware rename touches authentication for every role.

  **Not done here:** no packages installed, no `--force`, no code changed. T99's acceptance
  criteria 2-4 ("audit clean", "build/lint/tests pass", "middleware verified") can only be
  ticked once the upgrade itself is executed as its own scheduled piece of work.

- [x] **T100 · Checkout shows "Validation failed" and discards the field detail it already has** (audit ref EZ-018)
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
    - [x] Validation failures show a specific, actionable message
    - [x] Non-validation errors still show their message
    - [x] No raw internal detail is shown to users

  ### Implementation Notes (2026-08-29 — awaiting review)

  - **`src/lib/api.js`** — new exported `errorMessage(err, fallback)`. When the thrown Error
    carries `errors[]` it renders that detail; otherwise it returns `err.message`, then the
    fallback. Shows at most 3 field errors and appends `(+N more)`. A humanized field label
    (`pickupLocationId` → `Pickup location id`) is prefixed **only** when the message does not
    already name the field, so Zod's bare defaults ("Required") become actionable while
    hand-written messages ("A pickup location is required") are not made to stutter.
    `request()` is untouched — `err.message` still carries the backend's top-level string, so
    no existing caller changes behaviour.
  - **`src/app/checkout/page.jsx`** — 3 error handlers now call it: the shipping-quote
    `.catch` (`setQuoteError`), the address-modal save (`setModalError`), and `handlePlaceOrder`
    (`setError`). Import changed to `{ api, errorMessage }`. No other lines touched.
  - **`src/lib/api.test.js`** — 8 new cases (5 → 13): field detail preferred, non-validation
    messages preserved, fallback when there is no message, no stutter when the message names
    the field, Zod bare defaults get labelled, array indices stripped from nested paths, the
    3-error cap, entries with no usable message ignored, and an end-to-end `api.post` rejection.
  - **Verified against the real backend:** posted an invalid payload to
    `POST /api/v1/shipping/quote` and captured the body verbatim —
    `errors: [{items, "At least one item is required"}, {pickupLocationId, "A pickup location
    is required for bus-station pickup."}]`. That exact payload is now pinned in the test; the
    checkout banner renders *"At least one item is required A pickup location is required for
    bus-station pickup."* in place of *"Validation failed"*.
  - **No internal detail leaks:** the helper only reads `errors[].field/message`. `lib/api.js`
    already excludes `stack` from the fields it copies onto the Error, and the backend's
    production 500 path returns a generic string with no `errors[]`.
  - Tests: 339 passed / 4 failed — the 4 are the pre-existing T101 failures, unrelated.
    Lint: PASS (0 warnings). Build: PASS. Type check: N/A (JS only).
  - **Not done — deliberate scope limit:** 84 other call sites across ~40 files still use the
    raw `err.message || "…"` pattern and would benefit from the same helper. Rolling that out
    is tracked as T102 rather than swept in here.

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

## Final production re-audit (2026-08-29) — new findings

- [ ] **T129 · Dead code audit — frontend findings (Phase A complete, deletions awaiting sign-off)** (dead-code audit 2026-08-29)
  - **Full report:** `docs/DEAD-CODE-REPORT.md`. Branch `chore/dead-code-audit`. **Nothing deleted yet.**
  - **Confirmed dead (3):**
    - `src/hooks/queries/useContacts.js` — the whole module. Its only export, `useConsultations`, has
      **0 references**; the admin consultations page calls `api.get("/contacts?…")` directly instead.
    - `@playwright/test` and `playwright` (dev) — **no `playwright.config.*`, no `*.spec.js`, no
      `e2e/` directory** anywhere in the repo. Also pulls browser binaries on install.
  - **Not dead, despite looking it:** `@testing-library/jest-dom` (wired in `vitest.setup.js`) and
    `eslint-config-next` (wired in `.eslintrc.json`). Recorded so a future scan does not re-flag them.
  - **Duplicate implementations — the live one is both.** 50 files use `@/hooks/queries/*`, 21 call
    `api.*` directly, and **5 do both in the same file**. CLAUDE.md documents the coexistence and
    prefers react-query for new work. The dead `useContacts.js` above is a symptom: the hook was
    written, the page kept the old pattern. Migrate page-by-page when files are touched — not a
    deletion task, and not something to sweep in one pass.
  - **Env drift:** `NEXT_PUBLIC_CPANEL_URL` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` are documented in
    `.env.local.example` but **never read**. The Paystack public key is unused because checkout
    redirects via the server-created authorization URL rather than Paystack inline JS — scaffolding
    if inline checkout is planned, otherwise documentation for a variable nobody sets.
  - **Debug artifacts: none.** Zero `console.log` and zero `debugger` in `src/`. 5 TODO/FIXME markers,
    low priority.
  - **Methodology note worth keeping:** two of three detection passes were wrong before being caught
    by sanity checks — one flagged 118 files, another 274, including the entire `ui/` component
    library. Both were tooling bugs (a zsh glob failure silencing grep, then a quoting error), not
    findings. **Any future scan claiming `ui/` or `lib/api.js` is unused is broken** — validate the
    detector against a known-live module before trusting its output.
  - **Scope if approved:** 1 file (~15 LoC), 2 dev dependencies.

- [ ] **T127 · Checkout submits customer details without sanitising, against the project's own convention** (input-sanitisation sweep 2026-08-29) — **CONFIRMED**
  - **Issue:** `STYLE_GUIDE.md` and `CLAUDE.md` both state "sanitize form input on submit with
    `lib/sanitize.js`". `src/app/checkout/page.jsx` does not import it at all — it posts
    `customer.name`, `phone`, `email` and `street` straight from state. Same for
    `src/app/hosting/checkout/page.jsx`. Counted across the app: **44 components post data, 14 call a
    sanitiser.** The public-facing files with none are:
    `checkout/page.jsx`, `hosting/checkout/page.jsx`, `track/[token]/page.jsx`,
    `auth/verify/page.jsx`, `auth/verify-2fa/page.jsx`, `auth/reset-password/[token]/page.jsx`.
  - **Impact:** **not** an XSS hole — the backend's global `xss-clean` escapes nested body values,
    verified directly. The cost is that the shop's highest-value form is the one place the convention
    is skipped, so unbounded and malformed values reach the server, where `Order.customer` has no
    length cap or email validator either (**`backend-eaz/tasks.md` T125**). The two gaps line up:
    neither layer bounds the input.
  - **Lower priority within this task:** the three `auth/*` files submit PINs and tokens, and
    `sanitizePin` exists for exactly that; `track/[token]` submits a lookup token. Real but minor
    next to checkout.
  - **Repro:** `grep -L "sanitize[A-Z]" $(grep -rl "api\.\(post\|patch\|put\)(" src/app --include "*.jsx" | grep -v test)`
  - **Fix:** apply `sanitizeName` / `sanitizeEmail` / `sanitizePhone` / `sanitizeText` in checkout's
    submit handler, as `CheckoutForm.jsx` and the auth register/login pages already do. Sanitise on
    submit, never on keystroke — that is the documented rule and the reason typing is not disrupted.
  - **Location:** `src/app/checkout/page.jsx`; `src/app/hosting/checkout/page.jsx`; the four listed above

- [ ] **T123 · The `FRONTEND_URL` fail-fast stops at the frontend — the backend still degrades silently** (final re-audit 2026-08-29) — **CONFIRMED, cross-app**
  - **Issue:** T97 is genuinely fixed on this side: `src/lib/seo.js` throws when
    `NODE_ENV === "production"` and `FRONTEND_URL` is unset, verified by build (`exit 1` with the
    configuration error) and by `src/lib/seo.test.js`. But the backend's `utils/frontendUrl.js`
    returns an **empty string** in the same situation, with no throw.
  - **Impact:** the customer-visible half of the problem T97 set out to solve is still live, and it
    reaches payments rather than SEO — Paystack `callback_url` and SMS tracking links are built from
    the backend value. See **`backend-eaz/tasks.md` T119** for the detail and the fix.
  - **Why it is logged here too:** T97's acceptance reads as satisfied from this repo alone, which is
    how the backend half stayed invisible. Anyone re-checking T97 should read both.
  - **Location:** `src/lib/seo.js` (fixed); `backend-eaz/utils/frontendUrl.js` (not fixed)

- [ ] **T124 · Two high-severity PostCSS advisories remain in the shipped dependency tree** (final re-audit 2026-08-29) — **CONFIRMED, unchanged**
  - **Issue:** `npm audit --omit=dev` still reports **2 high severity** in `frontend-eaz`, reaching
    the app transitively through `next@14.2.35`. The backend is clean — `npm audit` and
    `npm audit --omit=dev` both report **0 vulnerabilities**.
  - **Impact:** unchanged from T99's assessment. PostCSS runs at build time, so the two PostCSS
    advisories are not a live request path. The `next` advisories bundled in the same fix **are**
    runtime, and the image-optimizer ones remain reachable via
    `next.config.mjs` `remotePatterns: [{ hostname: "**" }]`.
  - **Not a duplicate of T99:** T99 is the *plan* for the Next 16 upgrade and is assessed. This
    records that as of the final audit nothing has changed, so the risk ships as-is unless the
    upgrade is scheduled first.
  - **Repro:** `cd frontend-eaz && npm audit --omit=dev`
  - **Decision needed before deploy:** accept the risk explicitly, or narrow `remotePatterns` to the
    supplier hosts actually used — which shrinks the reachable surface without the framework upgrade.

---

## Ad-hoc fixes (found during work, outside the original audit)

- [x] **T101 · Four `business-settings` tests fail on `main` — ambiguous "Shop Profile" text** (found during T97, 2026-08-29)
  - **Issue:** `src/app/dashboard/(admin)/business-settings/page.test.jsx` — 4 of its 5 cases fail
    with `TestingLibraryElementError: Found multiple elements with the text: Shop Profile`. The page
    renders the string twice: as a tab label (`<span class="hidden sm:inline">`) and as the section
    heading (`<h2>`), so the tests' `getByText("Shop Profile")` is ambiguous.
  - **Impact:** `npm test` is red on a clean tree (330 passed / 4 failed, 51 of 52 files green), so
    the frontend suite cannot gate anything until it is fixed. No user-facing defect — the page
    itself renders correctly; this is a test-query problem, not a product bug.
  - **Repro:** `git stash -u && npx vitest run "src/app/dashboard/(admin)/business-settings/page.test.jsx"`
    — fails identically with no local changes, confirming it predates T97.
  - **Fix:** scope the queries (`getByRole("heading", { name: "Shop Profile" })`, or the `*AllBy*`
    variant) rather than changing the page's markup to satisfy the test.
  - **Location:** `src/app/dashboard/(admin)/business-settings/page.test.jsx`
  - **Not fixed under T97** — out of scope for that task; logged here per the one-task-at-a-time rule.

  ### Implementation Notes (2026-08-29)

  - **The original diagnosis covered one of four failures.** Only `renders all three sections` hit
    the ambiguous "Shop Profile"; the other three failed on a missing VAT switch, a missing rate
    input and a missing "Add service" button.
  - **Real cause:** the page was later split into tabs (`page.jsx:1077-1082`) and renders only the
    active tab's section — `{activeTab === "services" && <ServicesSection …>}`. The tests predated
    that and queried every section from a single render, so the fields they wanted were not hidden,
    they were unmounted. Not a product defect: the page renders correctly.
  - **Fix, in the tests only** — the page was not changed to suit them. An `openTab(label)` helper
    clicks the tab first; the ambiguous query is scoped with
    `getByRole("heading", { name: "Shop Profile" })`. Tab lookups use an **exact** name, not a
    regex: `/Shop Profile/i` also matches the "Save shop profile" button.
  - Added a case asserting only the active tab's section is mounted, so the next person sees why
    a cross-section query fails instead of rediscovering it.
  - **The frontend suite is fully green for the first time: 54/54 files, 357/357 tests**, lint
    clean. It can gate now.

- [ ] **T102 · Roll `errorMessage()` out to the other 84 raw `err.message` call sites** (follow-up to T100)
  - **Issue:** T100 added `errorMessage(err, fallback)` to `src/lib/api.js` and wired it into
    `src/app/checkout/page.jsx` only. `grep -rn "err\.message ||" src` still finds **84** sites
    across ~40 files — auth (login, register, verify, forgot/reset password, verify-2fa),
    `track/[token]`, `track-order`, dashboard and admin forms — each showing the bare
    "Validation failed" the audit flagged.
  - **Impact:** Same defect as T100, just on other forms. Registration and password reset are the
    highest-value ones: they are Zod-validated and are where a user most needs to know which field
    is wrong.
  - **Repro:** `grep -rn "err\.message ||" src --include "*.jsx" | grep -v "\.test\."`
  - **Fix:** swap `err.message || "…"` for `errorMessage(err, "…")`. Mechanical, but it changes
    user-visible copy on every form it touches, so it wants its own review pass — which is why
    T100 did not sweep it in.
  - **Location:** ~40 files under `src/app/`, listed by the grep above
  - **Acceptance:**
    - [ ] Validation failures show field detail on every converted form
    - [ ] Non-validation errors unchanged
    - [ ] Tests and lint stay clean

- [ ] **T103 · `/seo` is a client-side redirect shim that is listed in the sitemap** (found during T98, 2026-08-29)
  - **Issue:** `src/app/seo/page.jsx` is 13 lines of `"use client"` + `useEffect(() => router.replace("/services/seo"))`.
    It renders nothing, yet `sitemap.js:25` advertises `/seo` at priority 0.5, and
    `next.config.mjs` permanently redirects `/service/seo → /seo`, which then client-redirects
    again to `/services/seo` — a two-hop chain whose second hop needs JavaScript.
  - **Impact:** Crawlers are pointed at a blank page that only redirects once JS runs; link equity
    from the `/service/seo` 308 is diluted across the chain. `/services/seo` is *also* in the
    sitemap (line 9), so the two compete.
  - **Repro:** `curl -s localhost:3000/seo` returns an empty shell; compare `sitemap.js:9` and `:25`.
  - **Fix:** replace the client component with a server-side `permanentRedirect("/services/seo")`
    (or point the `next.config.mjs` redirect straight at `/services/seo` and delete the route),
    then drop `/seo` from `STATIC_ROUTES`.
  - **Location:** `src/app/seo/page.jsx`; `src/app/sitemap.js:25`; `next.config.mjs` redirects
  - **Not fixed under T98** — T98 asked for metadata; this page needs a routing change instead.

- [ ] **T104 · Seven pages render a doubled "| EazWorld" brand suffix** (found during T98, 2026-08-29)
  - **Issue:** the root layout sets `title.template = "%s | EazWorld"` (`src/app/layout.jsx:36`), so
    any page whose own title already contains the brand gets it twice. Built output shows 7:
    `Branding & Identity Pricing | EazWorld | EazWorld`, `Client Reviews | EazWorld — Digital Agency
    Accra, Ghana | EazWorld`, `Dashboard | EazWorld | EazWorld`, `Email Marketing Pricing | EazWorld
    | EazWorld`, `Paid Advertising Pricing | EazWorld | EazWorld`, `SEO & Content Marketing Pricing |
    EazWorld | EazWorld`, `Social Media Management Pricing | EazWorld | EazWorld`.
  - **Impact:** wasted pixels in the SERP title (Google truncates ~60 chars) and a sloppy-looking
    browser tab. `reviews` loses real keywords to the repetition.
  - **Repro:** `grep -rho "<title>[^<]*</title>" .next/server/app --include "*.html" | sort -u | grep -c "EazWorld.*EazWorld"`
  - **Fix:** drop the brand from each page's own title, or use `title: { absolute: … }` where the
    full string is intentional. Pages built through `buildMetadata()` in `src/lib/seo.js` are
    already immune — it sets `title: { absolute }`.
  - **Location:** the 7 layouts/pages behind those titles
  - **Not fixed under T98** — only `reviews` is among T98's six, and fixing 1 of 7 would leave the
    set inconsistent; worth one pass of its own.

- [x] **T106 · Marketplace's two tabs list the same collection twice** (found 2026-08-29, after the parts/products merge)
  - **Issue:** `/dashboard/commerce` renders a tab switcher — **"Repair Parts"** and **"Shop
    Products"** (`src/app/dashboard/commerce/page.jsx:618-621`). Since parts were folded into
    `Product`, both tabs read the *same* collection with no distinguishing filter:
    | Tab | Endpoint | Backend query |
    |---|---|---|
    | Repair Parts | `GET /pos/inventory` | `Product.find({})` — `controllers/pos/inventoryController.js:30` |
    | Shop Products | `GET /products/all` | `Product.find({})` — `controllers/productController.js:220` |
    `getParts` says so itself: *"shop stock and bench parts are one collection now, so every
    search already spans both"*, and its `includeProducts` param is accepted and ignored.
  - **Impact:** Every item appears under both tabs, so the counts double-count and editing an
    item in one tab silently changes what the other shows. The page's heading still reads
    "Inventory" while the sidebar calls it "Marketplace", and the subtitle ("Manage repair parts
    and shop products from one place") describes the pre-merge world.
  - **Repro:** open `/dashboard/commerce`, note an item under "Repair Parts", switch to "Shop
    Products" — the same document is listed again.
  - **Fix:** collapse to a single list over the merged collection and make the repair-vs-shop
    distinction a **filter**, not a tab — the data already supports it via `sellInStore` /
    `sellOnline` and the two taxonomies (`partCategory` / `category`). Remove `ProductsTab`,
    promote `PartsTab` to the single view, and align the heading/subtitle with the sidebar label.
  - **Also here:** `/dashboard/commerce/products` → `/dashboard/commerce/inventory` →
    `/dashboard/commerce` is a **two-hop client-side redirect chain** (both shims are `useEffect`
    + `router.replace`). Same pattern as T103 — worth collapsing to one server redirect.
  - **Location:** `src/app/dashboard/commerce/page.jsx` (672 lines; `PartsTab` :220, `ProductsTab`
    :500, switcher :613-670); the two redirect shims in the same directory
  - **Acceptance:**
    - [ ] One list, no duplicated items
    - [ ] Repair-vs-shop available as a filter
    - [ ] Heading, subtitle and sidebar label agree
    - [ ] Old `/products` and `/inventory` links still land on the merged page

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
