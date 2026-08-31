"use client";

/*
 * Domain & hosting pricing controls (owner request, 2026-08-31).
 *
 * LIVES IN BUSINESS SETTINGS, not on the domain page where it was first built.
 * The exchange rate is not a domain setting — it reprices every hosting plan
 * too, and filing it under "Domain Orders" hid that. Business Settings is where
 * the other global, price-affecting config already lives (shop identity, VAT).
 *
 * These two numbers were environment variables, so changing the exchange rate
 * meant a redeploy — and a rate that is awkward to change is a rate that goes
 * stale, quietly eating the margin it exists to protect.
 *
 * THE RATE IS SHARED. It prices domains AND every hosting plan, because
 * config/hostingPlans.js converts with the same number. That was already true
 * when it was an env var, but a form makes it easy to change by accident, so the
 * UI says so plainly and previews BOTH before saving.
 *
 * The live preview is the point of the screen. "Markup 1.2" means nothing on its
 * own; "a .com goes from GH₵190 to GH₵214" is a decision someone can actually
 * make.
 */

import { useCallback, useEffect, useState } from "react";
import { Coins, Info, TriangleAlert } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Button, Field, Input, SectionCard } from "@/components/ui";

// Mirrors backend config/domainPricing.js. Shown so the preview can be computed
// as the admin types, without a round trip per keystroke.
const SAMPLE_TLD_COST_USD = { ".com": 10.18, ".net": 11.4, ".org": 11.59, ".io": 51.75 };
// Mirrors config/hostingPlans.js — hosting prices carry NO markup.
const SAMPLE_PLANS_USD = { "Shared Deluxe": 4, "Shared Professional": 8, "VPS Starter": 18.06 };

const ghs = (n) => `GH₵${Number(n).toLocaleString("en-GB")}`;

export default function PricingSection() {
  const [rate, setRate] = useState("");
  const [markup, setMarkup] = useState("");
  const [saved, setSaved] = useState({ rate: null, markup: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/settings");
      const p = res.data?.pricing || {};
      const r = p.usdToGhsRate ?? 15.5;
      const m = p.domainMarkup ?? 1.2;
      setRate(String(r));
      setMarkup(String(m));
      setSaved({ rate: r, markup: m });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const r = parseFloat(rate);
  const m = parseFloat(markup);
  const valid = Number.isFinite(r) && r >= 1 && r <= 1000 && Number.isFinite(m) && m >= 1 && m <= 10;
  const changed = valid && (r !== saved.rate || m !== saved.markup);

  // Same formulas as the server: domains ceil(usd × rate × markup), hosting
  // round(usd × rate) with no markup.
  const domainPrice = (usd, rr = r, mm = m) => Math.ceil(usd * rr * mm);
  const hostingPrice = (usd, rr = r) => Math.round(usd * rr);

  async function save(e) {
    e.preventDefault();
    setError("");
    setNote("");
    setBusy(true);
    try {
      await api.patch("/settings", { pricing: { usdToGhsRate: r, domainMarkup: m } });
      setSaved({ rate: r, markup: m });
      setNote("Saved — new prices are live.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  const marginPct = Number.isFinite(m) ? Math.round((m - 1) * 100) : 0;

  return (
    <SectionCard
      icon={Coins}
      title="Domain & Hosting Pricing"
      description="What customers pay is worked out from a US-dollar cost, so these two numbers set every domain and hosting price in the shop."
      iconColor="bg-emerald-600"
    >
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Dollar rate (GH₵ per $1)"
          hint="Used for domains AND hosting."
        >
          <Input
            type="number" step="0.01" min="1" max="1000"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
        <Field
          label="Domain profit"
          hint={`${marginPct}% on top of cost. Domains only — hosting prices already include your margin.`}
        >
          <Input
            type="number" step="0.05" min="1" max="10"
            value={markup}
            onChange={(e) => setMarkup(e.target.value)}
          />
        </Field>

        {/* The rate moving hosting too is the surprise worth preventing. */}
        <div className="sm:col-span-2 flex items-start gap-2 rounded-xl border border-info/30 bg-info/5 p-3 dark:border-info-dark/30 dark:bg-info-dark/10">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info dark:text-info-dark" aria-hidden="true" />
          <p className="text-sm text-gray-700 dark:text-slate-300">
            Changing the dollar rate reprices <strong>hosting as well as domains</strong>.
            The profit setting affects domains only.
          </p>
        </div>

        {!valid && (rate !== "" || markup !== "") && (
          <p className="sm:col-span-2 flex items-center gap-2 text-sm text-error dark:text-error-dark">
            <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            Rate must be 1–1000 and profit must be at least 1 — below 1 would sell domains for less than they cost you.
          </p>
        )}

        {valid && (
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4 dark:border-slate-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Domains — customer pays
              </p>
              <ul className="space-y-1 text-sm">
                {Object.entries(SAMPLE_TLD_COST_USD).map(([tld, usd]) => {
                  const now = domainPrice(usd);
                  const was = saved.rate ? domainPrice(usd, saved.rate, saved.markup) : now;
                  const profit = Math.round(now - usd * r);
                  return (
                    <li key={tld} className="flex items-center justify-between gap-3">
                      <span className="text-gray-600 dark:text-slate-400">{tld}</span>
                      <span className="text-gray-900 dark:text-white">
                        {ghs(now)}
                        <span className="ml-2 text-xs text-gray-500 dark:text-slate-500">
                          (you keep {ghs(profit)})
                        </span>
                        {changed && was !== now && (
                          <span className="ml-2 text-xs text-gray-400 line-through">{ghs(was)}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-100 p-4 dark:border-slate-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Hosting — per month
              </p>
              <ul className="space-y-1 text-sm">
                {Object.entries(SAMPLE_PLANS_USD).map(([name, usd]) => {
                  const now = hostingPrice(usd);
                  const was = saved.rate ? hostingPrice(usd, saved.rate) : now;
                  return (
                    <li key={name} className="flex items-center justify-between gap-3">
                      <span className="text-gray-600 dark:text-slate-400">{name}</span>
                      <span className="text-gray-900 dark:text-white">
                        {ghs(now)}
                        {changed && was !== now && (
                          <span className="ml-2 text-xs text-gray-400 line-through">{ghs(was)}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {error && <p className="sm:col-span-2 text-sm text-error dark:text-error-dark" role="alert">{error}</p>}
        {note && <p className="sm:col-span-2 text-sm text-success dark:text-success-dark">{note}</p>}

        <div className="sm:col-span-2">
          <Button type="submit" variant="brand" loading={busy} disabled={!valid || !changed}>
            {changed ? "Save new prices" : "Saved"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
