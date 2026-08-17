"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FaServer, FaArrowLeft, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaCopy } from "react-icons/fa";
import { useHostingPlans, useStaffCreateHostingAccount } from "@/hooks/queries/useHosting";

const EMPTY_PLANS = {};
const STAFF_ROLES = ["admin", "staff", "superadmin"];
// Only these plan types auto-provision a cPanel account (WHM); others are recorded but not provisioned.
const CPANEL_TYPES = ["shared", "wordpress"];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash (provision now)" },
  { value: "paystack_card", label: "Paystack — Card" },
  { value: "mobile_money", label: "Paystack — Mobile Money" },
];

export default function StaffCreateHostingAccountPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const canAccess = STAFF_ROLES.includes(user?.role);

  useEffect(() => {
    if (!authLoading && !canAccess) router.replace("/dashboard");
  }, [authLoading, canAccess, router]);

  const plansQ = useHostingPlans({ enabled: !authLoading && canAccess });
  const plans = plansQ.data ?? EMPTY_PLANS;
  const createAccount = useStaffCreateHostingAccount();

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    planType: "shared", tier: "deluxe", billingCycle: "monthly",
    domainMode: "skip", domain: "",
    paymentMethod: "cash", mobileNumber: "", network: "mtn",
  });
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const planTypes = Object.keys(plans);
  const tiers = useMemo(() => Object.keys(plans[form.planType] || {}), [plans, form.planType]);

  // Keep tier valid when planType changes.
  useEffect(() => {
    if (tiers.length && !tiers.includes(form.tier)) {
      setForm((f) => ({ ...f, tier: tiers[0] }));
    }
  }, [tiers, form.tier]);

  const selectedPlan = plans[form.planType]?.[form.tier];
  const price = selectedPlan
    ? form.billingCycle === "annual" ? selectedPlan.annualPrice : selectedPlan.monthlyPrice
    : null;
  const isCpanel = CPANEL_TYPES.includes(form.planType);

  const submit = (e) => {
    e.preventDefault();
    setResult(null);
    if (!form.name.trim() || !form.email.trim()) {
      alert("Customer name and email are required.");
      return;
    }
    createAccount.mutate(
      {
        customer: { name: form.name, email: form.email, phone: form.phone },
        planType: form.planType,
        tier: form.tier,
        billingCycle: form.billingCycle,
        paymentMethod: form.paymentMethod,
        domainMode: form.domainMode,
        ...(form.domainMode !== "skip" && form.domain.trim() && { domain: form.domain.trim() }),
        ...(form.paymentMethod === "mobile_money" && { mobileNumber: form.mobileNumber, network: form.network }),
      },
      {
        onSuccess: (res) => setResult({ ok: true, data: res?.data ?? res }),
        onError: (err) => setResult({ ok: false, error: err.message || "Failed to create account." }),
      }
    );
  };

  if (authLoading || !canAccess) return null;

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-400";
  const labelCls = "block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/hosting" className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <FaArrowLeft size={12} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FaServer className="text-brand-500" size={16} /> Create Hosting Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Set up a cPanel account for a customer in-store.</p>
        </div>
      </div>

      {result?.ok ? (
        <ResultCard data={result.data} onReset={() => setResult(null)} />
      ) : (
        <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 space-y-5">
          {result && !result.ok && (
            <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <FaExclamationTriangle size={12} /> {result.error}
            </p>
          )}

          {/* Customer */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-2">Customer</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className={labelCls}>Full name *</label><input className={inputCls} value={form.name} onChange={set("name")} placeholder="Ama Owusu" /></div>
              <div><label className={labelCls}>Email *</label><input type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="ama@example.com" /></div>
              <div><label className={labelCls}>Phone</label><input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="0201234567" /></div>
            </div>
          </div>

          {/* Plan */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-2">Plan</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Type</label>
                <select className={inputCls} value={form.planType} onChange={set("planType")}>
                  {planTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tier</label>
                <select className={inputCls} value={form.tier} onChange={set("tier")}>
                  {tiers.map((t) => <option key={t} value={t}>{plans[form.planType]?.[t]?.name || t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Billing</label>
                <select className={inputCls} value={form.billingCycle} onChange={set("billingCycle")}>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Price</span>
              <span className="font-semibold text-gray-900 dark:text-white">{price != null ? `GH₵${price.toLocaleString()}` : "—"}</span>
            </div>
            {!isCpanel && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Note: only <b>shared</b> and <b>wordpress</b> plans auto-create a cPanel account. This order will be recorded but not provisioned.
              </p>
            )}
          </div>

          {/* Domain */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-2">Domain</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Mode</label>
                <select className={inputCls} value={form.domainMode} onChange={set("domainMode")}>
                  <option value="skip">Temp subdomain (eazworld.com)</option>
                  <option value="own">Customer owns the domain</option>
                  <option value="new">Register a new domain</option>
                </select>
              </div>
              {form.domainMode !== "skip" && (
                <div><label className={labelCls}>Domain</label><input className={inputCls} value={form.domain} onChange={set("domain")} placeholder="customer-site.com" /></div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500 mb-2">Payment</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Method</label>
                <select className={inputCls} value={form.paymentMethod} onChange={set("paymentMethod")}>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              {form.paymentMethod === "mobile_money" && (
                <>
                  <div><label className={labelCls}>MoMo number</label><input className={inputCls} value={form.mobileNumber} onChange={set("mobileNumber")} placeholder="0201234567" /></div>
                  <div>
                    <label className={labelCls}>Network</label>
                    <select className={inputCls} value={form.network} onChange={set("network")}>
                      <option value="mtn">MTN</option>
                      <option value="vod">Telecel/Vodafone</option>
                      <option value="atl">AirtelTigo</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
              {form.paymentMethod === "cash"
                ? "Cash: the cPanel account is created immediately and credentials are emailed to the customer."
                : "Paystack: a payment link is generated — the account is created once payment succeeds."}
            </p>
          </div>

          <button type="submit" disabled={createAccount.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-50">
            {createAccount.isPending ? <><FaSpinner className="animate-spin" size={13} /> Creating…</> : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}

function ResultCard({ data, onReset }) {
  const paystack = !!data?.authorizationUrl;
  const provisioned = data?.provisioningStatus === "provisioned";
  const copy = () => navigator.clipboard?.writeText(data.authorizationUrl).catch(() => {});

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 space-y-4">
      <div className="flex items-center gap-2">
        {paystack || provisioned
          ? <FaCheckCircle className="text-emerald-500" size={18} />
          : <FaExclamationTriangle className="text-amber-500" size={18} />}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {paystack ? "Payment link ready" : provisioned ? "Account created" : "Order created"}
        </h2>
      </div>

      {paystack ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-slate-400">Share this Paystack link with the customer. The cPanel account is created automatically once they pay.</p>
          <div className="flex items-center gap-2">
            <input readOnly value={data.authorizationUrl} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-xs text-gray-700 dark:text-slate-300" />
            <button onClick={copy} type="button" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300"><FaCopy size={12} /></button>
            <a href={data.authorizationUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600">Open</a>
          </div>
        </div>
      ) : (
        <dl className="text-sm space-y-1.5">
          <Row label="Status" value={data?.status} />
          <Row label="Provisioning" value={data?.provisioningStatus} />
          {data?.cpanelUsername && <Row label="cPanel username" value={data.cpanelUsername} />}
          {data?.domain && <Row label="Domain" value={data.domain} />}
          {data?.provisioningError && <Row label="Error" value={data.provisioningError} danger />}
          {provisioned && <p className="text-xs text-emerald-600 dark:text-emerald-400 pt-1">Login credentials have been emailed to the customer.</p>}
          {data?.provisioningStatus === "skipped" && <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">This plan type doesn’t auto-provision cPanel — provision manually if needed.</p>}
        </dl>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onReset} type="button" className="px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600">Create another</button>
        <Link href="/dashboard/hosting" className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-sm font-semibold hover:border-gray-300">Done</Link>
      </div>
    </div>
  );
}

function Row({ label, value, danger }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-gray-500 dark:text-slate-400">{label}</dt>
      <dd className={`font-medium ${danger ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"} capitalize`}>{value || "—"}</dd>
    </div>
  );
}
