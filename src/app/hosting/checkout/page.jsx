"use client";

import { Suspense, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SHARED_PLANS, WORDPRESS_PLANS } from "@/data/hostingHostingData";
import PageLoadingFallback from "@/components/common/PageLoadingFallback";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition bg-white dark:bg-slate-800";

const ADDONS = [
  { id: "ssl", name: "SSL Certificate Upgrade", price: 0 },
  { id: "backups", name: "Daily Backups (30 days)", price: 15 },
  { id: "dedicated-ip", name: "Dedicated IP Address", price: 25 },
  { id: "priority", name: "Priority Support", price: 35 },
  { id: "domain-privacy", name: "Domain Privacy Protection", price: 10 },
];

const TIER_TO_NAME = {
  deluxe: "Deluxe", professional: "Professional", enterprise: "Enterprise", ultimate: "Ultimate",
  starter: "WP Starter", business: "WP Business", agency: "WP Agency",
};

// ── Domain Checker Component ──────────────────────────────────────────────────
function DomainChecker({ domain, setDomain, domainMode, setDomainMode, setDomainRegistrationFee }) {
  const [query, setQuery] = useState(domain || "");
  const [status, setStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'owned' | 'error'
  const [domainInfo, setDomainInfo] = useState(null);
  const debounceRef = useRef(null);

  const checkDomain = useCallback(async (value) => {
    const cleaned = value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (!cleaned || !cleaned.includes(".") || cleaned.length < 4) {
      setStatus(null);
      setDomainInfo(null);
      return;
    }

    setStatus("checking");
    setDomainInfo(null);

    try {
      // Check if already ordered by this user
      const ordersRes = await api.get("/domains/orders").catch(() => ({ data: [] }));
      const orders = ordersRes?.data?.data || ordersRes?.data || [];
      const existing = orders.find(
        (o) => o.domain?.toLowerCase() === cleaned && ["pending", "completed", "active"].includes(o.status)
      );
      if (existing) {
        setStatus("owned");
        setDomainInfo({ domain: cleaned, existingOrder: existing });
        setDomain(cleaned);
        return;
      }

      // Check availability via Namecheap
      const res = await api.get(`/domains/search?domain=${encodeURIComponent(cleaned)}`);
      const results = res.data?.results || res.data?.data?.results || [];
      const match = results.find((r) => r.domain === cleaned || r.domain?.startsWith(cleaned.split(".")[0]));

      if (!match) {
        setStatus("error");
        return;
      }

      if (match.available) {
        setStatus("available");
        setDomainInfo(match);
        setDomain(cleaned);
        setDomainRegistrationFee(match.price || 0);
      } else {
        setStatus("taken");
        setDomainInfo(match);
        setDomain("");
        setDomainRegistrationFee(0);
      }
    } catch {
      setStatus("error");
    }
  }, [setDomain, setDomainRegistrationFee]);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setStatus(null);
    setDomainInfo(null);
    if (domainMode === "own") {
      setDomain(val.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, ""));
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkDomain(val), 700);
  };

  const handleCheck = () => {
    clearTimeout(debounceRef.current);
    checkDomain(query);
  };

  const statusBadge = () => {
    if (status === "checking") return <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />Checking availability…</span>;
    if (status === "available") return <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">✓ Available{domainInfo?.price ? ` — GH₵${domainInfo.price}/yr` : ""}</span>;
    if (status === "taken") return <span className="text-xs font-semibold text-red-500">✗ Already registered — try a different name or TLD</span>;
    if (status === "owned") return <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">★ You already ordered this domain</span>;
    if (status === "error") return <span className="text-xs text-gray-400">Could not check — enter manually or skip</span>;
    return null;
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-700 dark:text-slate-300">
        Domain for this hosting account
      </label>

      {/* Mode selector */}
      <div className="flex gap-2">
        {[
          { key: "new", label: "Register new domain" },
          { key: "own", label: "I already own one" },
          { key: "skip", label: "Skip for now" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setDomainMode(key);
              setStatus(null);
              setDomainInfo(null);
              setDomainRegistrationFee(0);
              if (key === "skip") setDomain("");
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              domainMode === key
                ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                : "border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {domainMode === "skip" && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-4 text-xs text-gray-500 dark:text-slate-400 space-y-1">
          <p className="font-medium text-gray-600 dark:text-slate-300">No domain? No problem.</p>
          <p>Your hosting account will be set up on a temporary URL so you can access cPanel straight away. You can connect your own domain at any time from your dashboard.</p>
        </div>
      )}

      {domainMode === "new" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={handleInput}
              placeholder="yourbusiness.com"
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={handleCheck}
              disabled={status === "checking"}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-700 transition disabled:opacity-60"
            >
              Check
            </button>
          </div>
          {statusBadge()}

          {status === "available" && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-xs text-emerald-700 dark:text-emerald-400">
              <p className="font-semibold mb-0.5">Great choice! This domain is available.</p>
              <p className="text-emerald-600 dark:text-emerald-500">
                {domainInfo?.price ? `Domain registration (GH₵${domainInfo.price}/yr) will be added to your order total. ` : ""}
                We&apos;ll register it and automatically point it to your hosting — no extra steps needed.
              </p>
            </div>
          )}

          {status === "taken" && (
            <div className="rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-600 dark:text-red-400">
              <p className="font-semibold mb-1">This domain is taken.</p>
              <p>Try a variation like <span className="font-mono">{query.split(".")[0]}-gh.com</span> or use a different extension like <span className="font-mono">.net</span> or <span className="font-mono">.com.gh</span></p>
            </div>
          )}

          {status === "owned" && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-semibold">You already ordered this domain through EazWorld.</p>
              <p className="mt-0.5 text-amber-600 dark:text-amber-500">It will be linked to this hosting account automatically.</p>
            </div>
          )}
        </div>
      )}

      {domainMode === "own" && (
        <div className="space-y-3">
          <input
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="yourdomain.com"
            className={inputCls}
          />
          <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-2">
            <p className="font-semibold">After checkout, update your domain&apos;s nameservers to:</p>
            <div className="flex flex-col gap-1 font-mono text-amber-900 dark:text-amber-200">
              <span>NS1: <strong>{process.env.NEXT_PUBLIC_NAMESERVER_1 || "ns1.eazworld.com"}</strong></span>
              <span>NS2: <strong>{process.env.NEXT_PUBLIC_NAMESERVER_2 || "ns2.eazworld.com"}</strong></span>
            </div>
            <p className="text-amber-700 dark:text-amber-400">Log in to your domain registrar (e.g. Namecheap, GoDaddy) and replace the existing nameservers with the ones above. DNS changes take 24–48 hrs to fully propagate.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ["Plan Summary", "Your Details", "Payment"];
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            i + 1 < step ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : i + 1 === step ? "border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white" : "border border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500"
          }`}>
            {i + 1 < step ? "✓" : i + 1}
          </div>
          <span className={`ml-2 hidden text-sm sm:inline ${i + 1 <= step ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"}`}>{label}</span>
          {i < steps.length - 1 && <span className="mx-2 h-px w-6 bg-gray-200 dark:bg-slate-700 sm:w-12" />}
        </div>
      ))}
    </div>
  );
}

// ── Main Checkout ─────────────────────────────────────────────────────────────
function HostingCheckoutPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const type = searchParams.get("type") || "shared";
  const tier = searchParams.get("tier") || "deluxe";
  const billingParam = searchParams.get("billing") || "monthly";

  const [step, setStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState(billingParam === "annual" ? "annual" : "monthly");
  const [addons, setAddons] = useState([]);
  const [domain, setDomain] = useState("");
  const [domainMode, setDomainMode] = useState("new"); // 'new' | 'own' | 'skip'
  const [domainRegistrationFee, setDomainRegistrationFee] = useState(0);
  const [customer, setCustomer] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    country: "Ghana",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [network, setNetwork] = useState("mtn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const planName = TIER_TO_NAME[(tier || "").toLowerCase()];
  const allPlans = [...SHARED_PLANS, ...WORDPRESS_PLANS];
  const plan = allPlans.find((p) => p.name === planName) || SHARED_PLANS[0];
  const addonsTotal = addons.reduce((sum, id) => sum + (ADDONS.find((a) => a.id === id)?.price ?? 0), 0);
  const basePrice = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const saving = plan.monthlyPrice * 12 - plan.annualPrice;
  const domainFee = domainMode === "new" && domain ? domainRegistrationFee : 0;
  const total = basePrice + addonsTotal + domainFee;

  const toggleAddon = (id) => setAddons((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handlePlaceOrder = async () => {
    setError("");
    if (!customer.name || !customer.email || !customer.phone) { setError("Please fill in name, email, and phone."); return; }
    if (!paymentMethod) { setError("Please select a payment method."); return; }
    if (paymentMethod === "mobile_money" && !mobileNumber) { setError("Please enter your mobile money number."); return; }

    setLoading(true);
    try {
      const res = await api.post("/hosting/orders", {
        planType: type,
        tier: tier.toLowerCase(),
        billingCycle,
        addons: addons.map((id) => {
          const a = ADDONS.find((x) => x.id === id);
          return { id, name: a?.name, price: a?.price ?? 0 };
        }),
        customer,
        paymentMethod,
        domainMode,
        ...(domain && { domain }),
        ...(domainMode === "new" && domain && domainRegistrationFee > 0 && {
          domainRegistrationFee,
          domainRegistrationYears: 1,
        }),
        ...(paymentMethod === "mobile_money" && { mobileNumber, network }),
      });

      const { authorizationUrl, orderId } = res.data;

      if (paymentMethod === "bank_transfer") {
        router.push(`/hosting/bank-transfer/${orderId}`);
      } else if (authorizationUrl) {
        window.location.href = authorizationUrl;
      } else {
        router.push("/hosting/order-confirmation");
      }
    } catch (err) {
      setError(err.message || "Order failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-24 pb-24">
      <div className="mx-auto max-w-4xl">
        <Link href="/hosting" className="mb-6 inline-block text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
          ← Back to Hosting
        </Link>
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">Checkout</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-8">Complete your hosting order</p>

        <StepIndicator step={step} />

        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          <div className="space-y-6">

            {/* STEP 1 — Plan + Add-ons */}
            {step === 1 && (
              <>
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-white mb-2">Plan Summary</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{plan.name} · {billingCycle === "annual" ? "Billed annually" : "Monthly"}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-amber-500">GH₵ {billingCycle === "annual" ? plan.annualPrice : `${plan.monthlyPrice}.00`}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{billingCycle === "annual" ? "/yr" : "/mo"}</span>
                  </div>
                  {billingCycle === "annual" && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-4">Save GH₵ {saving}</p>}
                  <ul className="space-y-1 text-sm text-gray-500 dark:text-slate-400 mb-6">
                    {plan.features.slice(0, 6).map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-amber-500">✓</span>
                        {/^free\s+/i.test(f) ? <span><span className="text-amber-500 font-bold">FREE</span> {f.replace(/^free\s+/i, "")}</span> : <span>{f}</span>}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
                    <button type="button" onClick={() => setBillingCycle("monthly")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${billingCycle === "monthly" ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"}`}>Monthly</button>
                    <button type="button" onClick={() => setBillingCycle("annual")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${billingCycle === "annual" ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"}`}>Annual (Save GH₵ {saving})</button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-4">Add-ons</h2>
                  <ul className="space-y-3">
                    {ADDONS.map((a) => (
                      <label key={a.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 hover:border-amber-200 dark:hover:border-amber-700 transition">
                        <span className="flex items-center gap-3">
                          <input type="checkbox" checked={addons.includes(a.id)} onChange={() => toggleAddon(a.id)} className="rounded border-gray-300 accent-gray-900" />
                          <span className="text-sm text-gray-700 dark:text-slate-300">{a.name}</span>
                        </span>
                        <span className="text-sm text-gray-400 dark:text-slate-500">{a.price === 0 ? "Free" : `+GH₵${a.price}/mo`}</span>
                      </label>
                    ))}
                  </ul>
                </div>

                <button type="button" onClick={() => setStep(2)} className="w-full rounded-full bg-gray-900 dark:bg-white py-3 font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition">
                  Continue to Details
                </button>
              </>
            )}

            {/* STEP 2 — Customer Details + Domain */}
            {step === 2 && (
              <>
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Full Name *</label>
                      <input type="text" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} placeholder="Your name" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Email *</label>
                      <input type="email" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} placeholder="you@example.com" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Phone *</label>
                      <input type="tel" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} placeholder="+233 XX XXX XXXX" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Address</label>
                      <input type="text" value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} placeholder="Street address" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">City</label>
                      <input type="text" value={customer.city} onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))} placeholder="Accra" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* Domain Checker */}
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-white mb-1">Domain Name</h2>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">Link a domain to your hosting account. You can also do this later from the dashboard.</p>
                  <DomainChecker
                    domain={domain}
                    setDomain={setDomain}
                    domainMode={domainMode}
                    setDomainMode={setDomainMode}
                    setDomainRegistrationFee={setDomainRegistrationFee}
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="rounded-full border border-gray-200 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition">Back</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customer.name || !customer.email || !customer.phone) { setError("Please fill in name, email, and phone."); return; }
                      setError(""); setStep(3);
                    }}
                    className="flex-1 rounded-full bg-gray-900 dark:bg-white py-3 font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition"
                  >
                    Continue to Payment
                  </button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </>
            )}

            {/* STEP 3 — Payment */}
            {step === 3 && (
              <>
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                  <h2 className="font-display text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                      { id: "paystack_card", icon: "💳", title: "Pay with Card", desc: "Visa, Mastercard via Paystack" },
                      { id: "mobile_money", icon: "📱", title: "Mobile Money", desc: "MTN MoMo or Vodafone Cash" },
                      { id: "bank_transfer", icon: "🏦", title: "Bank Transfer", desc: "Manual bank transfer — activate within 2–4 hrs" },
                    ].map((m) => (
                      <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                        className={`w-full rounded-xl border p-4 text-left transition ${paymentMethod === m.id ? "border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20" : "border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-600"}`}>
                        <span className="text-2xl">{m.icon}</span>
                        <div className="mt-2 font-semibold text-gray-900 dark:text-white">{m.title}</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">{m.desc}</div>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "mobile_money" && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Mobile Money Number</label>
                        <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="0240000000" className={inputCls} />
                      </div>
                      <div className="flex gap-2">
                        {["mtn", "vod"].map((n) => (
                          <button key={n} type="button" onClick={() => setNetwork(n)}
                            className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${network === n ? "border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-600"}`}>
                            {n === "mtn" ? "MTN MoMo" : "Vodafone Cash"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Domain summary */}
                {domain && (
                  <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Domain</span>
                    <span className="font-medium text-gray-900 dark:text-white">{domain}</span>
                  </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="rounded-full border border-gray-200 dark:border-slate-700 px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition">Back</button>
                  <button type="button" onClick={handlePlaceOrder} disabled={loading}
                    className="flex-1 rounded-full bg-gray-900 dark:bg-white py-3 font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition disabled:opacity-60">
                    {loading ? "Processing…" : paymentMethod === "bank_transfer" ? "Place Order — Pay via Bank Transfer" : `Pay GH₵ ${total} Securely`}
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-gray-400 dark:text-slate-500">
                  <span>🔒 256-bit SSL Secured</span>
                  <span>✓ Instant Activation (card/MM)</span>
                  <span>📋 Invoice Emailed</span>
                  <span>🔄 30-day Money Back</span>
                </div>
              </>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h3 className="text-sm font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Plan</span><span className="text-gray-900 dark:text-white">{plan.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Type</span><span className="text-gray-900 dark:text-white capitalize">{type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Billing</span><span className="text-gray-900 dark:text-white">{billingCycle === "annual" ? "Annual" : "Monthly"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Subtotal</span><span className="text-gray-900 dark:text-white">GH₵ {basePrice}{billingCycle === "annual" ? "/yr" : "/mo"}</span></div>
                {addonsTotal > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400">Add-ons</span><span className="text-gray-900 dark:text-white">+GH₵ {addonsTotal}</span></div>}
                {domain && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">
                      {domainMode === "new" ? "Domain (register)" : "Domain"}
                    </span>
                    <span className="text-gray-900 dark:text-white truncate max-w-[140px]">{domain}</span>
                  </div>
                )}
                {domainMode === "new" && domainFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Domain fee</span>
                    <span className="text-gray-900 dark:text-white">+GH₵ {domainFee}/yr</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-slate-700 pt-3 flex justify-between font-semibold text-base">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-amber-500">GH₵ {total}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs text-gray-400 dark:text-slate-500 space-y-1.5">
              <p>✓ 30-day money-back guarantee</p>
              <p>✓ Free SSL on all plans</p>
              <p>✓ 24/7 expert support</p>
              <p>✓ No setup fees</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HostingCheckoutPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <HostingCheckoutPageInner />
    </Suspense>
  );
}
