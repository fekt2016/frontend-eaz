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
