// Adapter between GET /hosting/plans and the storefront's plan cards.
//
// The storefront used to carry its own hardcoded copy of the catalogue in
// src/data/hostingHostingData.js. It drifted: T66/T67 repriced the backend on
// 2026-08-26 and that copy was never updated, so the page advertised GH₵9/mo for
// a plan the API charged GH₵62/mo for — about a sevenfold gap on every shared
// tier. Prices, specs and features now come from the API, which is the same
// source hostingOrderController prices the actual order from.
//
// Only PRESENTATION stays here: which card is highlighted, its badge, and the
// button label. Those are storefront decisions with no business meaning, and
// putting them in the API would just move the drift somewhere less obvious.

const PRESENTATION = {
  shared: {
    deluxe: { featured: false, badge: null, buttonText: "Get Started" },
    professional: { featured: false, badge: null, buttonText: "Get Started" },
    enterprise: { featured: true, badge: "MOST POPULAR", buttonText: "Get Started" },
    ultimate: { featured: false, badge: null, buttonText: "Get Started" },
  },
  wordpress: {
    starter: { featured: false, badge: null, buttonText: "Get Started" },
    business: { featured: true, badge: "BEST VALUE", buttonText: "Get Started" },
    agency: { featured: false, badge: null, buttonText: "Get Started" },
  },
  // buttonText here is a fallback only — toPlanCards overrides it for any plan
  // the API marks 'enquiry'.
  vps: {
    starter: { featured: false, badge: null, buttonText: "Request a quote" },
    business: { featured: true, badge: null, buttonText: "Request a quote" },
    pro: { featured: false, badge: null, buttonText: "Request a quote" },
  },
};

const DEFAULT_PRESENTATION = { featured: false, badge: null, buttonText: "Get Started" };

/**
 * Turn one category of the API payload into the array of plan cards the page
 * renders. Returns [] for a missing category so a page can render its loading or
 * empty state instead of throwing — the API is a network call now, not an import.
 *
 * @param {object} plans     the `data` object from GET /hosting/plans
 * @param {string} category  'shared' | 'wordpress' | …
 */
export function toPlanCards(plans, category) {
  const tiers = plans?.[category];
  if (!tiers || typeof tiers !== "object") return [];

  return Object.entries(tiers).map(([tier, plan]) => ({
    tier,
    name: plan.name,
    tagline: plan.tagline,
    // Already GH₵ — config/hostingPlans.js converts priceUsd with the
    // admin-editable rate and exposes these as live getters.
    monthlyPrice: plan.monthlyPrice,
    annualPrice: plan.annualPrice,
    symbol: "GH₵",
    specs: plan.specs || [],
    features: plan.features || [],
    // 'instant' | 'enquiry' — set by the API, never decided here. A VPS is
    // quoted by hand, so its card must not lead to checkout; the backend
    // rejects the order anyway, and the two must not disagree.
    availability: plan.availability || "instant",
    ...(PRESENTATION[category]?.[tier] || DEFAULT_PRESENTATION),
    ...(plan.availability === "enquiry" ? { buttonText: "Request a quote" } : {}),
  }));
}
