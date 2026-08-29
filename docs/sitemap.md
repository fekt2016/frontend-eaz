# EazWorld Site Map

A complete map of every page on the EazWorld website, grouped by section.

---

## Public Pages

### Home
- **/** — Homepage. Hero, featured services, shop highlights, and call-to-action.

### About
- **/about** — Who we are, team, mission, and company story.

### Contact
- **/contact** — Contact form, phone numbers, email, and location.

### Visit Us
- **/visit-us** — Physical shop location with map/directions.

### Book a Consultation
- **/book-consultation** — Schedule a meeting for web design, hosting, or strategy consultation.

### Services
- **/services** — All services overview page.
- **/services/web-design** — Web design and development service details.
- **/services/branding** — Branding and identity service details.
- **/services/seo** — Search engine optimization service details.
- **/services/email** — Business email setup service details.
- **/services/paid-ads** — Paid advertising (Google Ads, social ads) service details.
- **/services/social-media** — Social media management service details.
- **/services/phone-repair** — Phone and device repair service details.
- **/services/[slug]** — Any other service page by slug.

### Portfolio
- **/portfolio** — Showcase of past web design and branding projects.
- **/portfolio/[slug]** — Individual project case study.

### Blog
- **/blog** — All blog articles and guides.
- **/blog/[slug]** — Individual blog post.

### Reviews
- **/reviews** — Customer reviews and testimonials.

### Resources
- **/resources** — Guides, tools, and helpful resources.

### Legal
- **/privacy** — Privacy policy.
- **/terms** — Terms of service.

---

## Shop (E-Commerce)

### Browsing
- **/shop** — All products, with filters and categories.
- **/shop/[slug]** — Individual product page (details, variants, reviews, add to cart).
- **/shop/category/[slug]** — Products filtered by category.

### Cart & Checkout
- **/cart** — Shopping cart with item list and quantities.
- **/checkout** — Enter delivery address (city, neighborhood from zones), select delivery method (in-house free / courier standard / same-day / express), pay with Paystack.

### Order Tracking (Customer)
- **/track-order** — Enter a tracking number to look up an order.
- **/track/order/[trackingNumber]** — Order tracking detail page with status timeline, shipping details, and pre-order progress.
- **/order-confirmation/[reference]** — Order confirmation after payment (shows items, delivery method, shipping fee, tracking number).

### Payment
- **/payment-success** — Generic payment success landing page.

---

## Hosting

### Browsing & Purchase
- **/hosting** — Hosting plans and pricing.
- **/hosting/checkout** — Select a plan, enter domain/details, pay.
- **/hosting/bank-transfer/[orderId]** — Bank transfer instructions for a hosting order.
- **/hosting/order-confirmation** — Hosting order confirmation page.

---

## Domains

### Search & Purchase
- **/domains** — Search for available domain names and prices.
- **/domains/checkout** — Register a domain, enter registrant details, pay.

---

## Repair / Track

- **/repair** — Book a device repair or check repair status.
- **/track/[token]** — Track a repair job by its unique token.

---

## Authentication

- **/auth/login** — Log in to your account.
- **/auth/register** — Create a new account.
- **/auth/forgot-password** — Request a password reset email.
- **/auth/reset-password** — Set a new password (via email link).
- **/auth/verify** — Verify your email address.
- **/auth/verify-2fa** — Two-factor authentication verification.

---

## Dashboard (Logged-In Users)

The dashboard is the control panel for both customers and staff. Layout includes a sidebar navigation and top bar.

- **/dashboard** — Dashboard home (overview of recent orders, activity, quick links).

### My Orders (Customer)
- **/dashboard/orders** — List of the logged-in user's shop orders.
- **/dashboard/orders/[id]** — Single order detail (items, status, tracking, review form).

---

## Dashboard — Staff & Admin Sections

### Commerce (Online Shop Management)
- **/dashboard/commerce** — Commerce overview dashboard.
- **/dashboard/commerce/products** — Product list (all products in the shop).
- **/dashboard/commerce/products/new** — Add a new product.
- **/dashboard/commerce/products/[id]** — Edit an existing product.
- **/dashboard/commerce/orders/[id]** — Manage a specific shop order (update status, add tracking, refund).
- **/dashboard/commerce/inventory** — Inventory overview and stock levels.
- **/dashboard/commerce/preorders** — Pre-order management (attach items to shipments, release fulfilled pre-orders).
- **/dashboard/commerce/shipments** — Shipment tracking (supplier batches from China: ordered, in transit, customs, arrived).
- **/dashboard/commerce/delivery-zones** — Manage delivery zones (neighborhoods, base rates, speed multipliers).

### POS (In-Store Point of Sale)
- **/dashboard/pos** — POS home / quick-access panel.
- **/dashboard/pos/sell** — Ring up a sale (scan items, accept payment).
- **/dashboard/pos/jobs** — Repair job list (all active and completed jobs).
- **/dashboard/pos/jobs/new** — Create a new repair job.
- **/dashboard/pos/jobs/[id]** — View/edit a specific repair job.
- **/dashboard/pos/orders** — POS order history.
- **/dashboard/pos/expenses** — Track shop expenses.
- **/dashboard/pos/reports** — Sales and expense reports.
- **/dashboard/pos/suppliers** — Supplier list.
- **/dashboard/pos/suppliers/[id]** — Supplier detail and purchase history.
- **/dashboard/pos/warranty** — Warranty tracking for repaired devices.

### Repairs
- **/dashboard/repairs** — Repair jobs overview (all devices in for repair).

### Hosting Orders (Admin)
- **/dashboard/hosting** — Hosting orders overview.
- **/dashboard/hosting/[orderId]** — Specific hosting order details and provisioning status.
- **/dashboard/hosting/awaiting-provisioning** — Hosting orders waiting to be set up.
- **/dashboard/hosting/new-account** — Create a new hosting account manually.

### Domain Orders (Admin)
- **/dashboard/domains** — Domain registration orders overview.

### Notifications
- **/dashboard/notifications** — Staff/admin notifications feed.

### Chats
- **/dashboard/chats** — Customer support chat / messaging interface.

### Settings
- **/dashboard/settings** — Account and profile settings.

---

## Dashboard — Admin Only

These pages are restricted to admin users.

- **/dashboard/(admin)/users** — User management (all registered users).
- **/dashboard/(admin)/blog** — Blog post management (create, edit, delete articles).
- **/dashboard/(admin)/reviews** — Review moderation (approve, flag, or delete reviews).
- **/dashboard/(admin)/consultations** — Consultation booking management.
- **/dashboard/(admin)/emails** — Email log / transactional email history.
- **/dashboard/(admin)/hosting-orders** — Hosting order management.
- **/dashboard/(admin)/domain-orders** — Domain order management.
- **/dashboard/(admin)/business-settings** — Site-wide settings (shipping config, Paystack keys, email templates, etc.).
- **/dashboard/(admin)/activity-logs** — Audit trail of all staff/admin actions.

---

## System Pages

- **/maintenance** — Shown when the site is in maintenance mode.
- **/not-found** — 404 page (page does not exist).
- **/error** — Generic error boundary page.
- **/seo** — SEO-related internal page.

---

## Summary Count

| Section | Pages |
|---------|-------|
| Public (about, services, blog, etc.) | ~20 |
| Shop + checkout + tracking | ~7 |
| Hosting + domains | ~5 |
| Repair tracking | ~2 |
| Auth | ~6 |
| Dashboard (customer) | ~3 |
| Dashboard (staff/commerce) | ~12 |
| Dashboard (staff/POS) | ~11 |
| Dashboard (admin only) | ~9 |
| System pages | ~4 |
| **Total** | **~79** |
