"use client";

import { useEffect, useState } from "react";
import { Store, Tags, Receipt, Truck, MapPin, Package, Plus, Trash2, Navigation, RefreshCw, AlertTriangle, Coins } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/queries/useSettings";
import {
  useShippingSettings, useUpdateShippingSettings,
  useShippingZones, useCreateShippingZone, useUpdateShippingZone, useDeleteShippingZone,
  useCourierRate, useUpdateCourierRate,
  useNeighborhoodDistances, useResolveDistances, useSetManualDistance,
  useAdminLocations,
} from "@/hooks/queries/useShippingAdmin";
import {
  Alert, Button, Card, Input, PageHeader,
  SectionCard, Skeleton, Switch,
} from "@/components/ui";
import NeighborhoodsSection from "@/components/admin/NeighborhoodsSection";
import PricingSection from "@/components/admin/PricingSection";

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
    <SectionCard
      icon={Store}
      title="Shop Profile"
      description="Identity and contact info shown in chat, SMS, and email."
      iconColor="bg-blue-600"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Shop name" required value={form.shopName} onChange={set("shopName")} />
          <Input label="Shop phone" type="tel" value={form.shopPhone} onChange={set("shopPhone")} />
          <Input
            label="WhatsApp"
            hint="Digits only, e.g. 233244388190"
            value={form.whatsapp}
            onChange={set("whatsapp")}
          />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          <Input label="Location" value={form.location} onChange={set("location")} />
          <Input label="Hours" value={form.hours} onChange={set("hours")} />
        </div>
        <Input
          label="Consultation booking path"
          value={form.consultationPath}
          onChange={set("consultationPath")}
          placeholder="/book-consultation"
        />
        <Alert tone={status.type || "info"}>{status.message}</Alert>
        <Button type="submit" loading={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving…" : "Save shop profile"}
        </Button>
      </form>
    </SectionCard>
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
    <SectionCard
      icon={Tags}
      title="Services & Pricing"
      description="Shown in chat pricing replies and quoted elsewhere in the app."
      iconColor="bg-purple-600"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {services.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
            {/* Row 1 shows the labels; the rest repeat them to screen readers only. */}
            <Input
              label="Service name"
              hideLabel={i > 0}
              value={s.name}
              onChange={(e) => updateRow(i, "name", e.target.value)}
              placeholder="Service name"
            />
            <Input
              label={`Price for service ${i + 1}`}
              hideLabel={i > 0}
              value={s.price}
              onChange={(e) => updateRow(i, "price", e.target.value)}
              placeholder="e.g. GHS 800/month"
            />
            <Input
              label={`Path for service ${i + 1}`}
              hideLabel={i > 0}
              value={s.path}
              onChange={(e) => updateRow(i, "path", e.target.value)}
              placeholder="/services/seo"
            />
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="px-2 text-error dark:text-error-dark"
              onClick={() => removeRow(i)}
              aria-label={`Remove ${s.name || `service ${i + 1}`}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="secondary" onClick={addRow}>
          <Plus size={14} aria-hidden="true" /> Add service
        </Button>
        <Alert tone={status.type || "info"}>{status.message}</Alert>
        <div>
          <Button type="submit" loading={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving…" : "Save services"}
          </Button>
        </div>
      </form>
    </SectionCard>
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
    <SectionCard
      icon={Receipt}
      title="Tax / VAT"
      description="Informational only — nothing here changes order totals or checkout math."
      iconColor="bg-amber-600"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-body-sm font-medium text-gray-900 dark:text-white">VAT registered</p>
            <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">Show VAT info below when enabled.</p>
          </div>
          <Switch
            checked={form.vatEnabled}
            onChange={(v) => setForm((f) => ({ ...f, vatEnabled: v }))}
            aria-label="VAT registered"
          />
        </div>

        {form.vatEnabled && (
          <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-slate-800">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="VAT rate (%)"
                type="number"
                min="0"
                step="0.1"
                value={form.vatRate}
                onChange={(e) => setForm((f) => ({ ...f, vatRate: e.target.value }))}
              />
              <Input
                label="VAT / TIN registration number"
                value={form.vatNumber}
                onChange={(e) => setForm((f) => ({ ...f, vatNumber: e.target.value }))}
                placeholder="C0123456789"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body-sm font-medium text-gray-900 dark:text-white">Quoted prices include VAT</p>
                <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                  Off means VAT is added on top of listed prices.
                </p>
              </div>
              <Switch
                checked={form.pricesIncludeVat}
                onChange={(v) => setForm((f) => ({ ...f, pricesIncludeVat: v }))}
                aria-label="Quoted prices include VAT"
              />
            </div>
          </div>
        )}

        <Alert tone={status.type || "info"}>{status.message}</Alert>
        <Button type="submit" loading={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving…" : "Save tax settings"}
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Shipping ────────────────────────────────────────────────────────────────

function formatFeeGhs(pesewas) {
  return `GH₵${(Number(pesewas || 0) / 100).toFixed(2)}`;
}

function ZoneRow({ zone, onEdit, onDelete, deleting, expanded, onToggle }) {
  const neighborhoods = zone.neighborhoods || [];
  return (
    <div className={`rounded-xl border ${zone.isActive ? "border-gray-200 dark:border-slate-700" : "border-gray-200 dark:border-slate-700 opacity-60"}`}>
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{zone.name}</p>
            {zone.code && <span className="text-xs text-gray-500 dark:text-slate-500 font-mono">{zone.code}</span>}
            {!zone.isActive && <span className="text-[10px] font-semibold rounded-full bg-gray-200 dark:bg-slate-700 px-2 py-0.5 text-gray-600 dark:text-slate-400">Inactive</span>}
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
            {zone.city} · {formatFeeGhs(zone.baseRate)} base · ~{zone.estimatedDays}d
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {neighborhoods.length > 0 && (
            <button
              type="button"
              onClick={() => onToggle(zone._id)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 transition"
            >
              {expanded ? "Hide" : `${neighborhoods.length} area${neighborhoods.length !== 1 ? "s" : ""}`}
            </button>
          )}
          <button type="button" onClick={() => onEdit(zone)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 transition">Edit</button>
          <button type="button" onClick={() => onDelete(zone)} disabled={deleting} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-50">
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>
      {expanded && neighborhoods.length > 0 && (
        <div className="border-t border-gray-100 dark:border-slate-800 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500 mb-1.5">Neighborhoods</p>
          <div className="flex flex-wrap gap-1.5">
            {neighborhoods.map((n) => (
              <span key={n} className="inline-block rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 capitalize">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NeighborhoodInput({ value, onChange }) {
  const [input, setInput] = useState("");
  const items = value || [];

  const add = () => {
    const name = input.trim().toLowerCase();
    if (name && !items.includes(name)) {
      onChange([...items, name]);
    }
    setInput("");
  };

  const remove = (name) => onChange(items.filter((n) => n !== name));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
    if (e.key === "Backspace" && !input && items.length) {
      onChange(items.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Neighborhoods</label>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((n) => (
            <span key={n} className="inline-flex items-center gap-1 rounded-full bg-brand-100 dark:bg-brand-500/20 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 capitalize">
              {n}
              <button type="button" onClick={() => remove(n)} className="ml-0.5 rounded-full hover:bg-brand-200 dark:hover:bg-brand-500/30 p-0.5 transition" aria-label={`Remove ${n}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 3l4 4M7 3l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        placeholder={items.length ? "Type and press Enter…" : "e.g. East Legon, Airport, Cantonments"}
        className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500"
      />
      <p className="mt-1 text-[10px] text-gray-500 dark:text-slate-500">Press Enter or comma to add. Backspace to remove last.</p>
    </div>
  );
}

function ZoneForm({ zone, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: zone?.name || "",
    code: zone?.code || "",
    city: zone?.city || "Accra",
    neighborhoods: zone?.neighborhoods || [],
    baseRate: zone?.baseRate != null ? (zone.baseRate / 100).toFixed(2) : "",
    perKgRate: zone?.perKgRate != null ? (zone.perKgRate / 100).toFixed(2) : "0",
    sameDayMultiplier: zone?.sameDayMultiplier ?? 1.2,
    expressMultiplier: zone?.expressMultiplier ?? 1.4,
    fragileSurcharge: zone?.fragileSurcharge != null ? (zone.fragileSurcharge / 100).toFixed(2) : "0",
    estimatedDays: zone?.estimatedDays ?? "",
    isDefault: zone?.isDefault ?? false,
    isActive: zone?.isActive ?? true,
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...(zone?._id && { id: zone._id }),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      city: form.city,
      neighborhoods: form.neighborhoods,
      baseRate: Math.round(Number(form.baseRate || 0) * 100),
      perKgRate: Math.round(Number(form.perKgRate || 0) * 100),
      sameDayMultiplier: Number(form.sameDayMultiplier) || 1.2,
      expressMultiplier: Number(form.expressMultiplier) || 1.4,
      fragileSurcharge: Math.round(Number(form.fragileSurcharge || 0) * 100),
      estimatedDays: parseInt(form.estimatedDays, 10) || 0,
      isDefault: form.isDefault,
      isActive: form.isActive,
    });
  };

  const inputCls = "w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500";

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-brand-200 dark:border-brand-500/30 bg-brand-50/50 dark:bg-brand-500/5 p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Zone name" required />
        <input className={inputCls} value={form.code} onChange={set("code")} placeholder="Code (e.g. ACC-CENTRAL)" required />
        <select className={inputCls} value={form.city} onChange={set("city")}>
          <option value="Accra">Accra</option>
          <option value="Tema">Tema</option>
        </select>
        <input className={inputCls} type="number" step="0.01" min="0" value={form.baseRate} onChange={set("baseRate")} placeholder="Base rate (GH₵)" required />
        <input className={inputCls} type="number" step="0.01" min="0" value={form.perKgRate} onChange={set("perKgRate")} placeholder="Per-kg rate (GH₵)" />
        <input className={inputCls} type="number" step="0.1" min="0" value={form.sameDayMultiplier} onChange={set("sameDayMultiplier")} placeholder="Same-day multiplier" />
        <input className={inputCls} type="number" step="0.1" min="0" value={form.expressMultiplier} onChange={set("expressMultiplier")} placeholder="Express multiplier" />
        <input className={inputCls} type="number" step="0.01" min="0" value={form.fragileSurcharge} onChange={set("fragileSurcharge")} placeholder="Fragile surcharge (GH₵)" />
        <input className={inputCls} type="number" min="0" value={form.estimatedDays} onChange={set("estimatedDays")} placeholder="Est. days" required />
      </div>
      <NeighborhoodInput value={form.neighborhoods} onChange={(n) => setForm((f) => ({ ...f, neighborhoods: n }))} />
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
          <input type="checkbox" checked={form.isDefault} onChange={set("isDefault")} className="h-3.5 w-3.5 rounded border-gray-300 accent-brand-500" />
          Default zone
        </label>
        <label className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
          <input type="checkbox" checked={form.isActive} onChange={set("isActive")} className="h-3.5 w-3.5 rounded border-gray-300 accent-brand-500" />
          Active
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCancel} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 transition">Cancel</button>
        <button type="submit" disabled={saving} className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60">
          {saving ? "Saving…" : zone?._id ? "Update zone" : "Create zone"}
        </button>
      </div>
    </form>
  );
}

function ZonesSection() {
  const zonesQ = useShippingZones();
  const createZone = useCreateShippingZone();
  const updateZone = useUpdateShippingZone();
  const deleteZone = useDeleteShippingZone();

  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const zones = zonesQ.data || [];
  const saving = createZone.isPending || updateZone.isPending;
  const deletingId = deleteZone.isPending ? deleteZone.variables : null;

  const handleSave = (data) => {
    const opts = {
      onSuccess: () => { setShowForm(false); setEditingZone(null); },
      onError: (err) => alert(err.message || "Save failed"),
    };
    if (data.id) {
      updateZone.mutate(data, opts);
    } else {
      createZone.mutate(data, opts);
    }
  };

  const handleDelete = (zone) => {
    if (!confirm(`Delete zone "${zone.name}"?`)) return;
    deleteZone.mutate(zone._id, { onError: (err) => alert(err.message || "Delete failed") });
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="border-t border-gray-200 dark:border-slate-800 pt-5 mt-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-body-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
            <MapPin size={14} /> Delivery Zones
          </p>
          <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
            {zones.length} zone{zones.length !== 1 ? "s" : ""} — defines where you deliver and the base rate per area.
          </p>
        </div>
        {!showForm && !editingZone && (
          <button
            type="button"
            onClick={() => { setShowForm(true); setEditingZone(null); }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
          >
            + Add zone
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-3">
          <ZoneForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
        </div>
      )}

      {zonesQ.isLoading ? (
        <div className="py-6 text-center text-sm text-gray-500 dark:text-slate-400">Loading zones…</div>
      ) : zones.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500 dark:text-slate-400">No zones yet. Add one above.</div>
      ) : (
        <div className="space-y-2">
          {zones.map((z) =>
            editingZone?._id === z._id ? (
              <ZoneForm key={z._id} zone={z} onSave={handleSave} onCancel={() => setEditingZone(null)} saving={saving} />
            ) : (
              <ZoneRow
                key={z._id}
                zone={z}
                expanded={expandedId === z._id}
                onToggle={toggleExpand}
                onEdit={(zone) => { setEditingZone(zone); setShowForm(false); }}
                onDelete={handleDelete}
                deleting={deletingId === z._id}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}


// ─── Neighbourhood distances (Google Maps) ───────────────────────────────────
//
// The admin picks a city, sees every neighbourhood with its measured driving
// distance from the origin, and resolves the gaps. Google is called ONLY here —
// checkout reads the stored numbers, so a Maps outage never blocks an order.

function DistanceRow({ row, city, region, onManual, saving }) {
  const [editing, setEditing] = useState(false);
  const [km, setKm] = useState(row.distanceKm ?? "");

  const save = () => {
    const value = Number(km);
    if (!Number.isFinite(value) || value < 0) return;
    onManual({ region, city, neighborhood: row.neighborhood, distanceKm: value });
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 dark:border-slate-700">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium capitalize text-gray-900 dark:text-white">
          {row.neighborhood}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
          {row.distanceKm == null ? (
            <span className="text-amber-600 dark:text-amber-500">Not measured</span>
          ) : (
            <>
              <span>{row.distanceKm} km</span>
              {row.durationMins != null && <span>· ~{row.durationMins} min</span>}
              {row.source === "manual" && (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                  Manual
                </span>
              )}
              {row.stale && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                  <AlertTriangle size={11} /> Origin changed
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {editing ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <input
            type="number"
            min="0"
            step="0.1"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            aria-label={`Distance in km for ${row.neighborhood}`}
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-brand-500 dark:text-gray-900"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:border-slate-700 dark:text-slate-400"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setKm(row.distanceKm ?? ""); setEditing(true); }}
          className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500"
        >
          Set manually
        </button>
      )}
    </div>
  );
}

function DistancesSection({ originAddress, useGoogleDistance }) {
  const locationsQ = useAdminLocations();
  const locations = locationsQ.data ?? [];
  const [selected, setSelected] = useState("");

  const current = locations.find((l) => `${l.region}|${l.city}` === selected) || null;
  const distancesQ = useNeighborhoodDistances(current?.region, current?.city);
  const resolve = useResolveDistances();
  const setManual = useSetManualDistance();
  const [status, setStatus] = useState({ type: "", message: "" });

  const rows = distancesQ.data?.data ?? [];
  const meta = distancesQ.data?.meta ?? {};
  const unmeasured = rows.filter((r) => r.distanceKm == null).length;

  const handleResolve = (force) => {
    setStatus({ type: "", message: "" });
    resolve.mutate(
      { region: current.region, city: current.city, force },
      {
        onSuccess: (res) => {
          const m = res?.meta ?? {};
          setStatus({
            type: m.failed ? "warning" : "success",
            message:
              `Measured ${m.resolved ?? 0} neighbourhood(s).` +
              (m.skipped ? ` ${m.skipped} already measured.` : "") +
              (m.failed ? ` ${m.failed} could not be found — set those manually.` : ""),
          });
        },
        onError: (err) => setStatus({ type: "error", message: err.message || "Lookup failed." }),
      },
    );
  };

  const handleManual = (body) => {
    setStatus({ type: "", message: "" });
    setManual.mutate(body, {
      onSuccess: () => setStatus({ type: "success", message: "Distance saved." }),
      onError: (err) => setStatus({ type: "error", message: err.message || "Failed to save." }),
    });
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-5 dark:border-slate-800">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-body-sm font-semibold text-gray-900 dark:text-white">
            <Navigation size={14} /> Neighbourhood distances
          </p>
          <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
            Driving distance from your origin, measured once per neighbourhood and reused at checkout.
          </p>
        </div>
      </div>

      {!originAddress && (
        <Alert tone="warning">
          Set an origin address above and save before measuring distances.
        </Alert>
      )}
      {originAddress && !useGoogleDistance && (
        <Alert tone="info">
          Distance pricing is off, so these numbers are stored but not used. Turn on
          “Price by measured distance” above to apply them.
        </Alert>
      )}

      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="mb-1 block text-caption font-medium text-gray-700 dark:text-slate-300">City</span>
          <select
            value={selected}
            onChange={(e) => { setSelected(e.target.value); setStatus({ type: "", message: "" }); }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select a city…</option>
            {locations.map((l) => (
              <option key={`${l.region}|${l.city}`} value={`${l.region}|${l.city}`}>
                {l.city} — {l.region}
              </option>
            ))}
          </select>
        </label>

        {current && distancesQ.isLoading && <Skeleton className="h-24 w-full" />}

        {current && !distancesQ.isLoading && rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-slate-500">
            No neighbourhoods for {current.city} yet. Add them to the city first.
          </p>
        )}

        {current && rows.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-caption text-gray-600 dark:text-slate-400">
                {meta.resolved ?? 0} of {meta.total ?? rows.length} measured
                {unmeasured > 0 && ` · ${unmeasured} missing`}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleResolve(false)}
                  disabled={resolve.isPending || !meta.googleConfigured || !originAddress}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50 dark:bg-brand-500 dark:text-gray-900"
                >
                  <RefreshCw size={12} className={resolve.isPending ? "animate-spin" : ""} />
                  {resolve.isPending ? "Measuring…" : "Measure missing"}
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(true)}
                  disabled={resolve.isPending || !meta.googleConfigured || !originAddress}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-gray-400 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500"
                  title="Re-measure every neighbourhood, including manual overrides"
                >
                  Re-measure all
                </button>
              </div>
            </div>

            {!meta.googleConfigured && (
              <Alert tone="warning">
                No Google Maps key is configured on the server, so distances can only be set manually.
              </Alert>
            )}

            {status.message && <Alert tone={status.type || "info"}>{status.message}</Alert>}

            <div className="space-y-1.5">
              {rows.map((row) => (
                <DistanceRow
                  key={row.neighborhood}
                  row={row}
                  city={current.city}
                  region={current.region}
                  onManual={handleManual}
                  saving={setManual.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ShippingSection() {
  const shippingQ = useShippingSettings();
  const updateSettings = useUpdateShippingSettings();
  const courierQ = useCourierRate();
  const updateCourierRate = useUpdateCourierRate();

  const [form, setForm] = useState(null);
  const [courierForm, setCourierForm] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [courierStatus, setCourierStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    const s = shippingQ.data;
    if (!s) return;
    setForm({
      inHouseDeliveryAvailable: !!s.inHouseDeliveryAvailable,
      courierDispatchAvailable: !!s.courierDispatchAvailable,
      expressAvailable: !!s.expressAvailable,
      sameDayAvailable: !!s.sameDayAvailable,
      freeDeliveryThreshold: s.freeDeliveryThreshold ?? "",
      inHouseRadiusKm: s.inHouseRadiusKm ?? "",
      expressSurcharge: s.expressSurcharge ?? 0,
      originAddress: s.originAddress ?? "",
      useGoogleDistance: !!s.useGoogleDistance,
    });
  }, [shippingQ.data]);

  useEffect(() => {
    const c = courierQ.data;
    if (!c) return;
    setCourierForm({
      mode: c.mode || "percentage",
      percentage: c.percentage ?? 30,
      flatAmount: c.flatAmount ?? 0,
      isActive: c.isActive !== false,
    });
  }, [courierQ.data]);

  const handleSettingsSave = (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    const payload = {
      inHouseDeliveryAvailable: form.inHouseDeliveryAvailable,
      courierDispatchAvailable: form.courierDispatchAvailable,
      expressAvailable: form.expressAvailable,
      sameDayAvailable: form.sameDayAvailable,
      freeDeliveryThreshold: form.freeDeliveryThreshold === "" || form.freeDeliveryThreshold === null
        ? null
        : Math.max(0, Math.round(Number(form.freeDeliveryThreshold) * 100)),
      inHouseRadiusKm: form.inHouseRadiusKm === "" || form.inHouseRadiusKm === null
        ? null
        : Number(form.inHouseRadiusKm),
      expressSurcharge: Math.max(0, Math.round(Number(form.expressSurcharge) * 100)),
      // Distance pricing. originAddress is free text — Google geocodes it.
      originAddress: String(form.originAddress || "").trim(),
      useGoogleDistance: !!form.useGoogleDistance,
    };
    updateSettings.mutate(payload, {
      onSuccess: () => setStatus({ type: "success", message: "Shipping settings saved." }),
      onError: (err) => setStatus({ type: "error", message: err.message || "Failed to save." }),
    });
  };

  const handleCourierSave = (e) => {
    e.preventDefault();
    setCourierStatus({ type: "", message: "" });
    updateCourierRate.mutate(
      {
        mode: courierForm.mode,
        percentage: courierForm.mode === "percentage" ? Number(courierForm.percentage) : undefined,
        flatAmount: courierForm.mode === "flat" ? Math.round(Number(courierForm.flatAmount) * 100) : undefined,
        isActive: courierForm.isActive,
      },
      {
        onSuccess: () => setCourierStatus({ type: "success", message: "Courier payout saved." }),
        onError: (err) => setCourierStatus({ type: "error", message: err.message || "Failed to save." }),
      },
    );
  };

  if (shippingQ.isLoading) {
    return (
      <SectionCard icon={Truck} title="Shipping" description="Loading..." iconColor="bg-emerald-600">
        <Skeleton className="h-40 w-full" />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={Truck}
      title="Shipping & Delivery"
      description="Configure delivery methods, free delivery threshold, zones, and courier payout."
      iconColor="bg-emerald-600"
    >
      {/* ── Method Toggles ── */}
      <form onSubmit={handleSettingsSave} className="space-y-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-sm font-medium text-gray-900 dark:text-white">In-House Delivery</p>
              <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                Own rider delivers within the set radius. Always free.
              </p>
            </div>
            <Switch
              checked={form?.inHouseDeliveryAvailable ?? true}
              onChange={(v) => setForm((f) => ({ ...f, inHouseDeliveryAvailable: v }))}
              aria-label="In-house delivery available"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-sm font-medium text-gray-900 dark:text-white">Courier Dispatch</p>
              <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                Third-party courier (standard, same-day, express).
              </p>
            </div>
            <Switch
              checked={form?.courierDispatchAvailable ?? false}
              onChange={(v) => setForm((f) => ({ ...f, courierDispatchAvailable: v }))}
              aria-label="Courier dispatch available"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-sm font-medium text-gray-900 dark:text-white">Express Delivery</p>
              <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                Allow express speed option for courier dispatch.
              </p>
            </div>
            <Switch
              checked={form?.expressAvailable ?? true}
              onChange={(v) => setForm((f) => ({ ...f, expressAvailable: v }))}
              aria-label="Express delivery available"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-sm font-medium text-gray-900 dark:text-white">Same-Day Delivery</p>
              <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                Off — checkout does not offer Courier — Same Day. Turning it on also
                applies the cutoff hour and closed days below.
              </p>
            </div>
            <Switch
              checked={form?.sameDayAvailable ?? false}
              onChange={(v) => setForm((f) => ({ ...f, sameDayAvailable: v }))}
              aria-label="Same-day delivery available"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 border-t border-gray-200 dark:border-slate-800 pt-4">
          <Input
            label="Free delivery threshold (GH₵)"
            hint="Orders above this get free delivery. Blank = disabled."
            type="number"
            min="0"
            step="1"
            value={form?.freeDeliveryThreshold ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, freeDeliveryThreshold: e.target.value }))}
            placeholder="e.g. 500"
          />
          <Input
            label="In-house radius (km)"
            hint="Max km rider covers. Blank = unlimited."
            type="number"
            min="0"
            step="0.1"
            value={form?.inHouseRadiusKm ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, inHouseRadiusKm: e.target.value }))}
            placeholder="e.g. 15"
          />
          <Input
            label="Express surcharge (GH₵)"
            hint="Flat surcharge added on top of speed multiplier."
            type="number"
            min="0"
            step="0.01"
            value={form?.expressSurcharge ?? 0}
            onChange={(e) => setForm((f) => ({ ...f, expressSurcharge: e.target.value }))}
          />
        </div>

        {/* ── Distance pricing ── */}
        <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-body-sm font-medium text-gray-900 dark:text-white">
                Price by measured distance
              </p>
              <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                Use each neighbourhood&apos;s Google driving distance instead of the zone&apos;s
                distance band. Neighbourhoods without a measured distance fall back to the band.
              </p>
            </div>
            <Switch
              checked={form?.useGoogleDistance ?? false}
              onChange={(v) => setForm((f) => ({ ...f, useGoogleDistance: v }))}
              aria-label="Price by measured distance"
            />
          </div>

          <Input
            label="Origin address"
            hint="Where deliveries start — your warehouse. Distances are measured from here; changing it marks every stored distance for re-measuring."
            value={form?.originAddress ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, originAddress: e.target.value }))}
            placeholder="e.g. Nima Market, Accra, Ghana"
          />
        </div>

        <Alert tone={status.type || "info"}>{status.message}</Alert>
        <Button type="submit" loading={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving…" : "Save shipping settings"}
        </Button>
      </form>

      <NeighborhoodsSection />

      <DistancesSection
        originAddress={form?.originAddress ?? ""}
        useGoogleDistance={form?.useGoogleDistance ?? false}
      />

      <ZonesSection />

      {/* ── Courier Payout ── */}
      {courierForm && (
        <div className="border-t border-gray-200 dark:border-slate-800 pt-5 mt-5">
          <p className="text-body-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mb-3">
            <Package size={14} /> Courier Payout
          </p>
          <form onSubmit={handleCourierSave} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body-sm font-medium text-gray-900 dark:text-white">Active</p>
                <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                  Enable courier payout settlement on delivery.
                </p>
              </div>
              <Switch
                checked={courierForm.isActive}
                onChange={(v) => setCourierForm((f) => ({ ...f, isActive: v }))}
                aria-label="Courier payout active"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-slate-300">Payout mode</label>
                <select
                  value={courierForm.mode}
                  onChange={(e) => setCourierForm((f) => ({ ...f, mode: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white"
                >
                  <option value="percentage">Percentage of shipping fee</option>
                  <option value="flat">Flat amount per delivery</option>
                </select>
              </div>
              {courierForm.mode === "percentage" ? (
                <Input
                  label="Payout percentage (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={courierForm.percentage}
                  onChange={(e) => setCourierForm((f) => ({ ...f, percentage: e.target.value }))}
                />
              ) : (
                <Input
                  label="Flat payout (GH₵)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={(Number(courierForm.flatAmount) / 100).toFixed(2)}
                  onChange={(e) => setCourierForm((f) => ({ ...f, flatAmount: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                />
              )}
            </div>

            <Alert tone={courierStatus.type || "info"}>{courierStatus.message}</Alert>
            <Button type="submit" loading={updateCourierRate.isPending}>
              {updateCourierRate.isPending ? "Saving…" : "Save courier payout"}
            </Button>
          </form>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: "profile", label: "Shop Profile", icon: Store },
  { key: "services", label: "Services", icon: Tags },
  { key: "tax", label: "Tax / VAT", icon: Receipt },
  { key: "shipping", label: "Shipping", icon: Truck },
  // Owner request 2026-08-31. Here rather than on the domain page because the
  // exchange rate reprices hosting as well as domains.
  { key: "pricing", label: "Pricing", icon: Coins },
];

export default function BusinessSettingsPage() {
  const settingsQ = useSettings();
  const business = settingsQ.data?.business;
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pb-20 pt-6 sm:px-6">
      <PageHeader
        title="Business Settings"
        description="Shop identity, services, tax, and shipping config used across chat, checkout, and the site."
      />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                active
                  ? "bg-gray-900 text-white dark:bg-brand-500 dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {settingsQ.isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} padding="none">
              <Skeleton className="h-40 w-full rounded-2xl" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {activeTab === "profile" && <ShopProfileSection business={business} />}
          {activeTab === "services" && <ServicesSection business={business} />}
          {activeTab === "tax" && <TaxSection business={business} />}
          {activeTab === "shipping" && <ShippingSection />}
          {activeTab === "pricing" && <PricingSection />}
        </>
      )}
    </div>
  );
}
