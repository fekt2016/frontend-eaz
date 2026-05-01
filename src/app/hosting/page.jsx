"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SHARED_PLANS, HOSTING_FEATURES } from "@/data/hostingHostingData";

function scrollTo(id) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

const SHARED_PLAN_ORDER = ["Deluxe", "Professional", "Enterprise", "Ultimate"];
const TIER_BY_PLAN_NAME = {
  Deluxe: "deluxe",
  Professional: "professional",
  Enterprise: "enterprise",
  Ultimate: "ultimate",
};

function getTierFromPlanName(planName) {
  return TIER_BY_PLAN_NAME[planName] || "deluxe";
}

function getSpecValue(plan, label) {
  return plan.specs?.find((s) => s.label === label)?.value ?? "-";
}

function FeatureMark({ ok }) {
  if (ok) return <span className="font-bold text-emerald-500">✓</span>;
  return <span className="font-bold text-gray-200">✗</span>;
}

export default function Hosting() {
  const orderedSharedPlans = SHARED_PLAN_ORDER.map((name) => SHARED_PLANS.find((p) => p.name === name)).filter(Boolean);

  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-20">

        {/* HERO */}
        <section className="grid gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
              Web Hosting Ghana
            </p>
            <h1 className="font-display font-black text-4xl leading-tight md:text-5xl text-gray-900">
              Fast. Secure.
              <br />
              Reliable Hosting
              <br />
              For African Businesses.
            </h1>
            <p className="max-w-xl text-[1.05rem] text-gray-500">
              Power your website with EazWorld&apos;s enterprise-grade hosting infrastructure. Blazing fast servers, 99.9% uptime guarantee, and expert support — all from Ghana, for Africa.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => scrollTo("hosting-plans")}
                className="rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition"
              >
                View Hosting Plans
              </button>
              <button
                type="button"
                onClick={() => scrollTo("compare-table")}
                className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 transition"
              >
                Compare All Plans
              </button>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
              <span>🟢 99.9% Uptime SLA</span>
              <span>🔒 Free SSL on All Plans</span>
              <span>⚡ NVMe SSD Storage</span>
              <span>🌍 African Server Locations</span>
              <span>📞 24/7 Expert Support</span>
            </div>
          </div>

          {/* Server status card */}
          <div className="relative">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                Server Status — Live
              </div>
              <p className="mb-4 text-xs font-medium text-emerald-600">
                All Systems Operational
              </p>
              <StatusRow label="Web Servers" />
              <StatusRow label="Database Servers" />
              <StatusRow label="DNS Servers" />
              <StatusRow label="Email Servers" />
              <div className="mt-4 flex justify-between border-t border-gray-100 pt-3 text-[0.78rem] text-gray-400">
                <span>Response Time: 12ms</span>
                <span>Uptime (30d): 99.98%</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES BAR */}
        <section className="rounded-3xl bg-gray-50 border border-gray-100 px-6 py-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HOSTING_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-100 bg-white p-4 hover:border-amber-200 hover:shadow-sm transition"
              >
                <div className="mb-2 text-2xl">{f.icon}</div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900">{f.title}</h3>
                <p className="text-[0.8rem] text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SHARED HOSTING PLANS */}
        <section id="hosting-plans" className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
            Shared Hosting
          </p>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
                Find the Perfect Hosting Plan
              </h2>
              <p className="max-w-xl text-sm text-gray-500 mt-1">
                Perfect for personal websites, blogs, and small business websites. Affordable, reliable, and easy to manage with cPanel.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {SHARED_PLANS.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section id="compare-table" className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
            Compare Plans
          </p>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
            Shared Hosting Side by Side
          </h2>
          <p className="max-w-xl text-sm text-gray-500">
            Not sure which plan is right for you? Compare storage, bandwidth, sites, and key features at a glance.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-[600px] w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-400">
                    Feature
                  </th>
                  {orderedSharedPlans.map((p) => (
                    <th
                      key={p.name}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-900"
                      style={p.featured ? { borderTop: "2px solid #F59E0B" } : undefined}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Monthly Price", kind: "monthlyPrice" },
                  { label: "Websites", kind: "spec", specLabel: "Websites" },
                  { label: "NVMe SSD Storage", kind: "spec", specLabel: "NVMe SSD Storage" },
                  { label: "RAM", kind: "spec", specLabel: "RAM" },
                  { label: "Monthly Bandwidth", kind: "spec", specLabel: "Monthly Bandwidth" },
                  { label: "Email Accounts", kind: "spec", specLabel: "Email Accounts" },
                  { label: "Subdomains", kind: "spec", specLabel: "Subdomains" },
                  { label: "Databases", kind: "spec", specLabel: "Databases" },
                  { label: "FTP Accounts", kind: "spec", specLabel: "FTP Accounts" },
                  { label: "Inodes", kind: "spec", specLabel: "Inodes" },
                  { label: "FREE LiteSpeed", kind: "feature", feature: "FREE LiteSpeed (20x Faster)" },
                  { label: "FREE .top Domain", kind: "feature", feature: "FREE .top Domain" },
                  { label: "FREE .com Domain", kind: "feature", feature: "FREE .com, .top Domain" },
                  { label: "FREE .com/.top", kind: "feature", feature: "FREE .com, .top Domain" },
                  { label: "1-Click WordPress", kind: "feature", feature: "1-Click WordPress Install" },
                  { label: "FREE SSL", kind: "feature", feature: "FREE UNLIMITED Auto SSL" },
                  { label: "FREE Website Builder", kind: "feature", feature: "FREE Website Builder" },
                  { label: "Weekly Backups", kind: "feature", feature: "Weekly Website Backups" },
                  { label: "WAF", kind: "feature", feature: "Web Application Firewall" },
                  { label: "DDoS Protection", kind: "feature", feature: "DDoS Protection" },
                  { label: "24/7 Support", kind: "feature", feature: "24/7 Support" },
                  { label: "Malware Scanning", kind: "feature", feature: "Free Malware Scanning" },
                  { label: "cPanel", kind: "feature", feature: "Managed with cPanel" },
                  { label: "Multiple PHP", kind: "feature", feature: "Multiple PHP versions" },
                  { label: "Domain Privacy", kind: "feature", feature: "Free Domain Privacy Protection" },
                  { label: "Cache Manager", kind: "feature", feature: "Cache manager" },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-gray-50">
                    <td className="sticky left-0 bg-white px-4 py-3 text-[0.82rem] font-medium text-gray-500">
                      {row.label}
                    </td>
                    {orderedSharedPlans.map((p) => {
                      const featuredBorder = p.featured ? { borderTop: "2px solid #F59E0B" } : undefined;
                      if (row.kind === "monthlyPrice") {
                        return (
                          <td key={p.name + row.label} className="px-4 py-3 text-[0.82rem] text-gray-900" style={featuredBorder}>
                            {p.symbol}{p.monthlyPrice}
                          </td>
                        );
                      }
                      if (row.kind === "spec") {
                        const value = getSpecValue(p, row.specLabel);
                        const isUnlimited = value === "UNLIMITED";
                        return (
                          <td
                            key={p.name + row.label}
                            className="px-4 py-3 text-[0.82rem]"
                            style={{
                              ...featuredBorder,
                              color: isUnlimited ? "#F59E0B" : "#111827",
                              fontWeight: isUnlimited ? 600 : 500,
                            }}
                          >
                            {value}
                          </td>
                        );
                      }
                      const ok = p.features?.includes(row.feature);
                      return (
                        <td key={p.name + row.label} className="px-4 py-3 text-xs" style={featuredBorder}>
                          <FeatureMark ok={ok} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl bg-gray-900 px-8 py-10 text-center md:text-left">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white">
                Launch Your Website Today
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Join businesses hosted on EazWorld. Fast setup. Free migration. 30-day money-back guarantee.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => scrollTo("hosting-plans")}
                className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-400 transition"
              >
                View All Plans
              </button>
              <Link
                href="/contact"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:border-white transition"
              >
                Talk to an Expert
              </Link>
            </div>
          </div>
          <p className="mt-3 text-center text-[0.75rem] text-gray-500 md:text-left">
            30-day money-back guarantee · No setup fees · Cancel anytime
          </p>
        </section>

      </div>
    </div>
  );
}

function StatusRow({ label }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[0.8rem] text-gray-500">
      <span>{label}</span>
      <span className="ml-2 text-emerald-500 font-medium">● Operational</span>
    </div>
  );
}

function PlanCard({ plan }) {
  const router = useRouter();

  const handleSelect = () => {
    const tier = getTierFromPlanName(plan.name);
    const params = new URLSearchParams({ type: "shared", tier, billing: "monthly" });
    router.push(`/hosting/checkout?${params.toString()}`);
  };

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-6 transition hover:-translate-y-1 ${
        plan.featured
          ? "border-amber-300 bg-amber-50 shadow-md shadow-amber-100"
          : "border-gray-100 bg-white"
      }`}
    >
      {plan.badge && (
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 px-4 py-1 text-xs font-semibold text-white whitespace-nowrap">
          {plan.badge}
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
      <p className="mt-1 text-xs text-gray-400">{plan.tagline}</p>

      <div className="mt-4">
        <div className="flex items-end gap-1">
          <span className="text-2xl font-bold text-amber-500">
            {plan.symbol}{plan.monthlyPrice}.00
          </span>
          <span className="text-xs text-gray-400">/mo</span>
        </div>
        <div className="mt-1 text-[0.8rem] italic text-gray-400">{plan.billingNote}</div>
        {plan.annualPrice != null && (
          <div className="mt-1 text-[0.7rem] text-gray-400">Billed annually {plan.symbol}{plan.annualPrice}/yr</div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {plan.specs.map((s) => {
          const isUnlimited = s.value === "UNLIMITED";
          return (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-[0.82rem] text-gray-500">{s.label}</span>
              <span
                className="text-[0.82rem] font-medium"
                style={isUnlimited ? { color: "#F59E0B", fontWeight: 600 } : { color: "#111827" }}
              >
                {s.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 h-px bg-gray-100" />

      <ul className="mt-4 flex flex-1 flex-col gap-1 text-[0.78rem] text-gray-500">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-[2px] text-amber-500">✓</span>
            {/^free\s+/i.test(f) ? (
              <span className="leading-tight">
                <span className="text-amber-500 font-bold">FREE</span>{" "}
                <span>{f.replace(/^free\s+/i, "")}</span>
              </span>
            ) : (
              <span>{f}</span>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleSelect}
        className={`mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition ${
          plan.featured
            ? "bg-gray-900 text-white hover:bg-gray-700"
            : "border border-gray-200 text-gray-700 hover:border-amber-300 hover:text-amber-500"
        }`}
      >
        {plan.buttonText}
      </button>
    </div>
  );
}
