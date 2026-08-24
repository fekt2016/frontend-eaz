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

export function stockBadge(stock) {
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
