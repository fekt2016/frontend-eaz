"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SHARED_PLANS } from "@/data/hostingHostingData";
import PageLoadingFallback from "@/components/common/PageLoadingFallback";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white";

const ADDONS = [
  { id: "ssl", name: "SSL Certificate Upgrade", price: 0 },
  { id: "backups", name: "Daily Backups (30 days)", price: 15 },
  { id: "dedicated-ip", name: "Dedicated IP Address", price: 25 },
  { id: "priority", name: "Priority Support", price: 35 },
  { id: "domain-privacy", name: "Domain Privacy Protection", price: 10 },
];

const TIER_TO_NAME = { deluxe: "Deluxe", professional: "Professional", enterprise: "Enterprise", ultimate: "Ultimate" };

function StepIndicator({ step }) {
  const steps = ["Plan Summary", "Your Details", "Payment"];
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
            i + 1 < step ? "bg-gray-900 text-white" : i + 1 === step ? "border-2 border-gray-900 text-gray-900" : "border border-gray-200 text-gray-400"
          }`}>
            {i + 1 < step ? "✓" : i + 1}
          </div>
          <span className={`ml-2 hidden text-sm sm:inline ${i + 1 <= step ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
          {i < steps.length - 1 && <span className="mx-2 h-px w-6 bg-gray-200 sm:w-12" />}
        </div>
      ))}
    </div>
  );
}

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
  const plan = SHARED_PLANS.find((p) => p.name === planName) || SHARED_PLANS[0];
  const addonsTotal = addons.reduce((sum, id) => sum + (ADDONS.find((a) => a.id === id)?.price ?? 0), 0);
  const basePrice = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const saving = plan.monthlyPrice * 12 - plan.annualPrice;
  const total = basePrice + addonsTotal;

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
        ...(domain && { domain }),
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
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-4xl">
        <Link href="/hosting" className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to Hosting
        </Link>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-500 text-sm mb-8">Complete your hosting order</p>

        <StepIndicator step={step} />

        <div className="grid gap-8 lg:grid-cols-[1fr,320px]">
          <div className="space-y-6">

            {/* STEP 1 — Plan + Add-ons */}
            {step === 1 && (
              <>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="font-display text-xl font-semibold text-gray-900 mb-2">Plan Summary</h2>
                  <p className="text-sm text-gray-500 mb-4">{plan.name} · {billingCycle === "annual" ? "Billed annually" : "Monthly"}</p>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-amber-500">GH₵ {billingCycle === "annual" ? plan.annualPrice : `${plan.monthlyPrice}.00`}</span>
                    <span className="text-xs text-gray-400">{billingCycle === "annual" ? "/yr" : "/mo"}</span>
                  </div>
                  {billingCycle === "annual" && <p className="text-xs text-emerald-600 font-medium mb-4">Save GH₵ {saving}</p>}
                  <ul className="space-y-1 text-sm text-gray-500 mb-6">
                    {plan.features.slice(0, 6).map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-amber-500">✓</span>
                        {/^free\s+/i.test(f) ? <span><span className="text-amber-500 font-bold">FREE</span> {f.replace(/^free\s+/i, "")}</span> : <span>{f}</span>}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
                    <button type="button" onClick={() => setBillingCycle("monthly")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Monthly</button>
                    <button type="button" onClick={() => setBillingCycle("annual")} className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${billingCycle === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Annual (Save GH₵ {saving})</button>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Add-ons</h2>
                  <ul className="space-y-3">
                    {ADDONS.map((a) => (
                      <label key={a.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-white p-3 hover:border-amber-200 transition">
                        <span className="flex items-center gap-3">
                          <input type="checkbox" checked={addons.includes(a.id)} onChange={() => toggleAddon(a.id)} className="rounded border-gray-300 accent-gray-900" />
                          <span className="text-sm text-gray-700">{a.name}</span>
                        </span>
                        <span className="text-sm text-gray-400">{a.price === 0 ? "Free" : `+GH₵${a.price}/mo`}</span>
                      </label>
                    ))}
                  </ul>
                </div>
                <button type="button" onClick={() => setStep(2)} className="w-full rounded-full bg-gray-900 py-3 font-semibold text-white hover:bg-gray-700 transition">Continue to Details</button>
              </>
            )}

            {/* STEP 2 — Customer Details */}
            {step === 2 && (
              <>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="font-display text-xl font-semibold text-gray-900 mb-4">Your Details</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">Full Name *</label>
                      <input type="text" value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))} placeholder="Your name" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">Email *</label>
                      <input type="email" value={customer.email} onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))} placeholder="you@example.com" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">Phone *</label>
                      <input type="tel" value={customer.phone} onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))} placeholder="+233 XX XXX XXXX" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">Domain name <span className="text-gray-400">(optional — add later)</span></label>
                      <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourbusiness.com" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">Address</label>
                      <input type="text" value={customer.address} onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))} placeholder="Street address" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">City</label>
                      <input type="text" value={customer.city} onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))} placeholder="Accra" className={inputCls} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-400 transition">Back</button>
                  <button type="button" onClick={() => { if (!customer.name || !customer.email || !customer.phone) { setError("Please fill in name, email, and phone."); return; } setError(""); setStep(3); }} className="flex-1 rounded-full bg-gray-900 py-3 font-semibold text-white hover:bg-gray-700 transition">Continue to Payment</button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
              </>
            )}

            {/* STEP 3 — Payment */}
            {step === 3 && (
              <>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <h2 className="font-display text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                      { id: "paystack_card", icon: "💳", title: "Pay with Card", desc: "Visa, Mastercard via Paystack" },
                      { id: "mobile_money", icon: "📱", title: "Mobile Money", desc: "MTN MoMo or Vodafone Cash" },
                      { id: "bank_transfer", icon: "🏦", title: "Bank Transfer", desc: "Manual bank transfer — activate within 2–4 hrs" },
                    ].map((m) => (
                      <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                        className={`w-full rounded-xl border p-4 text-left transition ${paymentMethod === m.id ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                        <span className="text-2xl">{m.icon}</span>
                        <div className="mt-2 font-semibold text-gray-900">{m.title}</div>
                        <div className="text-sm text-gray-500">{m.desc}</div>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "mobile_money" && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">Mobile Money Number</label>
                        <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="0240000000" className={inputCls} />
                      </div>
                      <div className="flex gap-2">
                        {["mtn", "vod"].map((n) => (
                          <button key={n} type="button" onClick={() => setNetwork(n)}
                            className={`flex-1 rounded-xl border py-2 text-sm font-medium transition ${network === n ? "border-amber-300 bg-amber-50 text-amber-700" : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"}`}>
                            {n === "mtn" ? "MTN MoMo" : "Vodafone Cash"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-400 transition">Back</button>
                  <button type="button" onClick={handlePlaceOrder} disabled={loading} className="flex-1 rounded-full bg-gray-900 py-3 font-semibold text-white hover:bg-gray-700 transition disabled:opacity-60">
                    {loading ? "Processing..." : paymentMethod === "bank_transfer" ? "Place Order — Pay via Bank Transfer" : `Pay GH₵ ${total} Securely`}
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-gray-400">
                  <span>🔒 256-bit SSL Secured</span>
                  <span>✓ Instant Activation (card/MM)</span>
                  <span>📋 Invoice Emailed</span>
                  <span>🔄 30-day Money Back</span>
                </div>
              </>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="text-gray-900">{plan.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Billing</span><span className="text-gray-900">{billingCycle === "annual" ? "Annual" : "Monthly"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">GH₵ {basePrice}{billingCycle === "annual" ? "/yr" : "/mo"}</span></div>
                {addonsTotal > 0 && <div className="flex justify-between"><span className="text-gray-500">Add-ons</span><span className="text-gray-900">GH₵ {addonsTotal}</span></div>}
                <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-base">
                  <span className="text-gray-900">Total</span>
                  <span className="text-amber-500">GH₵ {total}</span>
                </div>
              </div>
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
