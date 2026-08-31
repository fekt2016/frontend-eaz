# EazWorld Frontend Audit

> **Phase 0 deliverable — discovery only. No source file has been modified.**
> Every number below was measured against the working tree on 2026-08-25, not estimated.
> Baseline verified before writing: **301 tests passing (47 files), ESLint clean, `next build` succeeds.**

---

## 1. Project Overview

EazWorld is a Ghana-based (Accra) **digital agency + e-commerce + in-store POS** platform. It is not a
single product — it is five products sharing one shell:

| Product line | Surface |
|---|---|
| Digital agency | Services, portfolio, case studies, consultations, blog, reviews |
| E-commerce | Shop, cart, checkout, orders, pre-orders, delivery zones, tracking |
| Domains | Search, registration, checkout (Namecheap-backed) |
| Hosting | Plans, checkout, provisioning, account management (WHM/cPanel) |
| Repair POS | In-store device repair — jobs, parts, suppliers, expenses, warranty, receipts |

Two apps, each its own git repository, inside a non-repo parent folder:

- `backend-eaz/` — Node + Express, plain **CommonJS JavaScript**, Mongoose/MongoDB
- `frontend-eaz/` — **Next.js 14 App Router**, JavaScript/JSX, Tailwind CSS

**Audience is genuinely mixed**, which matters for the redesign: anonymous public visitors, retail
customers, signed-in account holders, shop staff, repair technicians, admins, and a superadmin.
Middleware actively separates them — staff-side roles are *redirected out of* the public storefront.

### Working state at audit time
Both repos have **uncommitted work in progress** which I have preserved and not touched:

- `frontend-eaz`: `src/app/hosting/page.jsx`, `src/app/hosting/checkout/page.jsx`, `tasks.md`
- `backend-eaz`: hosting/domain controllers, routes, `config/hostingPlans.js`, 4 test files, `tasks.md`

---

## 2. Technology Stack

Verified from `package.json`, config files, and actual imports — not assumed.

### Frontend (`frontend-eaz`)
| Concern | Actual |
|---|---|
| Framework | **Next.js 14.2.35**, App Router |
| Language | **JavaScript / JSX — no TypeScript** (`jsconfig.json`, `@/*` → `./src/*`) |
| React | **18** |
| CSS | **Tailwind CSS 3.4.1**, `darkMode: "class"`, PostCSS. No CSS-in-JS, no CSS modules |
| UI kit | **None.** No shadcn, no Radix, no Headless UI, no MUI — all UI is hand-rolled |
| Icons | **Two libraries**: `lucide-react` (103 files) + `react-icons/fa` (21 files) |
| Animation | `framer-motion` 12 — **only 5 files use it** |
| Server state | `@tanstack/react-query` v5 (+ devtools), 24 hooks in `hooks/queries/` |
| Client state | React Context — `AuthContext`, `CartContext`, `ThemeContext` |
| Routing | App Router file-system + `src/middleware.js` |
| Forms | **No form library.** Plain `useState` + manual handlers |
| Validation | `zod` 4 on the client, `dompurify` + `lib/sanitize.js` for input |
| HTTP | **Custom 50-line `fetch` wrapper** (`lib/api.js`) — not axios |
| Auth (client) | `jose` for JWT verification inside middleware |
| Testing | **Vitest 2** + Testing Library + jsdom; **Playwright** installed |
| Lint | ESLint 8 + `eslint-config-next` |
| Deploy | AWS Amplify (`amplify.yml`) |

### Backend (`backend-eaz`)
Node + Express (CommonJS), Mongoose/MongoDB, **28 models**, **22 route groups** under `/api/v1`.
JWT in an httpOnly cookie. Paystack (card + MoMo), Cloudinary, Resend + react-email, Namecheap
(domains), WHM (hosting), `@anthropic-ai/sdk` (chat). Jest + `mongodb-memory-server`. PM2 + Nginx
on cPanel/EC2, tuned for a **512 MB heap**.

> **Nothing needs to be installed for the redesign.** Tailwind, framer-motion, react-query and the
> test tooling are already present. The only dependency question is whether to *remove* `react-icons`.

---

## 3. Architecture

### Request path
```
Browser → Next.js (:3000)
  ├── middleware.js   maintenance gate → JWT verify (jose) → role routing → auth guards
  ├── /api/v1/*       rewritten to NEXT_PUBLIC_API_URL (Express :5000)
  └── App Router      layout.jsx → providers → ConditionalLayout → page
```

The browser **only ever talks to its own origin** — API calls go through Next rewrites. This keeps
CSP tight (`connect-src 'self'`) and avoids mixed-content on Amplify.

### Provider tree (`app/layout.jsx`)
```
QueryProvider → ThemeProvider → AuthProvider → CartProvider
  → JsonLd → ConditionalLayout(children) → CartDrawer
```
A `beforeInteractive` inline script reads the `eazworld-theme` cookie and sets `.dark` on `<html>`
before paint — **no theme flash**. This is well built and must be preserved.

### Layout shells — there are four
1. **Public** — `ConditionalLayout` renders `Navbar` + `<main>` + `Footer` + `ChatWidget`
2. **`/dashboard/*`** — bare; `DashboardGuard` → `AppShellDecision` → `DashboardShell` (+ `Sidebar`)
3. **`/dashboard/commerce/*`** — its own layout, but reuses `DashboardShell title="Marketplace"`
4. **`/dashboard/pos/*`** — `PosShell` (separate shell)

Navigation is **already centralised** in `app/dashboard/dashboardNav.js` (`baseNav`, `adminNav`,
`marketplaceNav`, `posNav`) with role gating and its own test. This is good and should be kept.

---

## 4. Route Map

**87 `page.jsx` routes.** Auth column reflects `src/middleware.js` (server-enforced).

### Public — marketing (no auth)
| Route | Purpose | Key components |
|---|---|---|
| `/` | Homepage | `HeroCarousel`, `RecentProducts`, `ServicesGrid`, `Testimonials`, `BlogPreview`, `CtaSection` |
| `/about`, `/contact`, `/visit-us` | Company | `ContactForm` |
| `/services` + 7 children | Web design, SEO, paid ads, branding, social, email, phone repair | `ServiceDetail`, `PhoneRepair` |
| `/services/[slug]`, `/seo` | Dynamic + legacy service pages | redirects from `/service/*` |
| `/portfolio`, `/portfolio/[slug]` | Case studies | `PortfolioListing`, `PortfolioDetail` (lightbox) |
| `/blog`, `/blog/[slug]` | Blog | `BlogListing`, `BlogArticle` |
| `/reviews`, `/resources`, `/repair` | Social proof, resources, repair booking | `ReviewForm`, `ResourcesListing` |
| `/book-consultation` | Lead capture | `BookConsultation` |
| `/privacy`, `/terms`, `/maintenance` | Legal + maintenance gate | — |

### Public — commerce (no auth)
`/shop`, `/shop/[slug]`, `/shop/category/[category]`, `/cart`, `/checkout`,
`/order-confirmation`, `/order-confirmation/[reference]`, `/payment-success`,
`/track-order`, `/track/[token]`, `/track/order/[trackingNumber]`

### Public — domains & hosting (no auth)
`/domains`, `/domains/checkout`, `/hosting`, `/hosting/checkout`,
`/hosting/order-confirmation`, `/hosting/bank-transfer/[orderId]`

### Auth (`/auth/*`, own layout, Navbar suppressed)
`login`, `register`, `verify`, `verify-2fa`, `forgot-password`, `reset-password/[token]`

### Customer dashboard — **token required**
`/dashboard`, `/dashboard/orders`, `/dashboard/orders/[id]`, `/dashboard/repairs`,
`/dashboard/hosting`, `/dashboard/hosting/[orderId]`, `/dashboard/hosting/new-account`,
`/dashboard/domains`, `/dashboard/notifications`, `/dashboard/settings`
*(Hosting + Domains hidden from `technician`.)*

### Admin — **admin/superadmin only** (route group `(admin)`, no URL segment)
`consultations`, `chats`, `reviews`, `blog`, `hosting-orders`, `domain-orders`, `users`,
`emails`, `activity-logs`, `business-settings`

### Marketplace — **admin/superadmin/staff**
`/dashboard/commerce` (+ `orders/[id]`, `preorders`, `shipments`, `products`, `products/new`,
`products/[id]/edit`, `inventory`, `delivery-zones` *(admin-only)*)

### POS — **superadmin/admin/staff/technician**
`/dashboard/pos` (+ `sell`, `orders`, `jobs`, `jobs/new`, `jobs/[id]`, `suppliers`,
`suppliers/[id]`, `expenses`, `warranty`, `reports`)

### Route-level states — a real gap
**Exactly one `loading.jsx`, one `error.jsx`, one `not-found.jsx` — all at the app root.** Across 87
routes there are no per-segment loading skeletons or error boundaries. A failure anywhere in the
dashboard, POS or shop replaces the entire screen with the global error page.

---

## 5. Feature Map

Only features I verified in the repository.

**Auth** — register, login, logout, email verification (PIN), **2FA**, forgot/reset password,
role-based landing (`lib/roles.js#landingPathForRole`), JWT httpOnly cookie, rate-limited endpoints.

**Roles** — `user`, `staff`, `technician`, `admin`, `superadmin`. Staff-side roles are actively
**redirected out of the public storefront** by middleware.

**Shop** — catalog, categories, product detail, reviews & ratings, **pre-orders with progress**,
cart (context + drawer), checkout, delivery zones, order confirmation, **public order tracking by
token/tracking number**, shipments, inventory, stats/popularity.

**Payments** — Paystack card + **Mobile Money** (`useCardCharge`, `useMomoCharge`), service payment
modal, bank transfer flow for hosting, webhook-driven fulfilment.

**Domains** — search/availability, registration, checkout, admin order management.

**Hosting** — plans, checkout, order confirmation, bank transfer, provisioning, account lifecycle
(status/password/suspend/terminate), admin order management.

**POS** — barcode scanning (`useBarcodeScanner`), sell/till, repair jobs + photos, suppliers,
expenses, warranty, reports with charts (`RevenueChart`, `DonutChart`, `KpiCard`), **thermal
receipt printing** (`lib/printReceipt.js`).

**Content** — blog, portfolio/case studies, services, resources, testimonials, reviews.

**Ops** — notifications + bell, activity log, email logs, chat sessions, business settings,
**maintenance mode** (middleware-gated, admin bypass), AI chat widget.

**SEO** — `lib/seo.js`, per-route metadata, JSON-LD (`JsonLd`, `organizationJsonLd`), dynamic
`sitemap.xml`, `robots.txt`, `opengraph-image`. **This is real and must not regress.**

---

## 6. Existing Design System

**The token layer is genuinely good and should be kept, not replaced.** It is documented in
`STYLE_GUIDE.md`, and the doc is honest about what exists.

### Where it lives
- `frontend-eaz/tailwind.config.js` — colors + fonts
- `frontend-eaz/src/app/globals.css` — CSS vars, focus ring, `.star-rule`
- `STYLE_GUIDE.md` (repo root) — conventions

### Colors
| Token | Value | Role |
|---|---|---|
| `brand-50…950` | `#F2A311` @ 500 | Kente-gold accent, full ramp, single source of truth |
| `paper` | `#FBF6EC` | Warm light page background |
| `ink` | `#161209` | Warm dark page background |
| `star.red/gold/green` | `#C0392B` / `#F2A311` / `#0F7B4F` | Ghana flag — **used only in the star rule** |
| `gray-*` / `slate-*` | Tailwind default | Text, borders, fills |

There is **no semantic token layer** — no `success` / `warning` / `error` / `info` / `surface` /
`border` tokens. Status colors are raw Tailwind (`emerald-600`, `red-500`, `amber-*`) applied ad hoc.

### Typography
- `font-display` → **Space Grotesk** (400/500/700) — headings
- `font-sans` → **DM Sans** (300/400/500) — body
- `font-mono` → **Space Mono** (400/700) — eyebrows, stats, SKUs

Loaded via `next/font/google` with CSS variables. Good.

### Shape, elevation, motion (measured)
| Radius | Count | | Shadow | Count |
|---|---|---|---|---|
| `rounded-full` | 587 | | `shadow-sm` | 52 |
| `rounded-2xl` | 343 | | `shadow-2xl` | 12 |
| `rounded-xl` | 276 | | `shadow-xl` | 11 |
| `rounded-lg` | 90 | | `shadow-lg` | 9 |
| `rounded-3xl` / `md` / `sm` / `none` | 6 / 5 / 1 / 1 | | `shadow-md` | 8 |

**Gradients: 5 total occurrences in the entire app.**

> **Important correction to the brief's assumptions.** This codebase does **not** suffer from
> excessive gradients, excessive shadows, or excessive rounded corners. Shape language is disciplined
> (`full` for pills, `2xl` for cards, `xl` for inputs) and elevation is restrained. `rounded-lg` (90)
> is the only meaningful radius drift. **Do not "fix" problems that aren't there.**

### The signature gesture
`.star-rule` — a Ghana tricolour hairline led by a gold ★, exposed as `<StarRule />`. This is the
one memorable brand device and it is `aria-hidden`, which is correct. **Keep and lean on it.**

---

## 7. Component Inventory

**70 component files, ~10,586 lines** in `src/components/`, plus route-local components.

### There is no UI primitive layer — this is the single biggest structural finding
There is **no `Button`, `Input`, `Label`, `Field`, `Card`, `Modal`, `Dialog`, `Table`, `Badge`,
`Select`, `Skeleton`, or `EmptyState` component.** Consequences, measured:

- **381 `<button>` elements across 77 files**, each carrying its own class string
- **21 files independently declare a local `const inputCls`** — in two divergent dialects:
  - *Public/auth dialect*: `px-4 py-3 rounded-xl border-gray-200 dark:border-slate-700 … bg-white dark:bg-slate-800`
  - *Dashboard/POS dialect*: `px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 … focus:border-brand-500`
  - and **three different focus treatments** for the same input: `focus:border-gray-400`,
    `focus:border-brand-400`, `focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400`
- **13 hand-rolled `fixed inset-0` overlays/modals**, no shared dialog component

### What *does* exist and is worth reusing
| Component | Note |
|---|---|
| `common/StarRule.jsx` | Brand signature ✅ |
| `common/UploadButton.jsx` | Cloudinary upload, tested ✅ |
| `common/PageLoadingFallback.jsx` | Loading fallback — underused |
| `common/JsonLd.jsx` | SEO structured data ✅ |
| `reports/{Card,KpiCard,DataTable,State,DonutChart,RevenueChart,DateRangeFilter,StaffPicker}` | **A real mini design system — but scoped to POS reports only.** Best existing model to generalise from |
| `dashboard/dashboardNav.js` | Centralised, role-gated nav ✅ tested |
| `ThemeToggle`, `NotificationBell`, `CartDrawer` | Shared, working |

### Largest components (redesign risk — high logic density)
`ChatWidget` 726 · `PortfolioDetail` 641 · `shop/ProductDetail` 518 · `commerce/ProductForm` 480 ·
`ProductReviews` 357 · `BookConsultation` 350 · `PosOverview` 308 · `Navbar` 305

---

## 8. Current Branding

**The brand direction already matches most of what the brief asks for.** It is minimalist,
professional, warm, and distinctly Ghanaian rather than generic-SaaS.

- **Logo**: `/logo.png` (`h-9`), plus the `★ EazWorld` wordmark convention
- **Accent**: kente gold `#F2A311`
- **Surfaces**: warm `paper` / `ink` — deliberately *not* cool gray/slate, a real point of view
- **Type voice**: Space Grotesk (confident/technical) + DM Sans (body) + Space Mono (data)
- **Signature**: the star rule
- **Tone**: "Accra-Based Team", "GHS Pricing", "Honest Advice", "Fast Delivery" — trust-first, local

The homepage in particular is well-composed: mono eyebrows, star rules, restrained cards, full dark
variants. **This is not a template-looking site.** The redesign should be an *amplification and
systematisation* of this direction — not a reinvention.

**What's missing from the branding**, and where the "premium / distinctive" gap actually is:
1. No mid-tier type — the page has small text and big headings, nothing between (see §9)
2. The gold is used at contrast levels where it is illegible, so the brand color reads as decoration rather than as hierarchy
3. Dashboards/POS drifted onto a **cool gray** ramp, so the warm identity stops at the login boundary

---

## 9. UX Problems

### 9.1 Typography is flat — 78% of all type is 12–14px  **[P1]**
Measured distribution of type utilities:

| Utility | Count | |
|---|---|---|
| `text-xs` (12px) | **1027** | |
| `text-sm` (14px) | **995** | |
| `text-base` (16px) | **24** | ← **0.9%** |
| `text-lg`–`text-7xl` | 394 | |
| Arbitrary `text-[9/10/11px]` | **173** | off-scale |

`text-xs` + `text-sm` = **2022 of 2590 (78%)**. There is effectively **no 16px body tier**, and 173
arbitrary values bypass the scale entirely. The result is weak hierarchy: everything is small and
similarly weighted, then jumps to a display heading. This is the biggest *perceived* quality gap and
the reason the UI reads as dense rather than premium.

### 9.2 Every dashboard page's `<h1>` says "Dashboard"  **[P1]**
`DashboardShell` takes a `title` prop defaulting to `"Dashboard"`, and renders it as the desktop
topbar `<h1>`. **`AppShellDecision` never passes one.** Only `commerce/layout.jsx` does
(`title="Marketplace"`). So Overview, Shop Orders, My Repairs, Hosting, Domains, Notifications,
Settings and all 10 admin pages present a generic "Dashboard" heading. Pages that render their own
`<h1>` then produce **two `<h1>`s on desktop**.

### 9.3 Five different offsets for one fixed navbar  **[P2]**
The navbar is `fixed`, `h-16` (64px), and `<main>` has no compensating padding, so every page
supplies its own: `pt-28` ×32, `pt-24` ×8, `pt-32` ×5, `pt-16` ×4, `pt-20` ×1. Header-to-content
distance visibly changes as you navigate.

### 9.4 Content width doesn't align across pages  **[P2]**
Navbar is `max-w-6xl`. Page containers are `max-w-5xl` (11), `max-w-6xl` (7), `max-w-3xl` (10),
`max-w-4xl`, `max-w-2xl`… Content edges don't line up with the logo/nav between routes.

### 9.5 Inconsistent loading strategy  **[P2]**
`animate-spin` in **53 files** vs `animate-pulse` skeletons in **25**. The same kind of content
(a list, a card grid) loads as a spinner in one place and a skeleton in another. Plus the missing
route-level `loading.jsx` files (§4).

### 9.6 `app/error.jsx` is off-brand  **[P2]**
The global error boundary is written **entirely in inline styles** — violating the style guide's own
"no inline `style={{}}`" rule. It uses a cool `#f9fafb` background (not warm `paper`), system
`sans-serif` (not Space Grotesk/DM Sans), and **has no dark mode**. It is the one screen users see
when something breaks, and it looks like it belongs to a different product.

### 9.7 Two icon libraries  **[P2]**
`lucide-react` in **103 files**, `react-icons/fa` in **21**. Both are loaded on the homepage. Stroke
weight and optical size differ between them, which is visible when they sit side by side.

### 9.8 Placeholder-only forms  **[P1 — also a11y, see §11]**
`ContactForm` and peers use placeholders as labels. The label vanishes the moment the user types,
which is a known usability failure for anyone reviewing a filled form.

### 9.9 Two neutral ramps  **[P2]**
`dark:*-slate-*` **2178** vs `dark:*-gray-*` **730**. The style guide specifies slate for dark
surfaces; `DashboardShell` uses `dark:bg-gray-950` / `dark:bg-gray-900` / `dark:border-gray-800`, and
the whole dashboard/POS area followed it. The warm `ink` background is also dropped there.

---

## 10. Responsive Problems

- **No large-desktop tier**  **[P2]** — `xl:` appears **5 times**, `2xl:` **zero times**. Above
  1280px every layout just centers at `max-w-6xl` (1152px) inside growing empty margins. The brief
  explicitly asks about 1440px and large desktop; today those are identical to 1280px.
- **Breakpoint usage**: `sm:` 126, `md:` 111, `lg:` 102 — healthy through tablet/laptop.
- **Tables**: 15 `<table>` in 14 files, 19 `overflow-x-auto` wrappers — mostly covered, needs a
  per-table check rather than a blanket claim.
- **Dashboard shell** is `h-screen overflow-hidden` with an internal scroll region — correct for an
  app shell, but means any page that forgets its own padding sits flush against the chrome
  (`commerce/page.jsx:623` documents this trap, and a test guards it).
- **Small touch targets** — 7 icon buttons at `p-1`/`p-1.5` (~28px), under the 44px guideline.
- Type at `text-[9px]`/`text-[10px]` (50 instances) is below comfortable mobile legibility.

---

## 11. Accessibility Problems

### 11.1 Light-mode contrast fails WCAG AA systemically  **[P0]**
Computed contrast ratios (WCAG 2.1 formula) against the app's real surfaces:

| Foreground | on `white` card | on `paper` page | Verdict |
|---|---|---|---|
| `text-gray-400` | **2.54:1** | **2.36:1** | ❌ FAIL |
| `text-brand-500` | **2.10:1** | **1.95:1** | ❌ FAIL (fails even large-text 3:1) |
| `text-brand-600` | **2.72:1** | **2.53:1** | ❌ FAIL |
| `text-brand-700` | 4.14:1 | 3.84:1 | ⚠️ large text only |
| `text-gray-500` | 4.83:1 | 4.49:1 | ⚠️ marginal on paper |
| `text-gray-600` | 7.56:1 | 7.02:1 | ✅ PASS |

Usage of the failing colors: **`text-gray-400` — 526 occurrences / 95 files**;
**`text-brand-600` — 210 / 69** (this is the *documented eyebrow color*, rendered at 11px bold);
**`text-brand-500` — 149 / 63** (includes the **active nav link state**).

**Dark mode is fine** — `slate-400` 6.96–7.28:1, `brand-400` 10.1–10.6:1, `brand-500` 8.5–8.9:1 all pass.
The problem is specific to the light theme.

### 11.2 White-on-gold buttons  **[P0]**
`bg-gray-900 dark:bg-brand-500 text-white` — in dark mode this is white on `#F2A311` = **2.10:1**.
Confirmed in 6 places: `Navbar.jsx:187`, `Navbar.jsx:296`, `home/CtaSection.jsx:26`,
`business-settings/page.jsx:127,187,273`. The codebase's own convention elsewhere is
`dark:text-gray-900` (**8.47:1** ✅) — so these are drift, not a design decision.

### 11.3 Zero `prefers-reduced-motion` support  **[P0]**
**0 occurrences** of `prefers-reduced-motion`, `motion-reduce:`, or `useReducedMotion` anywhere —
despite a framer-motion hero carousel, 113 spinners, 41 pulse skeletons, and transitions throughout.

### 11.4 Form labels are not associated  **[P1]**
211 `<input>`, 42 `<select>`, 24 `<textarea>` — but only **4 `htmlFor`** attributes in the entire
codebase, and forms like `ContactForm` have **no `<label>` at all** (placeholder-only). Validation
errors render as plain `<p className="text-red-500">` with **no `role="alert"`, no `aria-invalid`,
no `aria-describedby`** — a screen reader user gets no announcement that submission failed.

### 11.5 Interactive widgets expose no state  **[P1]**
**`aria-expanded`: 0. `aria-haspopup`: 0. `aria-live`: 0. `role="alert"`: 0.**
The Navbar services dropdown, the mobile menu, and every accordion are `<button>`s that toggle
`useState` with nothing exposed to assistive tech.

### 11.6 Dialogs are not dialogs  **[P1]**
13 `fixed inset-0` overlays; only **2 `role="dialog"`** and **3 `aria-modal`**. **Escape is handled
in 3 files** (`pos/sell`, `activity-logs`, `PortfolioDetail`). **Body scroll lock exists in exactly
one place** (`CartDrawer`). **No focus trap anywhere** — keyboard focus escapes behind open modals.

### 11.7 What's already right — preserve it
- The global `:focus-visible` ring in `globals.css` is correct, keyboard-only, and `!important` so
  it beats the ~200 `focus:outline-none` utilities. **Do not remove this.**
- `<StarRule />` is `aria-hidden` ✅
- Icon-only buttons in `Navbar` / `DashboardShell` carry `aria-label` ✅ (53 across the app)
- Heading levels are broadly sane: 94 `<h1>`, 135 `<h2>`, 52 `<h3>`. The 5 pages with multiple
  `<h1>` are **role-branched components where only one renders** — *not* a defect. The real
  duplicate-`<h1>` case is the shell/page pair in §9.2.

---

## 12. Performance Concerns

Baseline from `next build`: **shared JS 87.5 kB**, per-route first load 87.9–160 kB, middleware
33.1 kB. This is healthy — there is no performance crisis.

Real opportunities:
1. **`ChatWidget` (726 lines, the largest component) is statically imported** into
   `ConditionalLayout`, so it ships in the client bundle of **every public page** even though it
   renders as a collapsed bubble most users never open. `CartDrawer` is mounted globally too.
2. **`next/dynamic` is used in exactly 1 file** (`QueryProvider`, for devtools). Almost no route-level
   code splitting beyond what the App Router does automatically.
3. **Two icon libraries** — dropping `react-icons` (21 files, all `/fa`) removes a dependency.
4. `framer-motion` is a substantial dependency used by **5 files**; worth confirming it earns its place.
5. `next.config.mjs` allows **any HTTPS image host** (`hostname: "**"`). Deliberate and documented
   (supplier images), but it means no host-level control over image weight.
6. The heaviest routes are `/portfolio/[slug]` (158 kB), `/shop/[slug]` (150 kB), `/repair` (141 kB).

---

## 13. Technical Constraints

**Hard constraints the redesign must respect:**

1. **JavaScript, not TypeScript.** No `.ts`/`.tsx`.
2. **Tailwind utilities only.** No styled-components, no `props.theme.*`, no `var(--…)` design
   tokens, no CSS modules, no inline `style={{}}` except genuinely dynamic values.
3. **Money is integer pesewas.** Render with `formatGhs()` from `lib/shop.js`; divide by 100 only at
   the display edge. **Exception: the POS subsystem stores whole cedis** and uses `.toFixed(2)`
   directly — do not divide those by 100.
4. **Response envelope** `{ success, data }` — `lib/api.js` depends on its exact shape, including
   forwarding non-standard error fields (`requiresVerification`, `errors[]`).
5. **CSP is strict** (`next.config.mjs`). Any new font/script/image host must be added there. Google
   Fonts is already allowed; arbitrary CDNs are not.
6. **Dark mode is mandatory on public/customer pages** (`darkMode: "class"`, cookie-driven, no flash).
7. **512 MB backend heap** — don't add chatty client patterns that multiply requests.
8. **No UI kit is installed.** Adding shadcn/Radix would be a significant architectural change and
   must be proposed before, not during, implementation.
9. **301 tests assert real DOM** — several assert layout/structure (e.g. "POS orders render as a
   table, not cards"; "the marketplace pads its own content"). Markup changes can legitimately break
   them; they are the safety net, so they must be read before editing those surfaces.
10. **Uncommitted work in progress** in both repos (§1) must be preserved.

---

## 14. Areas That Should NOT Be Changed

**Do not touch — business-critical, working:**

| Area | Why |
|---|---|
| `src/middleware.js` | Maintenance gate, JWT verify, role routing, all auth guards |
| `context/AuthContext.jsx`, `lib/roles.js` | Session + role landing logic |
| `lib/api.js` | Error-field forwarding is depended on by forms |
| `hooks/queries/*` (24 hooks), `lib/queryKeys.js`, `lib/queryClient.js` | React Query cache + invalidation contract |
| `useCardCharge`, `useMomoCharge`, `ServicePaymentModal`, `CheckoutForm`, `/checkout`, `/hosting/checkout`, `/domains/checkout` | **Paystack money movement** |
| `lib/shop.js#formatGhs`, all pesewa arithmetic | Money correctness |
| `lib/printReceipt.js`, `pos/Receipt.jsx` | Thermal receipt output; **intentionally light-only** |
| `lib/seo.js`, `JsonLd`, `sitemap.xml`, `robots.txt`, `opengraph-image`, per-route `metadata` | Live SEO |
| `next.config.mjs` CSP/rewrites/redirects | Security + API path |
| Theme-init script in `app/layout.jsx` | Prevents theme flash |
| `dashboardNav.js` role gating | Authorization surface |
| `:focus-visible` rule in `globals.css` | The one thing holding a11y together |
| Backend, database, API contracts | Out of scope entirely |

**Change carefully, with tests read first:** `ProductDetail`, `ProductForm`, `PosOverview`,
`commerce/page.jsx`, `pos/orders`, `dashboard/orders` — all have tests asserting structure.

---

## 15. Recommended Improvements

Ordered by leverage, not by page.

### A. Extend the token layer (don't replace it)
Keep `brand`, `paper`, `ink`, `star` and the three fonts. **Add** what's missing:
- **Semantic status tokens** — `success` / `warning` / `error` / `info`, each with a
  **light-mode-safe text shade** (≥4.5:1 on `paper` and `white`) and a dark shade.
- **An accessible accent-text token.** `brand-500/600` must stop being used as text on light
  surfaces. Introduce e.g. `brand-ink` (a darkened gold ≈ `#8F5606`/`brand-800`, ~5.5:1 on paper)
  for eyebrows and active states, while `brand-500` stays the *fill* color. This keeps the gold
  identity and fixes 350+ failing instances.
- **Pick one neutral ramp** — settle slate vs gray and bring the dashboard back onto `ink`.
- **Radius + spacing scale**, documented: `full` pills, `2xl` cards, `xl` inputs, `lg` retired.

### B. Build the missing primitive layer — highest leverage of all
`components/ui/`: `Button`, `Input`, `Label`, `Field` (label + control + error + `aria-*` wired),
`Select`, `Textarea`, `Card`, `Modal`/`Dialog` (focus trap + Escape + scroll lock + `role`/`aria-modal`),
`Table`, `Badge`, `Skeleton`, `EmptyState`, `PageHeader`.

Generalise from `components/reports/*`, which already proves the pattern in this codebase. This one
change collapses 381 ad-hoc buttons, 21 `inputCls` copies and 13 hand-rolled modals into one
enforceable system — and fixes most of §11 structurally rather than instance by instance.

### C. Fix the type scale
Establish `display / h1 / h2 / h3 / body / small / caption` with a **real 16px body tier**, retire the
173 arbitrary `text-[Npx]` values, and lift the ~1000 `text-xs` body instances to 14–16px where they
are prose rather than metadata.

### D. Accessibility remediation
Contrast token swap (A) · `prefers-reduced-motion` (global CSS + `useReducedMotion` in the 5
framer-motion files) · `Field` primitive fixes labels/`aria-invalid`/`role="alert"` · `aria-expanded`
+ `aria-haspopup` on the 3 disclosure widgets · `Modal` primitive fixes all 13 overlays · `aria-live`
for cart/payment/async status · 44px minimum touch targets.

### E. Layout system
One `PageHeader` (fixes the "Dashboard" `<h1>` bug and gives every route a real title) · one page
container with a single navbar offset and a consistent `max-w` aligned to the navbar · an `xl:`/`2xl:`
tier so large desktops gain content, not margin.

### F. Route-level states
Add `loading.jsx` (skeletons, not spinners) and `error.jsx` per major segment — `/shop`, `/dashboard`,
`/dashboard/pos`, `/dashboard/commerce`, `/blog`, `/portfolio`. Rewrite the global `app/error.jsx` in
Tailwind, on-brand, with dark mode.

### G. Consolidation & performance
Migrate 21 `react-icons/fa` usages to `lucide-react` and drop the dependency · dynamic-import
`ChatWidget` · re-evaluate `framer-motion` for 5 files.

### H. Motion — deliberately small
This app should not gain much animation. Purposeful only: focus/hover/press feedback on the new
`Button`, dropdown and modal enter/exit, skeleton→content transitions, cart-count change, toast/status
announcements. All gated behind `prefers-reduced-motion`.

---

## 16. Priority Levels

### P0 — Critical (accessibility failures; ship first)
| # | Item | Evidence |
|---|---|---|
| P0-1 | Light-mode contrast: retire `text-gray-400` (526), `text-brand-500`-as-text (149), `text-brand-600` (210) | §11.1 — 1.95–2.72:1 |
| P0-2 | White-on-gold buttons → `dark:text-gray-900` | §11.2 — 6 sites, 2.10:1 |
| P0-3 | `prefers-reduced-motion` support | §11.3 — 0 occurrences |

### P1 — High (structural; everything else depends on these)
| # | Item |
|---|---|
| P1-1 | Build `components/ui/` primitives — `Button`, `Field`/`Input`/`Label`, `Modal`, `Card`, `Table`, `Badge`, `Skeleton`, `EmptyState` |
| P1-2 | Semantic + accessible-accent token layer in `tailwind.config.js` |
| P1-3 | Type scale with a real 16px body tier; retire 173 arbitrary sizes |
| P1-4 | Form a11y — labels, `htmlFor`, `aria-invalid`, `aria-describedby`, `role="alert"` |
| P1-5 | Modal a11y — focus trap, Escape, scroll lock, `role="dialog"`/`aria-modal` (13 overlays) |
| P1-6 | `PageHeader` + fix the "Dashboard"-on-every-page `<h1>` |
| P1-7 | `aria-expanded`/`aria-haspopup` on disclosure widgets |

### P2 — Medium (consistency & polish)
| # | Item |
|---|---|
| P2-1 | Single navbar offset + aligned page container `max-w` |
| P2-2 | One neutral ramp; restore warm `ink` in dashboard/POS |
| P2-3 | Route-level `loading.jsx` / `error.jsx`; skeletons over spinners |
| P2-4 | Rewrite `app/error.jsx` on-brand with dark mode |
| P2-5 | Consolidate to `lucide-react`, drop `react-icons` |
| P2-6 | `xl:`/`2xl:` large-desktop tier |
| P2-7 | Retire `rounded-lg` (90) into the documented scale |
| P2-8 | 44px touch targets |
| P2-9 | Purposeful motion pass on the new primitives |

### P3 — Low (opportunistic)
| # | Item |
|---|---|
| P3-1 | Dynamic-import `ChatWidget`; re-evaluate `framer-motion` |
| P3-2 | `aria-live` regions for async status |
| P3-3 | Update `STYLE_GUIDE.md` to document the new primitives + tokens |
| P3-4 | Optional Playwright visual checks at the 9 required widths |

---

## Verified baseline (before any change)

```
vitest run    →  47 files, 301 tests, ALL PASSING   (32.8s)
next lint     →  ✔ No ESLint warnings or errors
next build    →  ✔ Success — shared JS 87.5 kB, middleware 33.1 kB
```

Any redesign work must leave all three green.
