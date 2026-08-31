"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HOSTING_FEATURES } from "@/data/hostingHostingData";
import { useHostingPlans } from "@/hooks/queries/useHosting";
import { toPlanCards } from "@/lib/hostingPlans";
import { Banknote, Check, Lock, MapPin, Phone, RefreshCw, X, Zap } from "lucide-react";
import { formatGhsMajor } from "@/lib/shop";

function scrollTo(id) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export default function Hosting() {
  const [tab, setTab] = useState("shared");
  const [billing, setBilling] = useState("monthly");

  // Prices come from the API, not a local copy — the local copy drifted to about
  // a seventh of what checkout actually charges. See lib/hostingPlans.js.
  const { data: plans, isLoading } = useHostingPlans();
  const SHARED_PLANS = toPlanCards(plans, "shared");
  const WORDPRESS_PLANS = toPlanCards(plans, "wordpress");
  const VPS_PLANS = toPlanCards(plans, "vps");

  return (
    <div className="min-h-screen bg-paper dark:bg-ink">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gray-900 px-4 pt-32 pb-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-400 mb-6">
            Web Hosting Ghana
          </span>
          <h1 className="font-display font-bold text-4xl leading-tight md:text-6xl mb-6">
            Fast. Secure. Reliable.
            <br />
            <span className="text-brand-400">Hosting Built for Africa.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-gray-600 text-lg mb-8">
            Enterprise-grade hosting infrastructure powered from Africa. Blazing fast NVMe SSD servers,
            99.9% uptime guarantee, free SSL, and cPanel on every plan.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button
              onClick={() => scrollTo("plans")}
              className="rounded-full bg-brand-500 px-7 py-3 text-sm font-semibold text-gray-900 hover:bg-brand-400 transition"
            >
              View All Plans
            </button>
            <button
              onClick={() => scrollTo("compare")}
              className="rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white hover:border-white/50 transition"
            >
              Compare Plans
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            {["✅ 99.9% Uptime SLA", "🔒 Free SSL", "⚡ NVMe SSD", "💳 No Setup Fees", "🔄 Free Migration"].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BAR ── */}
      <section className="border-b border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 px-4 py-12">
        <div className="mx-auto max-w-6xl grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {HOSTING_FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <f.icon size={22} />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLANS ── */}
      <section id="plans" className="px-4 py-20">
        <div className="mx-auto max-w-6xl">

          {/* Section header */}
          <div className="text-center mb-10">
            <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-2">Hosting Plans</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white mb-3">
              Choose Your Perfect Plan
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
              All plans include free SSL, cPanel, daily backups, and 24/7 support.
              Cancel or upgrade anytime.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-full bg-gray-100 dark:bg-slate-800 p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${billing === "monthly" ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${billing === "annual" ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400"}`}
              >
                Annual
                <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Save up to 20%</span>
              </button>
            </div>
          </div>

          {/* Plan type tabs */}
          <div className="flex justify-center gap-2 mb-10">
            {[
              { key: "shared", label: "Shared Hosting" },
              { key: "wordpress", label: "WordPress Hosting" },
              { key: "vps", label: "VPS Hosting" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-full px-5 py-2 text-sm font-semibold border transition ${
                  tab === key
                    ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                    : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Plan cards */}
          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 animate-pulse"
                />
              ))}
            </div>
          )}

          {!isLoading && tab === "shared" && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {SHARED_PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} billing={billing} planType="shared" />
              ))}
            </div>
          )}

          {!isLoading && tab === "wordpress" && (
            <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
              {WORDPRESS_PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} billing={billing} planType="wordpress" />
              ))}
            </div>
          )}

          {!isLoading && tab === "vps" && (
            <div className="max-w-4xl mx-auto">
              {/* Said before the price, not after. A VPS cannot be provisioned
                  automatically from a cPanel reseller plan — the server is bought
                  and built by hand, and the order sits in the awaiting-provisioning
                  queue until it is. A customer who expects the instant activation
                  the shared plans give would otherwise be surprised after paying. */}
              <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-900/40 dark:bg-brand-900/20 dark:text-brand-300">
                <p className="font-semibold">Built to order.</p>
                <p className="mt-0.5">
                  VPS servers are set up by hand rather than instantly. We build yours after
                  payment and email the credentials once it is ready.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {VPS_PLANS.map((plan) => (
                  <PlanCard key={plan.name} plan={plan} billing={billing} planType="vps" />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      {/* Hidden while the catalogue loads: with no plans the table renders a
          header row and nothing under it, which reads as "no plans exist". */}
      {SHARED_PLANS.length > 0 && (
      <section id="compare" className="bg-paper dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-2">Compare Plans</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white">
              Shared Hosting Side by Side
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            <table className="min-w-[640px] w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800">
                  <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-500">Feature</th>
                  {SHARED_PLANS.map((p) => (
                    <th
                      key={p.name}
                      className={`px-5 py-4 text-left text-xs font-bold ${p.featured ? "text-brand-500" : "text-gray-900 dark:text-white"}`}
                    >
                      {p.name}
                      {p.featured && <span className="ml-1.5 rounded-full bg-brand-100 dark:bg-brand-900/30 px-2 py-0.5 text-[10px] text-brand-700 dark:text-brand-400">Popular</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Monthly Price", key: "price" },
                  { label: "Websites", key: "Websites" },
                  { label: "Storage", key: "NVMe SSD Storage" },
                  { label: "Bandwidth", key: "Monthly Bandwidth" },
                  { label: "Email Accounts", key: "Email Accounts" },
                  { label: "Databases", key: "Databases" },
                  { label: "Free SSL", feat: "FREE UNLIMITED Auto SSL" },
                  { label: "LiteSpeed", feat: "FREE LiteSpeed (20x Faster)" },
                  { label: "1-Click WordPress", feat: "1-Click WordPress Install" },
                  { label: "Free Domain", feat: "FREE .top Domain" },
                  { label: "Website Builder", feat: "FREE Website Builder" },
                  { label: "cPanel", feat: "Managed with cPanel" },
                  { label: "24/7 Support", feat: "24/7 Support" },
                ].map((row, i) => (
                  <tr key={row.label} className={`border-t border-gray-50 dark:border-slate-800 ${i % 2 === 0 ? "" : "bg-paper/50 dark:bg-slate-800/30"}`}>
                    <td className="px-5 py-3 text-[0.82rem] font-medium text-gray-500 dark:text-slate-400">{row.label}</td>
                    {SHARED_PLANS.map((p) => {
                      if (row.key === "price") {
                        return <td key={p.name} className="px-5 py-3 text-[0.82rem] font-semibold text-gray-900 dark:text-white">{formatGhsMajor(p.monthlyPrice)}/mo</td>;
                      }
                      if (row.key) {
                        const val = p.specs.find(s => s.label === row.key)?.value ?? "—";
                        return (
                          <td key={p.name} className={`px-5 py-3 text-[0.82rem] font-medium ${val === "UNLIMITED" ? "text-brand-500 font-semibold" : "text-gray-900 dark:text-white"}`}>
                            {val}
                          </td>
                        );
                      }
                      const ok = p.features.includes(row.feat);
                      return (
                        <td key={p.name} className="px-5 py-3 text-sm">
                          {ok ? <Check size={14} className="inline-block -mt-0.5 text-emerald-500" /> : <X size={14} className="inline-block -mt-0.5 text-gray-200 dark:text-slate-700" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      )}

      {/* ── WHY EAZWORLD ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="font-mono text-eyebrow font-bold uppercase text-brand-ink dark:text-brand-400 mb-2">Why EazWorld</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 dark:text-white">
              Hosting You Can Actually Trust
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Built for Ghana & Africa", desc: "Local support, GHS pricing, and servers optimised for African internet speeds." },
              { icon: Lock, title: "Security First", desc: "Free SSL, DDoS protection, Web Application Firewall, and daily malware scans on every plan." },
              { icon: Phone, title: "Real Human Support", desc: "Talk to a real person — not a bot. Our team is available 24/7 via chat and email." },
              { icon: Zap, title: "NVMe SSD Speed", desc: "Up to 10× faster than traditional HDD hosting. Your website loads instantly." },
              { icon: RefreshCw, title: "Free Migration", desc: "Moving from another host? We handle the migration for free — zero downtime guaranteed." },
              { icon: Banknote, title: "30-Day Money Back", desc: "Not satisfied? Get a full refund within 30 days. No questions asked." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 dark:border-slate-800 p-6 hover:border-brand-200 dark:hover:border-brand-900/30 hover:shadow-sm transition">
                <item.icon size={28} className="mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gray-900 px-8 py-12 text-center">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-3">
            Ready to Launch Your Website?
          </h2>
          <p className="text-gray-600 text-sm mb-8 max-w-xl mx-auto">
            Join hundreds of businesses hosted on EazWorld. Fast setup, free migration, and expert support from day one.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => scrollTo("plans")}
              className="rounded-full bg-brand-500 px-8 py-3 text-sm font-semibold text-gray-900 hover:bg-brand-400 transition"
            >
              Get Started Today
            </button>
            <Link
              href="/contact"
              className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold text-white hover:border-white transition"
            >
              Talk to an Expert
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">30-day money-back guarantee · No setup fees · Cancel anytime</p>
        </div>
      </section>

    </div>
  );
}

function PlanCard({ plan, billing, planType }) {
  const router = useRouter();
  const price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const saving = plan.monthlyPrice * 12 - plan.annualPrice;

  const handleSelect = () => {
    const params = new URLSearchParams({ type: planType, tier: plan.tier, billing });
    router.push(`/hosting/checkout?${params.toString()}`);
  };

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-md ${
      plan.featured
        ? "border-brand-300 bg-brand-50 dark:bg-brand-900/10 dark:border-brand-500/40 shadow-md shadow-brand-100/50"
        : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900"
    }`}>
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-[11px] font-bold text-gray-900 whitespace-nowrap">
          {plan.badge}
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">{plan.name}</h3>
        <p className="text-xs text-gray-600 dark:text-slate-500 mt-0.5">{plan.tagline}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-brand-500">{plan.symbol}{price}</span>
          <span className="text-xs text-gray-600 dark:text-slate-500 mb-1">/{billing === "annual" ? "yr" : "mo"}</span>
        </div>
        {billing === "annual" && saving > 0 && (
          <p className="text-[11px] text-emerald-600 font-medium">Save {plan.symbol}{saving}/yr</p>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {plan.specs.map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-slate-400">{s.label}</span>
            <span className={`text-xs font-semibold ${s.value === "UNLIMITED" ? "text-brand-500" : "text-gray-900 dark:text-white"}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      <div className="h-px bg-gray-100 dark:bg-slate-800 mb-4" />

      <ul className="flex-1 space-y-1.5 mb-5">
        {plan.features.slice(0, 7).map((f) => (
          <li key={f} className="flex items-start gap-2 text-[0.78rem] text-gray-500 dark:text-slate-400">
            <span className="mt-0.5 shrink-0"><Check size={12} className="text-brand-500" /></span>
            {/^free\s+/i.test(f) ? (
              <span><span className="font-bold text-brand-500">FREE</span> {f.replace(/^free\s+/i, "")}</span>
            ) : f}
          </li>
        ))}
        {plan.features.length > 7 && (
          <li className="text-[0.78rem] text-gray-600 dark:text-slate-500 pl-4">+{plan.features.length - 7} more features</li>
        )}
      </ul>

      <button
        onClick={handleSelect}
        className={`w-full rounded-full py-2.5 text-sm font-semibold transition ${
          plan.featured
            ? "bg-gray-900 text-white hover:bg-gray-700"
            : "border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-500"
        }`}
      >
        {plan.buttonText}
      </button>
    </div>
  );
}
