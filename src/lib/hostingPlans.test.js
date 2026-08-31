// The storefront's plan data used to be a hardcoded copy of the backend
// catalogue. It drifted: the page advertised GH₵9/mo where checkout charged
// GH₵62/mo. These tests pin the adapter that replaced it.
//
// PAYLOAD below is the literal output of GET /hosting/plans, captured from
// config/hostingPlans.js — including the fact that monthlyPrice/annualPrice are
// live getters on the backend and therefore arrive as plain numbers once
// serialised. If that ever stops being true these tests fail, which is the
// point: the page renders whatever the API sends.
import { describe, it, expect } from "vitest";
import { toPlanCards } from "./hostingPlans";

const PAYLOAD = {
  shared: {
    deluxe: {
      name: "Deluxe",
      tagline: "A single small site, online and looked after.",
      priceUsd: 3,
      specs: [
        { label: "Websites", value: "1" },
        { label: "NVMe SSD Storage", value: "1GB" },
      ],
      features: ["FREE Webmail", "24/7 Support"],
      monthlyPrice: 47,
      annualPrice: 470,
    },
    enterprise: {
      name: "Enterprise",
      tagline: "Several sites for one business.",
      priceUsd: 11,
      specs: [{ label: "Websites", value: "3" }],
      features: ["FREE .top Domain"],
      monthlyPrice: 171,
      annualPrice: 1710,
    },
  },
  wordpress: {
    starter: {
      name: "WP Starter",
      tagline: "WordPress, installed and kept updated.",
      priceUsd: 5,
      specs: [{ label: "WordPress Sites", value: "1" }],
      features: ["WordPress preinstalled (Softaculous)"],
      monthlyPrice: 78,
      annualPrice: 780,
    },
  },
};

describe("toPlanCards", () => {
  it("carries the API price through untouched", () => {
    const [deluxe] = toPlanCards(PAYLOAD, "shared");
    expect(deluxe.monthlyPrice).toBe(47);
    expect(deluxe.annualPrice).toBe(470);
    // Not 9/108 — the figures the deleted local copy still held.
    expect(deluxe.monthlyPrice).not.toBe(9);
  });

  it("keeps the tier key, which is what gets POSTed and priced server-side", () => {
    expect(toPlanCards(PAYLOAD, "shared").map((p) => p.tier)).toEqual([
      "deluxe",
      "enterprise",
    ]);
  });

  it("passes specs and features through for the cards and comparison table", () => {
    const [deluxe] = toPlanCards(PAYLOAD, "shared");
    expect(deluxe.specs).toEqual([
      { label: "Websites", value: "1" },
      { label: "NVMe SSD Storage", value: "1GB" },
    ]);
    expect(deluxe.features).toContain("24/7 Support");
  });

  it("applies presentation metadata without letting it reach the price", () => {
    const cards = toPlanCards(PAYLOAD, "shared");
    const enterprise = cards.find((p) => p.tier === "enterprise");
    expect(enterprise.featured).toBe(true);
    expect(enterprise.badge).toBe("MOST POPULAR");
    expect(enterprise.monthlyPrice).toBe(171);
  });

  it("defaults presentation for a tier it has no entry for", () => {
    const withNewTier = { shared: { ...PAYLOAD.shared, brandNew: { name: "New", monthlyPrice: 10, annualPrice: 100 } } };
    const card = toPlanCards(withNewTier, "shared").find((p) => p.tier === "brandNew");
    expect(card.featured).toBe(false);
    expect(card.buttonText).toBe("Get Started");
    // A tier added backend-side must still render, not crash the page.
    expect(card.specs).toEqual([]);
    expect(card.features).toEqual([]);
  });

  it("returns [] rather than throwing while the request is in flight", () => {
    // The page renders before the fetch resolves; `plans` is undefined then.
    expect(toPlanCards(undefined, "shared")).toEqual([]);
    expect(toPlanCards({}, "shared")).toEqual([]);
    expect(toPlanCards(PAYLOAD, "nonexistent")).toEqual([]);
  });

  it("reads wordpress independently of shared", () => {
    const wp = toPlanCards(PAYLOAD, "wordpress");
    expect(wp).toHaveLength(1);
    expect(wp[0].name).toBe("WP Starter");
    expect(wp[0].monthlyPrice).toBe(78);
  });
});

describe("resolving the plan the checkout will actually POST", () => {
  // `tier` alone is ambiguous: "starter" exists under wordpress, vps, cloud and
  // email. Checkout POSTs planType from the URL, so it must resolve on the PAIR
  // or the summary can show one price while the server charges another.
  const MULTI = {
    ...PAYLOAD,
    vps: {
      starter: {
        name: "VPS Starter",
        specs: [],
        features: [],
        monthlyPrice: 280,
        annualPrice: 2800,
      },
    },
  };

  it("distinguishes wordpress/starter from vps/starter", () => {
    const wp = toPlanCards(MULTI, "wordpress").find((p) => p.tier === "starter");
    const vps = toPlanCards(MULTI, "vps").find((p) => p.tier === "starter");
    expect(wp.monthlyPrice).toBe(78);
    expect(vps.monthlyPrice).toBe(280);
    // Same tier key, very different charge — matching on tier alone would have
    // shown GH₵78 for an order the server prices at GH₵280.
    expect(wp.monthlyPrice).not.toBe(vps.monthlyPrice);
  });
});
