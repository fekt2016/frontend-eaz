# PR — POS money UI, dashboard/part pages, and React Query integration

## Summary
Frontend side of the review hardening plus a clean, incremental **TanStack Query (React Query v5)** integration.

## Changes

### Money → pesewas (UI)
- Every POS/track money screen now **sends cedis input as integer pesewas (×100)** and **displays pesewas via `formatGhs` / ÷100**: jobs (new + detail), sell, expenses, reports, POS orders, `track/[token]`, and the sale receipt.
- Fixed a pre-existing 100× cost display in `suppliers/[id]`.

### Dashboard / catalogue
- **Staff POS dashboard:** broaden the "Recent Jobs" scope and add a **"Recent Orders"** card (shop + repair-part orders).
- Retail parts get working `/shop/part-<id>` detail pages (via the backend resolver).
- Convert the two remaining `<img>` to `next/image` (inventory, RecentProducts) → lint is now warning-free.

### React Query (server state)
- Single `QueryClient` (`lib/queryClient.js`) with tuned defaults; provider (`QueryProvider.jsx`) mounted at the app root; **Devtools lazy + dev-only** (excluded from prod).
- Central query-key registry (`lib/queryKeys.js`) and reusable hooks (`hooks/queries/*`): orders (+ `useUpdateOrderStatus` mutation), tracking, inventory search, public parts, POS dashboard, products.
- **Migrated pages** (UI preserved, legacy `useEffect + api` removed): staff POS dashboard, commerce orders list (with status mutation + scoped `["orders"]` invalidation), order tracking-detail page, and the repair-job inventory parts search (debounced, real `/pos/inventory`).
- Sits **above** the existing `lib/api.js` client — no second client, no auth changes. Other pages keep the legacy pattern and migrate incrementally.

### Tooling / docs
- Vitest + React Testing Library setup (`npm test`); tests for money formatting (`lib/shop`) and cart math (`CartContext`).
- Architecture guide: `REACT_QUERY.md`.

## Checks
- ESLint: clean (0 warnings/errors)
- `next build`: succeeds
- Vitest: 9/9

## Notes
- No SSR hydration/dehydration added (no benefit for these client dashboards).
- The customer `/track/[token]` parts-search **UI** still uses its existing flow; a `usePublicParts` hook is ready to drop in later.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
