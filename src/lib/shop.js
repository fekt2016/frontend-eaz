// Single source of truth for money display. Amounts come from the API in
// integer pesewas (GH₵1.00 === 100); divide by 100 only here, at the edge.
// Output: `GH₵1,234.56` — thousands separators, always 2 decimals.
export function formatGhs(pesewas) {
  return formatGhsMajor((Number(pesewas) || 0) / 100);
}

// Same output as formatGhs, for values already in major GHS units (not
// pesewas) — hosting/domain/service order money (T44, DECISION 1: an
// intentional, permanent exception to the pesewas rule; see the comment on
// HostingOrder.amount in backend-eaz for the full reasoning). Do NOT use
// this for pesewas values — it will not divide by 100.
export function formatGhsMajor(cedis) {
  return `GH₵${(Number(cedis) || 0).toLocaleString("en-GH", {
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
  return isPreorderable(product) && available <= 0;
}

// True when the product is a pre-order on any level — the product as a whole, or
// a single variant of it. The badge and pre-order affordances must honour the
// per-variant case (a 0-stock size among stocked ones) as much as the
// product-level flag.
export function isPreorderable(product) {
  if (product?.preorder?.enabled) return true;
  return Array.isArray(product?.variants) &&
    product.variants.some((v) => Boolean(v?.preorder?.enabled));
}

// Pre-order status scoped to the variant currently being viewed. When a variant
// is selected, ITS owner pre-order flag decides — a 0-stock size that is not
// itself flagged must not be treated as pre-orderable just because a sibling
// size is. With no variant selected (or no variants at all), fall back to the
// product as a whole, matching the grid card.
export function isVariantPreorderable(product, selectedVariant) {
  if (selectedVariant?.sku) {
    return Boolean(selectedVariant.preorder?.enabled);
  }
  return isPreorderable(product);
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

/*
 * Per-attribute variant selection.
 *
 * Variants store their options as a flat object — { color: "Black", storage:
 * "128GB" } — and the detail page used to render one button per variant with
 * every value crammed into the label. Three colours by three sizes is nine
 * buttons reading "Natural Titanium 128GB", and the shopper has to scan the
 * whole list to find the pairing they want. These helpers split that into one
 * row per attribute, which is how a size/colour picker is expected to behave.
 */

/** "color" → "Color", "screenSize" → "Screen size". Attribute keys are author-typed. */
export function attributeLabel(key) {
  const spaced = String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * One group per attribute, in the order the first variant declares them, each
 * with its distinct values in first-seen order.
 *
 * Returns `null` when the variants do not all describe the same attributes —
 * a product mixing `{grade}` with `{color, storage}` cannot be laid out as a
 * grid without inventing combinations that do not exist, so the caller should
 * fall back to listing whole variants.
 */
export function variantAttributeGroups(variants = []) {
  const usable = (variants || []).filter((v) => v && v.attributes && Object.keys(v.attributes).length);
  if (!usable.length || usable.length !== (variants || []).length) return null;

  const keys = Object.keys(usable[0].attributes);
  const sameShape = usable.every((v) => {
    const k = Object.keys(v.attributes);
    return k.length === keys.length && keys.every((key) => k.includes(key));
  });
  if (!sameShape) return null;

  return keys.map((key) => ({
    key,
    label: attributeLabel(key),
    values: [...new Set(usable.map((v) => String(v.attributes[key])))],
  }));
}

/**
 * The variant matching every selected attribute, or null while the choice is
 * incomplete. Every attribute the variant declares has to be chosen — matching
 * on a partial selection would let a shopper add "Black" to the cart without
 * ever picking a size.
 */
export function findVariantByAttributes(variants = [], selection = {}) {
  if (!Object.keys(selection || {}).length) return null;
  return (
    (variants || []).find(
      (v) =>
        v?.attributes &&
        Object.keys(v.attributes).every(
          (k) => k in selection && String(selection[k]) === String(v.attributes[k])
        )
    ) || null
  );
}

/** Does any variant satisfy every pair chosen so far? Partial selections count. */
function someVariantSatisfies(variants = [], selection = {}) {
  const entries = Object.entries(selection || {});
  return (variants || []).some(
    (v) => v?.attributes && entries.every(([k, val]) => String(v.attributes[k]) === String(val))
  );
}

/**
 * Would choosing `value` for `key` still name a real variant, given what else is
 * chosen? Used to grey out combinations that were never stocked — "Red" when Red
 * only ever came in 1m, say. Deliberately ignores stock: a 0-stock variant may
 * still be pre-orderable, and hiding it would lose that sale.
 */
export function isAttributeValueAvailable(variants = [], selection = {}, key, value) {
  const others = Object.entries(selection || {}).filter(([k]) => k !== key);
  return (variants || []).some(
    (v) =>
      v?.attributes &&
      String(v.attributes[key]) === String(value) &&
      others.every(([k, val]) => String(v.attributes[k]) === String(val))
  );
}

/**
 * Choosing `value` for `key`, keeping the rest of the selection where it still
 * works. When the exact pairing was never stocked, the other attributes move to
 * whatever the first variant carrying this value has, so a shopper picking a
 * colour is never left on a dead combination.
 */
export function selectAttributeValue(variants = [], selection = {}, key, value) {
  const next = { ...selection, [key]: value };
  // Still a real combination — including a half-made one, which stays half-made
  // so the shopper picks the remaining attributes themselves.
  if (someVariantSatisfies(variants, next)) return next;
  const fallback = (variants || []).find((v) => v?.attributes && String(v.attributes[key]) === String(value));
  return fallback ? { ...fallback.attributes } : { ...selection, [key]: value };
}

/**
 * The image standing for one attribute value — the first variant carrying that
 * value which has a picture of its own.
 *
 * Used to turn the attribute row into image swatches: a shopper picks "Blue" by
 * clicking the blue phone, not by reading the word. A value maps to several
 * variants (Black/128GB and Black/256GB), and they share a colour, so the first
 * one with an image is the right representative.
 */
export function attributeValueImage(variants = [], key, value) {
  const match = (variants || []).find(
    (v) => v?.attributes && String(v.attributes[key]) === String(value) && v.images?.length
  );
  return match ? match.images[0] : null;
}

/**
 * Does this attribute identify a variant's picture? True when at least two of
 * its values have different images.
 *
 * Not enough on its own to decide swatches: every variant tends to carry its own
 * photo, so "128GB" and "256GB" resolve to two different pictures — of two
 * different COLOURS — and storage would wrongly earn swatches showing a black
 * phone next to a blue one. See swatchAttributeKey.
 */
export function attributeHasDistinctImages(variants = [], key, values = []) {
  const images = values.map((v) => attributeValueImage(variants, key, v)).filter(Boolean);
  return images.length >= 2 && new Set(images).size >= 2;
}

/** Does this attribute key name a colour? Accepts both spellings. */
export function isColourKey(key) {
  return /colou?r/i.test(String(key || ""));
}

/**
 * The ONE attribute whose values are shown as image swatches, or null for none.
 *
 * Only ever colour, and only when its values genuinely have different pictures.
 *
 * Two rules are folded in here. Showing photos against SIZE is worse than
 * useless: two storages of one phone resolve to different-coloured photos, so
 * the row implies a colour choice that picking a size never makes. And a
 * product with NO colour — a screen assembly sold by grade — gets no swatches at
 * all: those pictures differ only by their caption, so the thumbnails would be
 * near-identical squares where plain text reads better and takes less room.
 */
export function swatchAttributeKey(groups = [], variants = []) {
  const colour = (groups || []).find((g) => isColourKey(g.key));
  if (!colour) return null;
  return attributeHasDistinctImages(variants, colour.key, colour.values) ? colour.key : null;
}

/**
 * Should a plain list of whole variants show pictures rather than labels? Same
 * rule: only when the variants describe a colour and were actually photographed.
 */
export function variantsShowImages(variants = []) {
  const withColour = (variants || []).filter(
    (v) => v?.attributes && Object.keys(v.attributes).some(isColourKey)
  );
  if (withColour.length < 2) return false;
  const images = withColour.map((v) => v.images?.[0]).filter(Boolean);
  return images.length >= 2 && new Set(images).size >= 2;
}
