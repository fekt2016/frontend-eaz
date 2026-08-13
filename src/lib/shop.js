export function formatGhs(pesewas) {
  const cedis = (Number(pesewas) || 0) / 100;
  return `GH₵ ${cedis.toFixed(2)}`;
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
