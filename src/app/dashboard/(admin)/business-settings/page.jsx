"use client";

import { useEffect, useState } from "react";
import { Store, Tags, Receipt, Plus, Trash2 } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/queries/useSettings";
import {
  Alert, Button, Card, Input, PageHeader,
  SectionCard, Skeleton, Switch,
} from "@/components/ui";

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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BusinessSettingsPage() {
  const settingsQ = useSettings();
  const business = settingsQ.data?.business;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pb-20 pt-6 sm:px-6">
      <PageHeader
        title="Business Settings"
        description="Shop identity, services, and tax info used across chat, notifications, and the site."
      />

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
          <ShopProfileSection business={business} />
          <ServicesSection business={business} />
          <TaxSection business={business} />
        </>
      )}
    </div>
  );
}
