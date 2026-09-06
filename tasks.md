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
  - **`amplify.yml` deleted** (2026-08-29, after review) — the app is not hosted on AWS Amplify,
    so that file was dead config and the `preBuild` guard I first put there would never have run.
    (Hosting has since settled on a Namecheap cPanel reseller plan under Passenger; `.cpanel.yml`
    is tracked in this repo.) No replacement guard was added: the Dockerfile lives outside this
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

- [ ] **T138 (frontend) · UI for per-unit (IMEI/serial) tracking** — P1, blocked on the backend half
  - **Issue:** Nothing in the dashboard can record or show which physical handset is which.
    Stock is a single number everywhere it appears, so a serialised product looks identical to a
    box of cables. Backend scope, schema and phasing live in **`backend-eaz/tasks.md` → T138**;
    build against that model, do not invent a parallel shape.
  - **Screens to build** (matching the backend's three phases):
    1. **Receiving** — capture IMEIs when stock arrives. There is no intake screen today; stock is
       set by typing a number into the product form. Reuse `hooks/useBarcodeScanner.js` so staff
       scan the IMEI barcode off the box instead of typing 15 digits. Validate Luhn client-side
       for instant feedback, but never rely on it — the API validates too.
    2. **Unit list per product** — `dashboard/commerce`: which units are in stock, sold, returned,
       written off; filter by status; search by IMEI.
    3. **Sale flow** — POS (`dashboard/pos/sell`) and the online order view pick/show the specific
       unit sold, and the refund flow returns that unit.
  - **UI notes:**
    - `serialised` products need a visibly different stock cell — a count alone is misleading once
      units exist. The Marketplace list is `src/app/dashboard/commerce/page.jsx`.
    - IMEI is staff-only. Keep it off customer-facing order views and the public
      `track-order` / by-reference pages.
    - Money stays in pesewas; render any unit cost with `formatGhs` from `lib/shop.js`.
    - New data fetching goes through **react-query** hooks in `hooks/queries/`, per the house rule.
    - Reuse `components/ui/Table.jsx` for the unit list rather than hand-rolling another
      grid-based pseudo-table.
  - **Acceptance:**
    - [ ] Staff can record IMEIs on arrival, by scanner or by hand
    - [ ] A product's units are listable and searchable by IMEI
    - [ ] POS and online sales show which unit went out; refunds return that unit
    - [ ] Non-serialised products' screens are visually and behaviourally unchanged
    - [ ] No IMEI appears on any customer-facing or public page

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

  **Recommendation on sequencing:** this is not a same-day change. Stages 2-4 want a quiet window
  and a real device/browser pass, since the middleware rename touches authentication for every
  role.

  ### ⚠️ STAGE 1 IS BLOCKED ON NEXT 14 — attempted and reverted 2026-08-30

  **The stage ordering above is wrong.** Stage 1 said the ESLint 9 + flat-config migration was
  "safe to do now" and should come FIRST, so the lint gate survives the Next upgrade. It cannot
  be done first. Measured, not guessed:

  1. `eslint-config-next@14.2.35` ships **no flat-config export** — only eslintrc-style files
     (`index.js`, `core-web-vitals.js`, `typescript.js`, `parser.js`) and no `exports` map. A
     flat config therefore needs `FlatCompat` as a bridge. That part works.
  2. Under flat config, plugins resolve from the PROJECT ROOT, not from
     `eslint-config-next`'s own tree the way `next lint` resolved them. `eslint .` fails with
     *ESLint couldn't find the plugin "eslint-plugin-react-hooks"*.
  3. Installing that plugin at the root fails: `eslint-config-next@14.2.35` pins
     **`eslint-plugin-react-hooks@5.0.0-canary-7118f5dd7-20230705`**, whose peer range is
     `eslint@^3 || ^4 || ^5 || ^6 || ^7 || ^8` — it **does not support ESLint 9**.
  4. Installing a newer react-hooks instead also fails: `eslint-config-next@14.2.35` is what pins
     the canary, so npm cannot resolve around it (`ERESOLVE ... While resolving:
     eslint-config-next@14.2.35`).

  Reaching into `eslint-config-next/node_modules/` to load the nested plugin would "work" and was
  rejected: it depends on npm's hoisting layout and breaks on the next install.

  **Revised ordering:** ESLint 9 + flat config must come WITH or AFTER the
  `eslint-config-next` upgrade, not before it. Either bump `eslint-config-next` on its own first
  (untested — it may not be independently installable against Next 14), or accept that `next lint`
  keeps working right up to the Next 16 bump and migrate lint as part of stage 3.

  **Everything was reverted** — `package.json`, `package-lock.json` and `eslint.config.mjs`.
  `next lint` is clean and the tree is unchanged. Nothing about this attempt is left in the repo.

  **Carry forward when it IS done:** the flat config must explicitly keep `no-unused-vars`
  (with the `^_` escape hatch), `no-array-constructor` and `no-unused-expressions`.
  `next/core-web-vitals` configures none of them — see T135 — and in a single day that rule set
  caught a dead `onPassword` prop, an unused `blockTarget` left by a bad scripted deletion, and an
  orphaned `Key` import. A migration that just carries the preset across switches them off while
  lint still reports "clean".

  **Not done here:** no packages installed, no `--force`, no code changed. T99's acceptance
  criteria 2-4 ("audit clean", "build/lint/tests pass", "middleware verified") can only be
  ticked once the upgrade itself is executed as its own scheduled piece of work.

  ### Safe prep stage executed (2026-09-01 — async-params migration, Next 14 compatible)

  The reversible, framework-independent half of the plan is now done **on the current tree**:

  - **9 server files converted** to `await props.params` (async-request-api codemod + hand-fixes):
    `blog/[slug]/{layout,page,opengraph-image}.jsx`, `portfolio/[slug]/{layout,page}.jsx`,
    `services/[slug]/{layout,page}.jsx`, `shop/[slug]/page.jsx`, `shop/category/[category]/page.jsx`.
    `sync` `generateMetadata` fns had to become `async` to `await`. Safe on Next 14: `params` is a
    plain object there, so `await` is a no-op; async pages/layouts and async `generateMetadata`
    are fully supported. Lint clean, full suite 57/57 files + 389/389 tests green, `next build`
    exits 0 (78 pages incl. the OG route).
  - **`order-confirmation/[reference]/page.jsx` NOT converted — intentionally.** React 18.3.1 in
    this tree ships **no `use` export** (verified: `use` landed in React 19), and `use(props.params)`
    is the required Next 15/16 pattern for a client page. Converting it now would crash the page at
    runtime, so it waits for the React 19 half of the upgrade (stage 2) — a one-line change then.
  - **Codemod note:** `@next/codemod@canary next-async-request-api` accepts a **single** directory
    (extra dir args were silently dropped) and skips `opengraph-image` routes — the OG route was
    converted by hand.
  - **Remaining for T99:** React 18→19 + the upgrade itself (stage 3), `middleware`→`proxy`
    (stage 4, the authorization boundary), ESLint 9 + flat config carried alongside
    (stage 3, per the 2026-08-30 revision), and the Docker Node ≥20.9 confirmation (out of repo).


---

## Missing Features (new work — mirrors backend-eaz/tasks.md's "Missing Features" section)


---

## Final production re-audit (2026-08-29) — new findings


---

## Ad-hoc fixes (found during work, outside the original audit)


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
