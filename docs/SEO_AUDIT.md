# EazWorld — Full-Stack SEO Audit (23 Phases)

**Scope:** `frontend-eaz` (Next.js 14 App Router, JS) + `backend-eaz` (Express, CommonJS). Audit-only — **no code changes made.** Verified via source inspection, `next lint` (clean), and `next build` (passes). Items marked **[EXTERNAL]** require a browser/Lighthouse/GSC/GBP check and were not measured from source.

---

## Phase 1 — Project Understanding

- Next.js 14.2.35 App Router, static generation + dynamic server-rendering; middleware.js gates maintenance mode and dashboard; deployed on AWS Amplify (backend via `/api/v1` rewrites).
- Money in pesewas, `formatGhs()` single formatter; Paystack payments; MongoDB backend.
- Two git repos (`frontend-eaz`, `backend-eaz`), both clean on `main`.

## Phase 2 — Page Inventory (build-verified)

Public/indexable: `/`, `/about`, `/services`, `/services/[slug]` + static pricing pages (`web-design`, `seo`, `paid-ads`, `branding`, `social-media`, `email`, `phone-repair`), `/hosting`, `/domains`, `/shop`, `/shop/[slug]`, `/shop/category/[category]`, `/portfolio`, `/portfolio/[slug]`, `/blog`, `/blog/[slug]`, `/reviews`, `/resources`, `/visit-us`, `/book-consultation`, `/contact`, `/seo` (JS redirect), `/repair`, `/privacy`, `/terms`, `/maintenance`.
Noindexed: auth/*, cart, checkout, dashboard/*, domains/checkout, hosting/checkout + order-confirmation + bank-transfer, order-confirmation/[ref], payment-success, track-order, track/[token], track/order/[trackingNumber].

## Phase 3 — Technical SEO

| Check | Status | Detail |
|---|---|---|
| robots.txt | ✅ | `/api`, auth, dashboard, cart, checkout, payment areas disallowed; sitemap ref present |
| sitemap.xml | ⚠️ | Missing **`/repair`**, **dynamic `/services/[slug]`** (web-hosting, domain-registration, mobile-development, web-marketing), `/portfolio/[slug]`; **includes `/seo`** (a JS redirect page) and `/track-order` (noindexed). Blog posts fetched live from API. Hardcoded 6 shop categories. Product URL limit 3000 |
| HTTPS | ✅ | Amplify + HSTS (prod) |
| Canonicals | ⚠️ | `buildMetadata` sets them; **static pricing pages (`seo`,`branding`,`paid-ads`,`social-media`,`email`) have NO canonical → inherit homepage canonical `SITE_URL`** (root layout `alternates.canonical = SITE_URL`). Also `portfolio/[slug]/layout.jsx` references `project.image` (field is `heroImage`/`thumbnail`) |
| Redirects | ❌ | `/seo` is a **client-side JS redirect** to `/services/seo` — no 301, JS-only, indexed + in sitemap |
| 404/not-found | ✅ | Custom not-found, noindex |
| Error boundaries | ❌ | No `error.jsx` anywhere → default Next error page on runtime errors |

## Phase 4 — On-Page SEO (Titles/Descriptions/H1)

- Titles: descriptive, keyword-rich, brand-suffixed via template. Homepage = custom raw metadata object (no buildMetadata).
- Static pricing pages + reviews + hosting pages are **client components** with metadata in layouts; `services/phone-repair` + `web-design` have their own layouts.
- ⚠️ Blog list and product list content is **client-fetched** (empty SSR HTML → weaker crawl/JS-render reliance).

## Phase 5 — Keyword & Content Strategy

- Blog has **6 static posts in `src/content/blog/posts.js` — DEAD CODE, not imported anywhere.** BlogListing fetches `/api/v1/posts` (DB). If DB has no posts, blog renders "No articles found" with no SSR content.
- Categories cover SEO/Web Design/Case Study/Social Media/Branding/Phone Repair — good topical coverage if populated.
- No H2 heading audit done live; structure looks correct in components.

## Phase 6 — URL Structure

- Clean, lowercase, hyphenated slugs; no query-string cruft on public pages. `[slug]` routes well-formed. Service URL duplication: `/seo` redirect vs `/services/seo`.

## Phase 7 — Internal Linking

- Navbar + Footer cover main sections; footer links to services, resources, legal, "Our Network".
- ❌ **Footer social links (Facebook/Twitter/Instagram/LinkedIn) are dead `href="#"`** — broken-outbound-signal.
- Footer links to external network sites (saiisai.com, worldstargh.com, jmlogisticsgh.com, giwainvestment.com) — external links, keep `rel` review.

## Phase 8 — Structured Data (Schema.org)

| Type | Status | Notes |
|---|---|---|
| Organization | ✅ | Root layout, minimal (name, url) — **missing logo, sameAs, address, phone** |
| Product + Offer (GHS, InStock/OutOfStock) | ✅ | Shop product pages via productJsonLd |
| BreadcrumbList | ✅ | Category + product pages |
| Service | ❌ | **Missing** — services/hosting/domains pages have none |
| LocalBusiness | ❌ | **Missing** — high-value for Accra local SEO |
| FAQPage | ❌ | Missing |
| Article | ❌ | Blog posts have none |
| JSON-LD escaping | ✅ | `JsonLd.jsx` escapes safely |

## Phase 9 — Local SEO (Ghana)

- **NAP verified consistent:** Phone `+233 24 438 8190` (tel/wa.me: 233244388190) and address `E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra` in ChatWidget, BookConsultation, PhoneRepair, repair page, visit-us.
- ⚠️ No `geo`, opening hours, or service-area schema; **[EXTERNAL]** verify Google Business Profile exists, categories, reviews, and NAP match.
- Ghana-flavored content: GHS pricing, Accra locations, local keywords ("web design Accra") — good.

## Phase 10 — Images & Media

- Next/Image used broadly; product placeholder local SVG (on-brand); portfolio images are **SVG placeholders + picsum.photos** (external random images) — not real screenshots → weak E-E-A-T/portfolio value.
- Root OG image + blog OG image exist (edge runtime, 1200×630). Root OG hardcodes `#f5a623` accent (not brand token) — cosmetic.
- favicon.ico + apple-touch-icon present. No `icon-192`/`manifest.json` PWA icons.

## Phase 11 — Mobile-Friendliness

- Tailwind responsive classes, mobile-first design, hamburger nav; viewport default. **[EXTERNAL]** needs real-device CWV check. No obvious mobile meta issues.

## Phase 12 — Performance (code-level)

- **Heavy client-rendering:** `/shop`, `/shop/[slug]`, `/shop/category`, `/blog`, `/blog/[slug]`, homepage sections (RecentProducts, BlogPreview, Testimonials), hosting, reviews all fetch content client-side → higher JS, weak SSR HTML, slower LCP.
- First-load JS shared 87.5 kB + per-page 88–160 kB. Product pages ~147 kB; blog ~100 kB. Acceptable but improvable via server components + `generateStaticParams`.
- 404/error/static pages small. No error boundary files. `[EXTERNAL]` Lighthouse/PSI needed for scores.

## Phase 13 — Core Web Vitals
**[EXTERNAL]** — not measurable from source. Watch LCP (client-rendered content), CLS (hero carousel + skeletons), INP (client-side interactions + cart). Recommend Lighthouse + real-device field data.

## Phase 14 — Accessibility

- `:focus-visible` global gold ring (WCAG 2.4.7) — good.
- Buttons/links mostly have text; **portfolio "case study" cards and some icon-only CTAs need aria-labels**; modal/cart drawer needs focus trap check. **[EXTERNAL]** axe/pa11y run needed.

## Phase 15 — Security / HTTPS

- CSP (script-src self + unsafe-inline/unsafe-eval + Paystack), X-Frame-Options DENY, HSTS prod-only — good.
- Backend: helmet, xss-clean, mongo-sanitize, hpp, rate-limit, httpOnly JWT cookie — good. Secrets in `.env` not committed (grep clean).

## Phase 16 — Analytics & Tagging

- ❌ **No GA4/gtag/GTM/dataLayer anywhere in `src`** (grep verified). Privacy policy mentions analytics, but **no script installed**. No conversion events, no Paystack→GA4 funnel, no ecommerce tracking.
- **[EXTERNAL]** verify GSC verification exists; none of the meta-tag verification present in source.

## Phase 17 — Crawl Budget & Indexation

- robots clean for private areas; noindex on transactional pages — correct.
- ⚠️ Duplicate-ish service URLs (`/seo` redirect page indexed); sitemap omissions (Phase 3). `maintenance` page noindex? — **layout.jsx for /maintenance needs noindex confirmation** (robots doesn't block it). No `generateStaticParams` → dynamic pages are on-demand, fine for small catalog.

## Phase 18 — Broken Links & Redirects

- Footer socials `#` (Phase 7). No automated link checker run (would need external tool). JS redirect `/seo` is the main redirect smell.

## Phase 19 — Content Quality & E-E-A-T

- Static blog posts (6) are genuinely useful, Ghana-focused, no fluff — good content, **but dead code**. Portfolio content real (saiisai). Team page lists names (Kwame Asante, etc.) but no photos/bios/credentials → weak E-E-A-T.
- Claims inconsistency: homepage "50+ Projects Delivered" + "4.9 rating" vs portfolio "4 projects" + about "200+ clients"/"4.7" — **inconsistent trust signals**.

## Phase 20 — Trust Signals

- Reviews page fetches approved reviews from backend — good if populated. **[EXTERNAL]** check real review counts/GBP reviews. No badges/certifications; trust copy present (24hr response, 4.9).

## Phase 21 — Conversion / UX (SEO-adjacent)

- Clear CTAs (Free Quote, Book Consultation, WhatsApp), cart/checkout flows noindexed correctly. ChatWidget global. No conversion measurement (Phase 16). Page-speed + trust gaps could cap conversions.

## Phase 22 — International / hreflang

- No hreflang anywhere (single-market Ghana site — **correct to omit**). `og:locale en_GH` set. No multi-language requirement found.

## Phase 23 — Competitor & Market Gap

- Not measured externally. Ghana digital-agency keywords (web design Accra, SEO Ghana, phone repair Accra) mapped across site. **[EXTERNAL]** SERP analysis needed for intent gaps (hosting/domains pricing pages compete with GoDaddy/Namecheap-GH).

---

## Scorecard

| Category | Score | 
|---|---|
| Technical SEO (robots/sitemap/canonical) | 7/10 |
| On-Page (titles/descriptions/H1) | 8/10 |
| Local SEO (NAP/GBP) | 7/10 |
| Structured Data | 5/10 |
| Content & E-E-A-T | 5/10 |
| Performance | 5/10 |
| Analytics & Measurement | 2/10 |
| Internal Linking / Trust | 6/10 |
| Accessibility & Security | 8/10 |
| **Overall Readiness** | **6/10** |

---

## Roadmap (P0 → P3)

### P0 — Critical (fix first)
1. **Dead-code blog posts** — wire `src/content/blog/posts.js` into `BlogListing`/seed DB, or remove. Empty blog = zero content value. *(frontend)*
2. **`/seo` JS redirect → server-side 301** to `/services/seo` (remove from sitemap, robots disallow or `next.config` redirect). *(frontend)*
3. **Sitemap completeness** — add `/repair`, dynamic service slugs, `/portfolio/[slug]`; drop `/seo` + `/track-order`. *(frontend)*
4. **Analytics** — install GA4/GTM (footer or `next/script`), tag Paystack success events (order-confirmation, payment-success) as conversions. *(frontend)*

### P1 — High
5. **LocalBusiness + Service + FAQPage + Article JSON-LD**; extend Organization schema (logo, address, phone, sameAs, geo, openingHours). *(frontend, lib/seo.js)*
6. **Canonicals on static pricing pages** (`seo`,`branding`,`paid-ads`,`social-media`,`email`) — each needs `alternates.canonical` (currently inherit homepage). *(frontend)*
7. **Fix footer social `#` links** → real profiles or remove. *(frontend)*
8. **SSR/prerender product + blog content** via `generateStaticParams` + server components (reduce client-fetch LCP risk). *(frontend)*
9. **Fix portfolio `[slug]/layout.jsx` `project.image`** (use `heroImage`/`thumbnail`) + replace picsum/SVG placeholders with real case-study images. *(frontend)*

### P2 — Medium
10. **Real portfolio screenshots** + team photos/bios (E-E-A-T). *(content)*
11. **Reconcile stat claims** across homepage/portfolio/about. *(content)*
12. Add `error.jsx` boundaries; confirm `/maintenance` noindex. *(frontend)*
13. Product-level `AggregateRating`/Review schema for shop items (when real reviews exist). *(frontend)*
14. Add `icon-192`/manifest for PWA icons. *(frontend)*

### P3 — Low / Polish
15. OG-image color tokens from brand scale (not hardcoded `#f5a623`). *(frontend)*
16. Add `sitemap` `lastmod` for static pages from git/build time. *(frontend)*
17. Automated link checker + Lighthouse CI. *(devops)*

---

## Files Needing Changes (P0–P1)

| File | Change |
|---|---|
| `frontend-eaz/src/content/blog/posts.js` | Wire into app or remove (dead code) |
| `frontend-eaz/src/components/blog/BlogListing.jsx` | Fallback to static posts if API empty |
| `frontend-eaz/src/app/seo/page.jsx` | Delete; add `next.config.mjs` redirect `/seo`→`/services/seo` |
| `frontend-eaz/src/app/sitemap.js` | Add `/repair`, service slugs, portfolio slugs; remove `/seo`,`/track-order` |
| `frontend-eaz/src/lib/seo.js` | Add LocalBusiness/Service/FAQ/Article builders; extend Organization |
| `frontend-eaz/src/app/services/{seo,branding,paid-ads,social-media,email}/page.jsx` | Add `alternates.canonical` |
| `frontend-eaz/src/components/Footer.jsx` | Real social URLs |
| `frontend-eaz/src/app/portfolio/[slug]/layout.jsx` | `project.image` → `heroImage` |
| `frontend-eaz/src/app/layout.jsx` | GA4/GTM scripts + conversion events |
| `frontend-eaz/src/components/shop/ProductDetail.jsx` | (verify client fetch → move to server) |
| `frontend-eaz/src/app/maintenance/layout.jsx` | Confirm/ add noindex |

## External Checks Needed (not verifiable from source)

1. Google Search Console: domain verified? errors? indexed pages vs sitemap?
2. Google Business Profile: exists, category, NAP match, reviews, photos, Q&A.
3. PageSpeed/Lighthouse mobile+desktop field data (CWV).
4. Live crawl: real index status of `/shop`, `/blog`, `/services/[slug]` (JS-rendered content).
5. Social profiles exist + footer link targets.
6. Backlink profile + domain authority.

## Recommended Next Step

Begin **P0 (4 items)** — dead-code blog wiring, `/seo` 301, sitemap completeness, GA4+conversion tracking. These deliver immediate indexation + measurement value with low risk. Then P1 schema + canonicals. **Awaiting your approval to implement.**