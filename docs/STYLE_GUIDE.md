# EazWorld Style Guide & Frontend Conventions

> **This describes the frontend as it actually is.** The web client (`frontend-eaz`) is styled with
> **Tailwind CSS utility classes** — not styled-components, not CSS-variable design tokens, and there is no
> `GlobalStyles.js`. (Earlier versions of this guide described a styled-components system that was never built.)

## 🎨 Styling: Tailwind CSS

All UI is Tailwind utility classes on JSX. Match the surrounding component's conventions.

- **Config:** `frontend-eaz/tailwind.config.js` — `darkMode: "class"`, a `brand` accent color scale (kente
  gold), two warm surface colors (`paper` light / `ink` dark), a Ghana flag `star` tricolour, and three font
  families: `font-display` (**Space Grotesk**) for headings, `font-sans` (**DM Sans**) for body, and
  `font-mono` (**Space Mono**) for eyebrows, stats, SKUs and data.
- **Global CSS:** `frontend-eaz/src/app/globals.css` — the `@tailwind` layers, `--background`/`--foreground`
  CSS vars for light/dark, smooth scroll, a global `:focus-visible` ring for accessibility, and the
  **`.star-rule`** signature (see below).

### 🎨 Signature: the star rule
The single memorable brand gesture is a Ghana flag tricolour hairline (red–gold–green) led by a gold ★.
Use `<StarRule />` from `src/components/common/StarRule.jsx` under section eyebrows. Also available as raw
`.star-rule` CSS in `globals.css`; flag colours live in the `star` palette group (`bg-star-red/gold/green`).
The logo uses the star too: `★ EazWorld`.

### 🖼️ Product images
Product placeholders come from `placehold.co`, which serves SVG by default — and `next/image` refuses SVGs
(400) unless `dangerouslyAllowSVG` is enabled. Normalise with `placeholderToPng(url)` from `lib/shop.js`
(requests the PNG variant); use it anywhere a product/part image is rendered.

### Color conventions (observed in the codebase)
| Role | Light | Dark |
|------|-------|------|
| Accent / brand | `brand-500` (+ `brand-400/600` states) | same |
| Page background | `bg-paper` (warm `#FBF6EC`) | `dark:bg-ink` (warm `#161209`) |
| Card / surface | `bg-white` | `dark:bg-slate-900` |
| Borders | `border-gray-100/200` | `dark:border-slate-800/700` |
| Primary text | `text-gray-900` | `dark:text-white` |
| Secondary text | `text-gray-500` | `dark:text-slate-400` |
| Muted text | `text-gray-400` | `dark:text-slate-500` |
| Primary button | `bg-gray-900 text-white` | `dark:bg-brand-500 dark:text-gray-900` |
| Section eyebrows | `font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600` | `dark:text-brand-400` |

Shape language: **`rounded-2xl`** cards, **`rounded-full`** pills/buttons, `rounded-xl` inputs.

### 🎯 Token & neutral conventions
- **Accent is tokenized.** Use the **`brand-*`** scale (defined in `tailwind.config.js`) for the accent —
  `text-brand-500`, `bg-brand-500`, `dark:bg-brand-500`, etc. A rebrand is a one-place edit to the `brand`
  scale.
- **Warm surfaces, by design.** Page backgrounds use `bg-paper` (light) / `dark:bg-ink` (dark) — the warm
  identity surfaces. Cards stay on `bg-white` / `dark:bg-slate-900`, and the `gray-*` / `slate-*` ramps are
  still used for text, borders and subtle fills.

### Dark mode (required for public pages)
The site has a live theme toggle (`ThemeContext` → `dark` class on `<html>`). **Every public/customer page must
supply `dark:` variants.** The shop → cart → checkout → confirmation → track flow already does; copy those files
as the reference. Print surfaces (`pos/Receipt.jsx`) are intentionally light.

### ✅ Do / ❌ Don't
- ✅ Tailwind utilities; reuse the color conventions above; add `dark:` variants.
- ✅ Reuse existing components before adding new ones (check `components/` and `components/common/`).
- ❌ Don't add styled-components, `props.theme.*`, or `var(--…)` design tokens — they aren't used here.
- ❌ Don't use inline `style={{}}` except for genuinely dynamic values (e.g. a computed bar height).

## 🔄 Data fetching

Two patterns coexist during an in-progress migration to **TanStack Query (React Query v5)**:

- **Preferred (new):** reusable hooks in `src/hooks/queries/*` (`useOrders`, `useOrderTracking`,
  `useInventorySearch`, …) built on the `lib/api.js` wrapper. See `frontend-eaz/REACT_QUERY.md` for the
  QueryClient/provider/keys/invalidation conventions. Use this for API/server state.
- **Legacy:** `useEffect` + the fetch wrapper in `lib/api.js` (`api.get`/`api.post` → `{ success, data }`).
  Still fine for pages not yet migrated — match the surrounding file's pattern; don't mix both for the same feature.

Keep local UI state (modals, forms, tabs) and the cart in `useState`/context — React Query is for server state only.
Always handle loading and error states.

## 💰 Money

Shop/e-commerce amounts arrive from the API in **pesewas** — divide by 100 (`formatGhs`) at display time only.
**Exception:** the in-store **POS** subsystem (`Sale`, `PartOrder.amountGhs`) stores whole **cedis** and renders
with `.toFixed(2)` directly — don't divide those by 100.

## ♿ Accessibility

- A global `:focus-visible` ring is in `globals.css` (keyboard users only). Don't reintroduce
  `focus:outline-none` without an alternative indicator.
- Icon-only buttons need an `aria-label`; images need meaningful `alt`.
- Preserve heading order and use `<button>`/`<a>` semantics.

## 📁 Organization

- Routes in `src/app/**` (`page.jsx`, `layout.jsx`, `loading.jsx`, `error.jsx`) — keep `page.jsx` thin.
- Shared UI in `src/components/**`. Add `"use client"` only where state/effects/browser APIs are needed.

---

**Remember:** consistency and reuse keep this maintainable. When conventions here disagree with a file you're
editing, match the file and flag the drift — don't silently mix systems.
