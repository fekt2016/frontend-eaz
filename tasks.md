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

- [ ] **T50 · `resetPassword` / `verifyPin` don't check `isBlocked`**
  - **Issue:** Backend — a blocked user with a valid reset link or verification PIN can obtain
    a fresh token because `resetPassword`/`verifyPin` don't gate on `isBlocked` (unlike
    `login`). Impact limited (protect rejects on next request).
  - **Location:** backend — `controllers/authController.js`.
  - **Fix:** Backend change only. No frontend work.

- [ ] **T49 · `verifyPin` / `twoFactorPin` stored and compared in plaintext**
  - **Issue:** Backend — 6-digit PINs stored unhashed on `User` and compared with plain `!==`.
  - **Location:** backend — `models/User.js`, `controllers/authController.js`.
  - **Fix:** Backend change only (hash or constant-time compare). No frontend work.

- [ ] **T48 · `api.js` drops the `requiresVerification` flag from error responses**
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

- [ ] **T47 · `updateProfile` missing phone-uniqueness pre-check**
  - **Issue:** Backend — setting an in-use phone via the profile settings form returns an
    unhandled 500 (duplicate-key) instead of a friendly 409.
  - **Location:** backend — `controllers/authController.js` (`updateProfile` ~line 497).
  - **Fix:** Backend change only. No frontend work (error already surfaces in the form).

- [ ] **T46 · `/api/v1/auth/verify` rate limit is dead code — PIN endpoints unthrottled**
  - **Issue:** Backend — the strict 10/15min limiter is mounted on `/api/v1/auth/verify`, which
    matches nothing; the real `/verify-pin`, `/resend-pin`, `/2fa/verify` routes only get the
    global 150/15min limit, so 6-digit PINs are brute-forceable.
  - **Location:** backend — `app.js` (~line 158), `routes/authRoutes.js`.
  - **Fix:** Backend change only (mount limits on the real paths). No frontend work.

- [ ] **T45 · `expenseController`: unescaped supplier regex + no activity logs**
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

- [ ] **T40 · `authController.logout` calls `jwt.decode` without importing `jsonwebtoken`**
  - **Issue:** Backend bug — `jwt.decode(token)` at `controllers/authController.js` ~line 283
    is a ReferenceError (`jsonwebtoken` never imported). Swallowed by try/catch, so logout
    succeeds but the logout activity entry never records who logged out.
  - **Location:** backend — `controllers/authController.js` (imports lines 1–6; logout
    ~lines 276–303).
  - **Fix:** Backend change only (add `require('jsonwebtoken')`). No frontend work.

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

- [ ] **T37 · Sell page: show item images in search results and cart/summary**
  - **Issue:** On `/dashboard/pos/sell`, searching for a product/part shows a text-only list
    (name, category, stock, price) and the cart rows are text-only too. The item's **image**
    should appear in the search results dropdown **and** in the cart/summary (right column)
    so cashiers can visually confirm they're scanning the right item.
  - **Location:** `src/app/dashboard/pos/sell/page.jsx` (search results ~lines 368–386,
    cart rows ~lines 408–441; `addToCart` cart item shape ~lines 111–121)
  - **Fix:** Store `image: part.images?.[0] || part.image || null` in each cart item; render a
    thumbnail (e.g. 40×40 rounded, `object-cover`, gray placeholder when no image) in the
    search results and cart rows. Add an image placeholder for items without photos.
  - **Note:** Part search already returns `images`; product search currently omits them —
    backend must add `images` to the product select (see `backend-eaz/tasks.md` → T37).
  - **Depends on T33 (part image input) for parts to actually have photos.**

- [ ] **T36 · Suppliers: add WhatsApp and WeChat contact fields**
  - **Issue:** Suppliers will be sourced from China (WeChat/1688/AliExpress vendors + freight
    forwarders) — messaging happens via **WhatsApp** and **WeChat**, not just phone/email.
    Add dedicated contact fields so staff can open a chat directly (e.g. `wa.me` links,
    WeChat ID display/copy).
  - **Location:** `src/app/dashboard/pos/suppliers/page.jsx` (add + inline-edit forms,
    rows), `src/app/dashboard/pos/suppliers/[id]/page.jsx` (contact card)
  - **Fix:** Add `whatsapp` (phone number → link `https://wa.me/<digits>`) and `wechat`
    (WeChat ID → display with copy button) fields to the supplier add/edit forms, list rows,
    and the detail contact card. Keep phone separate from WhatsApp (a China number could be
    both).
  - **Backend part:** `backend-eaz/tasks.md` → T36.

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

- [ ] **T33 · Inventory part form has no image input**
  - **Issue:** The inventory part add/edit form (PartModal) has no field to upload/attach an
    **image** for a repair part. Parts should support a photo (shown in inventory, sell search,
    job parts, receipts) like shop products already do (`product.images`).
  - **Location:** `src/app/dashboard/commerce/inventory/page.jsx` (`PartModal` payload,
    ~lines 20–80), part list rendering
  - **Fix:** Add an image upload input to the part form (single image via the existing
    Cloudinary upload endpoint — see `backend-eaz/tasks.md` → T33), store it on the `Part`
    model, display it in inventory rows/search results.
  - **Backend part:** `backend-eaz/tasks.md` → T33.

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

- [ ] **T29 · Role-based landing pages after login**
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

- [ ] **T28 · Admin orders page: link to detail page; move all edit/update there**
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

- [ ] **T27 · Add a product review form to the customer order detail page**
  - **Issue:** The customer order detail page (`/dashboard/orders/[id]`) shows the order items
    but has **no way to review** the products that were ordered. Customers should be able to
    submit a rating + comment per product from this page.
  - **Location:** `src/app/dashboard/orders/[id]/page.jsx` (Items section)
  - **Fix:** Add a review form per order item (rating + comment), posting to the existing
    `POST /api/v1/products/:productId/reviews` (authenticated; one review per user per product).
    Pre-fill/disable if the user already reviewed (via `GET …/reviews/mine`); show the review
    confirmation/inline state. Only show for delivered/fulfilled items.
  - **Backend part:** endpoints already exist (`productRoutes.js`); see `backend-eaz/tasks.md` → T27.

- [ ] **T26 · Domain page should show the list of registered domains**
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

- [ ] **T25 · Hosting page should only show hosting-account related content**
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

- [ ] **T24 · Merge "Marketplace" and "Inventory" into one page**
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

- [ ] **T23 · Remove "New Job" button from the Overview dashboard**
  - **Issue:** The Overview page (`/dashboard`) has a **New Job** button (top-right, both in
    `MyDashboard` and `FullDashboard`). It should not be there — creating a repair job belongs
    in the POS/Jobs area, not on the overview.
  - **Location:** `src/app/dashboard/page.jsx` (lines ~216 and ~278: `href="/dashboard/pos/jobs/new"`),
    plus the "Create first job →" empty-state link (~line 150)
  - **Fix:** Remove the Overview "New Job" buttons and the empty-state create link; the action
    stays available from the POS Jobs page. Confirm no other dashboard widget duplicates it.
  - **Backend note:** none required (frontend-only); see `backend-eaz/tasks.md` → T23.

- [ ] **T22 · Integrate "My Repairs" and "My Jobs" into one page**
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