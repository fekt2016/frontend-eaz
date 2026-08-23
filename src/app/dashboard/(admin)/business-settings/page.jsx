"use client";

import { useEffect, useState } from "react";
import { Store, Tags, Receipt, Loader2, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/queries/useSettings";

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition";
const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5";

function Alert({ type, message }) {
  if (!message) return null;
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
      type === "success"
        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
        : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40"
    }`}>
      {type === "success" ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {message}
    </div>
  );
}

function Card({ icon: Icon, title, description, iconColor, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
          <Icon size={15} className="text-white" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

// ─── Shop Profile ──────────────────────────────────────────────────────────

function ShopProfileSection({ business }) {
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!business) return;
    setForm({
      shopName: business.shopName || "",
      shopPhone: business.shopPhone || "",
      whatsapp: business.whatsapp || "",
      email: business.email || "",
      location: business.location || "",
      hours: business.hours || "",
      consultationPath: business.consultationPath || "",
    });
  }, [business]);

  if (!form) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    updateSettings.mutate(
      { business: form },
      {
        onSuccess: () => setStatus({ type: "success", message: "Shop profile saved." }),
        onError: (err) => setStatus({ type: "error", message: err.message || "Failed to save." }),
      }
    );
  };

  return (
    <Card icon={Store} title="Shop Profile" description="Identity and contact info shown in chat, SMS, and email." iconColor="bg-blue-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Shop name</label>
            <input value={form.shopName} onChange={set("shopName")} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Shop phone</label>
            <input value={form.shopPhone} onChange={set("shopPhone")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>WhatsApp (digits only, e.g. 233244388190)</label>
            <input value={form.whatsapp} onChange={set("whatsapp")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={set("email")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input value={form.location} onChange={set("location")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Hours</label>
            <input value={form.hours} onChange={set("hours")} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Consultation booking path</label>
          <input value={form.consultationPath} onChange={set("consultationPath")} className={inputCls} placeholder="/book-consultation" />
        </div>
        <Alert type={status.type} message={status.message} />
        <button type="submit" disabled={updateSettings.isPending}
          className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
          {updateSettings.isPending && <Loader2 className="animate-spin" size={12} />}
          {updateSettings.isPending ? "Saving…" : "Save shop profile"}
        </button>
      </form>
    </Card>
  );
}

// ─── Services & Pricing ─────────────────────────────────────────────────────

function ServicesSection({ business }) {
  const updateSettings = useUpdateSettings();
  const [services, setServices] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (business?.services) setServices(business.services.map((s) => ({ ...s })));
  }, [business]);

  if (!services) return null;

  const updateRow = (i, field, value) =>
    setServices((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const removeRow = (i) => setServices((rows) => rows.filter((_, idx) => idx !== i));
  const addRow = () => setServices((rows) => [...rows, { name: "", price: "", path: "" }]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    const cleaned = services.filter((s) => s.name.trim() && s.price.trim() && s.path.trim());
    updateSettings.mutate(
      { business: { services: cleaned } },
      {
        onSuccess: () => { setServices(cleaned.map((s) => ({ ...s }))); setStatus({ type: "success", message: "Services saved." }); },
        onError: (err) => setStatus({ type: "error", message: err.message || "Failed to save." }),
      }
    );
  };

  return (
    <Card icon={Tags} title="Services & Pricing" description="Shown in chat pricing replies and quoted elsewhere in the app." iconColor="bg-purple-500">
      <form onSubmit={handleSubmit} className="space-y-3">
        {services.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
            <input value={s.name} onChange={(e) => updateRow(i, "name", e.target.value)} placeholder="Service name" className={inputCls} />
            <input value={s.price} onChange={(e) => updateRow(i, "price", e.target.value)} placeholder="e.g. GHS 800/month" className={inputCls} />
            <input value={s.path} onChange={(e) => updateRow(i, "path", e.target.value)} placeholder="/services/seo" className={inputCls} />
            <button type="button" onClick={() => removeRow(i)} className="text-gray-500 hover:text-red-500 transition p-2" aria-label="Remove service">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition">
          <Plus size={9} /> Add service
        </button>
        <Alert type={status.type} message={status.message} />
        <div>
          <button type="submit" disabled={updateSettings.isPending}
            className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
            {updateSettings.isPending && <Loader2 className="animate-spin" size={12} />}
            {updateSettings.isPending ? "Saving…" : "Save services"}
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Tax / VAT ───────────────────────────────────────────────────────────────

function TaxSection({ business }) {
  const updateSettings = useUpdateSettings();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!business) return;
    setForm({
      vatEnabled: !!business.vatEnabled,
      vatRate: business.vatRate ?? 0,
      vatNumber: business.vatNumber || "",
      pricesIncludeVat: business.pricesIncludeVat !== false,
    });
  }, [business]);

  if (!form) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    updateSettings.mutate(
      { business: { ...form, vatRate: Math.min(100, Math.max(0, Number(form.vatRate) || 0)) } },
      {
        onSuccess: () => setStatus({ type: "success", message: "Tax settings saved." }),
        onError: (err) => setStatus({ type: "error", message: err.message || "Failed to save." }),
      }
    );
  };

  return (
    <Card icon={Receipt} title="Tax / VAT" description="Informational only — nothing here changes order totals or checkout math." iconColor="bg-amber-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">VAT registered</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Show VAT info below when enabled.</p>
          </div>
          <Toggle checked={form.vatEnabled} onChange={(v) => setForm((f) => ({ ...f, vatEnabled: v }))} label="Toggle VAT registered" />
        </div>

        {form.vatEnabled && (
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>VAT rate (%)</label>
                <input
                  type="number" min="0" step="0.1"
                  value={form.vatRate}
                  onChange={(e) => setForm((f) => ({ ...f, vatRate: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>VAT / TIN registration number</label>
                <input
                  value={form.vatNumber}
                  onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))}
                  placeholder="C0123456789"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Quoted prices include VAT</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Off means VAT is added on top of listed prices.</p>
              </div>
              <Toggle checked={form.pricesIncludeVat} onChange={(v) => setForm((f) => ({ ...f, pricesIncludeVat: v }))} label="Toggle prices include VAT" />
            </div>
          </div>
        )}

        <Alert type={status.type} message={status.message} />
        <button type="submit" disabled={updateSettings.isPending}
          className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
          {updateSettings.isPending && <Loader2 className="animate-spin" size={12} />}
          {updateSettings.isPending ? "Saving…" : "Save tax settings"}
        </button>
      </form>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BusinessSettingsPage() {
  const settingsQ = useSettings();
  const business = settingsQ.data?.business;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-20 space-y-5">
      <div>
        <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">Business Settings</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
          Shop identity, services, and tax info used across chat, notifications, and the site.
        </p>
      </div>

      {settingsQ.isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <ShopProfileSection business={business} />
          <ServicesSection business={business} />
          <TaxSection business={business} />
        </>
      )}
    </div>
  );
}
