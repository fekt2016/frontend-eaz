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

---

## P2 — Improvements

---

## Missing Features (new work — mirrors backend-eaz/tasks.md's "Missing Features" section)

- [ ] **T45 · Pre-order support for products** — storefront side of the pre-order feature; the
  model/order/payment design lives in `backend-eaz/tasks.md` → T45. Currently the shop blocks
  add-to-cart / checkout on zero stock, so items that are out of stock or not yet available in
  Ghana can't be ordered at all.
  - **What this needs here:** product card + detail page show a "Pre-order" badge and
    expected-availability copy (from the backend `preorder.availableFrom`/`note` fields)
    instead of "Out of stock"; the add-to-cart button becomes "Pre-order" for those items;
    the cart/checkout surfaces that a line item is a pre-order.
  - **Open questions (resolve with backend before building):** upfront payment vs. deposit
    changes the checkout copy/flow; how a pre-order line renders in order history / track-order.
  - **Backend:** `backend-eaz/tasks.md` → T45.

---

## Ad-hoc fixes (found during work, outside the original audit)

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

- [x] **T39 · Product detail page: add Description / Specs / Reviews tabs** — ✅ done 2026-08-24 (both halves)
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
  - **Shipped:**
    - `src/components/shop/ProductDetail.jsx` — **three** tabs, not the two the fix note
      described: Specs was split out of Description into its own tab (product decision
      during the work). The Specs tab is omitted entirely when a product has no specs, so
      a bare product shows Description | Reviews.
    - Tab bar sits full-width below the image/buy grid, not inside the buy column, so the
      review list gets the whole width instead of ~40%. Styling mirrors the only prior tab
      precedent in the app, `src/components/resources/ResourcesListing.jsx` (pill buttons)
      — no shared Tabs component existed to reuse.
    - Proper `role="tablist"` / `role="tab"` / `role="tabpanel"` wiring with
      `aria-selected`, `aria-controls`, and `aria-labelledby`, so the tabs are usable with
      a screen reader rather than being styled buttons.
    - Reviews label carries the count (`Reviews (12)`) via `useProductReviews` — the same
      query key `ProductReviews` already uses, so react-query serves both from one cache
      entry rather than firing a second request.
    - Switching tabs scrolls the panel into view (deferred to a `requestAnimationFrame` so
      it runs after paint); `activeTab` resets to Description when the slug changes.
    - **Short description (added mid-task):** the buy column would otherwise have been left
      with no prose at all once the description moved into a tab, so it now shows
      `product.shortDescription` under the SKU/stock row, above the price, with a "Read
      more" that jumps to the Description tab. Backed by a real schema field — see below.
    - `src/components/commerce/ProductForm.jsx` — admin "Short description" textarea with a
      live `n/200` counter, matching the backend `maxlength`.
    - `summarizeDescription()` (exported for test) — fallback for the ~30 existing products
      whose `shortDescription` is empty: prefers the opening sentence, else trims on a word
      boundary with an ellipsis. "Read more" is hidden when the summary is the whole text.
    - `ProductDetail.test.jsx` (new, 16 tests) covering tab switching, the count label, the
      omitted-Specs case, a11y wiring, the short description, and the fallback helper.
  - **Backend:** the "none needed" note above was wrong once `shortDescription` became a
    real field — see `backend-eaz/tasks.md` → T39 for the schema/controller half.
  - **Verified:** full frontend suite 36 files / 179 tests pass (up from 36/171);
    `npm run lint` clean; `next build` succeeds. Not verified in a live browser.

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

- [ ] **T35 · Variant form: add a price input for each variant**
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

- [ ] **T34 · Product form: main images should be uploadable locally, not just URL**
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

- [ ] **T32 · Reports page: staff see only their own report; admin sees all staff + per-staff activity**
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