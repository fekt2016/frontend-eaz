// Single source of truth for money display. Amounts come from the API in
// integer pesewas (GH₵1.00 === 100); divide by 100 only here, at the edge.
// Output: `GH₵1,234.56` — thousands separators, always 2 decimals.
export function formatGhs(pesewas) {
  const cedis = (Number(pesewas) || 0) / 100;
  return `GH₵${cedis.toLocaleString("en-GH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Compact counts for product cards (T48): 834, 1.2k, 15k, 1.3m. Small numbers
// stay exact — "3 sold" says more than "0k". Single source of truth for count
// formatting, the way formatGhs is for money.
export function formatCount(value) {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n < 1000) return String(n);
  // 999,999 rounds up to "1000k", so hand anything that close to a million to
  // the next unit instead.
  const millions = n >= 999950;
  const scaled = Math.round((millions ? n / 1000000 : n / 1000) * 10) / 10;
  const digits = Number.isInteger(scaled) ? 0 : 1;
  return `${scaled.toFixed(digits)}${millions ? "m" : "k"}`;
}

// T45: a product marked for pre-order is orderable with no stock on hand, so the
// storefront must offer it rather than showing a dead "Out of stock". Passing the
// flag is optional — every existing caller keeps its exact behaviour.
export function stockBadge(stock, preorderEnabled = false) {
  if (stock <= 0 && preorderEnabled) {
    return { label: "Pre-order", classes: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" };
  }
  if (stock <= 0) {
    return { label: "Out of stock", classes: "bg-gray-100 text-gray-500" };
  }
  if (stock <= 10) {
    return { label: `Only ${stock} left`, classes: "bg-brand-50 text-brand-700" };
  }
  return { label: "In stock", classes: "bg-emerald-50 text-emerald-700" };
}

// placehold.co serves SVG by default (no file extension), and next/image refuses
// to optimise SVG unless dangerouslyAllowSVG is enabled. Request the PNG variant
// so product cards and thumbnails actually render. Other hosts pass through.
export function placeholderToPng(url) {
  if (!url) return url;
  try {
    const u = new URL(url, "https://placehold.co");
    if (u.hostname !== "placehold.co") return url;
    if (/\.(png|jpe?g|gif|webp|svg|avif)$/.test(u.pathname)) return url;
    u.pathname = `${u.pathname}.png`;
    return u.toString();
  } catch {
    return url;
  }
}

// When a shopper can pre-order: the product is marked for it and the stock they
// would draw on isn't there. An in-stock product is never a pre-order, which
// mirrors the server's own rule — the storefront must not offer what checkout
// would then refuse, or promise what it would silently allow.
export function canPreorder(product, stock) {
  const available = Number(stock ?? product?.stock) || 0;
  return Boolean(product?.preorder?.enabled) && available <= 0;
}

// Human copy for when a pre-ordered item is expected. Returns "" when there is
// nothing honest to say, so callers can render nothing rather than "expected null".
export function preorderAvailability(product) {
  const { availableFrom, note } = product?.preorder || {};
  const parts = [];
  if (availableFrom) {
    const when = new Date(availableFrom);
    if (!Number.isNaN(when.getTime())) {
      parts.push(`Expected ${when.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`);
    }
  }
  if (note) parts.push(note);
  return parts.join(" — ");
}

/**
 * The fulfilment choice as the customer saw it — "Courier — Next Day".
 *
 * Prefers `shippingMethodLabel`, snapshotted on the order at checkout, so a
 * later rename of a speed tier never rewrites what someone actually bought.
 * Falls back to deriving one for orders placed before that field existed;
 * without the fallback those would read "—".
 */
export function formatShippingMethod(order) {
  if (!order) return "";
  if (order.shippingMethodLabel) return order.shippingMethodLabel;

  const method = order.shippingMethod;
  if (!method) return "";
  if (method === "bus_station_pickup") return "Bus Station Pickup";
  if (method === "in_house_delivery") return "In-House Delivery";

  const speed = order.shippingSpeed;
  if (!speed || speed === "standard") return "Courier — Standard";
  const pretty = String(speed)
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return `Courier — ${pretty}`;
}
