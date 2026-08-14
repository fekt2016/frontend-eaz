# Server state with TanStack Query (React Query)

EazWorld uses **@tanstack/react-query v5** for client-side **server state** —
caching, request dedup, background refetch, and mutations with cache
invalidation. It sits *above* the existing API client; it is **not** a database
and does not replace MongoDB/Mongoose.

```
React UI  →  reusable query hooks  →  lib/api.js (fetch wrapper)  →  backend  →  MongoDB
```

## Where things live

| Concern | File |
|---|---|
| QueryClient defaults (factory) | `src/lib/queryClient.js` |
| Provider (single client, dev-only Devtools) | `src/components/providers/QueryProvider.jsx` (mounted in `src/app/layout.jsx`) |
| Central query keys | `src/lib/queryKeys.js` (`qk`) |
| Reusable hooks | `src/hooks/queries/*.js` |
| API client (unchanged) | `src/lib/api.js` |

The `QueryProvider` is the outermost client provider in the root layout, so any
`"use client"` page can use hooks. There is **one** QueryClient per browser tab.

## Defaults (and why)

Set in `queryClient.js`. Base: `staleTime 30s`, `gcTime 5m`,
`refetchOnWindowFocus: false`, retry up to 2 (never on 401/403/404), mutations
never auto-retry. Hooks override `staleTime` per feature:

- **Stock / orders / part-orders** — 10–15s (changes often; keep fresh).
- **Dashboards / tracking / public parts** — 20–30s.
- **Products / catalogue** — 60s (changes rarely).

## Query keys

Always build keys with `qk` (never hand-roll), so invalidation stays consistent.
Keys are hierarchical — invalidating a prefix clears everything under it:

```js
qk.orders.all            // ["orders"]  → invalidates list/recent/detail/mine
qk.orders.recent         // ["orders","recent"]
qk.orders.detail(id)     // ["orders","detail", id]
qk.inventory.search(q)   // ["inventory","search", q]
qk.parts.search(params)  // ["parts","search", {...}]
```

## Available hooks

- **Orders** (`useOrders.js`): `useOrders`, `useRecentOrders`, `useMyOrders`,
  `useOrder`, `useMyOrder`, `useUpdateOrderStatus` (mutation).
- **Tracking** (`useTracking.js`): `useOrderTracking` — one query serves both the
  tracking-detail page (full `history`) and any page needing only `latestEvent`
  (shared cache, no extra request).
- **Inventory** (`useInventory.js`): `useInventorySearch` (debounced staff search),
  `useInventory` (paginated list).
- **Public parts** (`usePublicParts.js`): `usePublicParts` — the `/track` repair
  parts catalogue (name, sku, price in pesewas, stock, compatibility, images).
- **POS dashboard** (`usePosDashboard.js`): `useMyOverview`, `useOverview`,
  `usePartOrders`.
- **Products** (`useProducts.js`): `useProducts`, `useProductBySlug` (client widgets
  only — public shop pages stay Server Components).

## Mutations & invalidation

Use `useMutation` for writes; invalidate the **narrowest** relevant prefix on
success — never the whole cache.

```js
// useUpdateOrderStatus
onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders.all });
```

## When to use it — and when NOT

**Use React Query for:** API/server data, caching, refetch, and mutations.

**Do NOT use it for:** local UI state (modals, dropdowns, tabs, form inputs) —
keep those in `useState`; the **cart** (`CartContext` + localStorage) — that's
client state; **Server Components** that fetch server-side (`shop/[slug]`,
`blog`, `sitemap`, `lib/products.js`) — keep those as RSC; **auth** — stays in
`AuthContext` + the `lib/api.js` cookie flow (RQ doesn't own auth). A 401 surfaces
as a thrown error the hooks expose via `error`/`isError`.

## Migrated so far

Staff POS dashboard (recent orders + jobs), commerce orders list (with status
mutation + invalidation), the order tracking-detail page, the repair-job
inventory parts search, and the customer `/track/[token]` parts catalogue
(`usePublicParts`). Other pages still use the `useEffect + api` pattern and can
be migrated incrementally — both coexist safely.

## Env / URLs

Unchanged. Hooks call the existing `lib/api.js`, which uses same-origin Next.js
rewrites (`NEXT_PUBLIC_API_URL`). `FRONTEND_URL` (SEO/canonicals) is untouched.
Do not hardcode URLs in hooks.
