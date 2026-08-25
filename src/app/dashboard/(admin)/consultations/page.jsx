"use client";

import { useEffect, useState, useCallback, useId } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  RotateCw, Trash2, ChevronDown, Mail, Phone, Building,
  CalendarDays, Target, MessageCircle, Inbox,
} from "lucide-react";
import { isAdminRole } from "@/lib/roles";
import {
  Badge, Button, Card, ConfirmDialog, EmptyState,
  PageHeader, Skeleton, Textarea,
} from "@/components/ui";

/*
 * Four statuses onto the measured tones. The old map's `archived` was
 * gray-500 on gray-100 (3.9:1) and every pill carried a hand-picked border.
 */
const STATUS_CONFIG = {
  new:      { label: "New",      tone: "brand" },
  read:     { label: "Read",     tone: "info" },
  replied:  { label: "Replied",  tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
};

const STATUS_KEYS = Object.keys(STATUS_CONFIG);

const TYPE_FILTERS = [
  { value: "consultation", label: "Consultations" },
  { value: "general",      label: "General" },
  { value: "all",          label: "All Types" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  ...STATUS_KEYS.map((k) => ({ value: k, label: STATUS_CONFIG[k].label })),
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ConsultationCard({ item, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState(item.adminNote || "");
  const [savingNote, setSavingNote] = useState(false);
  const panelId = `consult-${useId()}`;

  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;

  const handleStatus = async (status) => {
    setUpdating(true);
    await onStatusChange(item._id, { status });
    setUpdating(false);
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    await onStatusChange(item._id, { adminNote: note });
    setSavingNote(false);
  };

  return (
    <Card
      padding="none"
      className={`overflow-hidden ${item.status === "new" ? "border-brand-200 dark:border-brand-800/40" : ""}`}
    >
      {/* The header used to be a <div onClick> — invisible to the keyboard. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-paper dark:hover:bg-slate-800/50"
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-body-sm font-bold text-brand-ink dark:bg-brand-900/30 dark:text-brand-400">
            {item.name?.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block text-body-sm font-semibold leading-tight text-gray-900 dark:text-white">{item.name}</span>
            <span className="mt-0.5 block truncate text-caption text-gray-600 dark:text-slate-400">{item.email}</span>
            {item.service && (
              <span className="mt-1 flex items-center gap-1.5 text-caption font-medium text-brand-ink dark:text-brand-400">
                <Target size={12} aria-hidden="true" /> {item.service}
              </span>
            )}
          </span>
        </span>
        <span className="flex flex-shrink-0 items-center gap-2">
          <Badge tone={cfg.tone}>{cfg.label}</Badge>
          <span className="hidden whitespace-nowrap text-caption text-gray-600 dark:text-slate-400 sm:block">
            {fmtDate(item.createdAt)}
          </span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`text-gray-600 transition-transform dark:text-slate-400 ${expanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {expanded && (
        <div id={panelId} className="border-t border-gray-100 px-5 pb-5 dark:border-slate-800">
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-4 text-caption text-gray-600 dark:text-slate-400">
              <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 transition-colors hover:text-brand-ink dark:hover:text-brand-400">
                <Mail size={13} aria-hidden="true" /> {item.email}
              </a>
              {item.phone && (
                <a href={`tel:${item.phone}`} className="flex items-center gap-1.5 transition-colors hover:text-brand-ink dark:hover:text-brand-400">
                  <Phone size={13} aria-hidden="true" /> {item.phone}
                </a>
              )}
              {item.businessName && (
                <span className="flex items-center gap-1.5">
                  <Building size={13} aria-hidden="true" /> {item.businessName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} aria-hidden="true" /> {fmtDate(item.createdAt)}
              </span>
            </div>

            {item.message && (
              <div className="rounded-xl bg-paper p-4 dark:bg-slate-800">
                <p className="mb-1.5 font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">Message</p>
                <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-gray-700 dark:text-slate-300">{item.message}</p>
              </div>
            )}

            <div>
              <Textarea
                label="Admin note"
                hint="Private — only staff see this."
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a private note…"
              />
              <Button size="sm" variant="secondary" className="mt-2" onClick={handleSaveNote} loading={savingNote}>
                {savingNote ? "Saving…" : "Save note"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Set status">
                {STATUS_KEYS.map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={item.status === key ? "primary" : "secondary"}
                    aria-pressed={item.status === key}
                    disabled={updating || item.status === key}
                    onClick={() => handleStatus(key)}
                  >
                    {STATUS_CONFIG[key].label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="brand"
                  href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || "Your Consultation Request")}`}
                >
                  <Mail size={14} aria-hidden="true" /> Reply by email
                </Button>
                {item.phone && (
                  <Button
                    size="sm"
                    variant="secondary"
                    href={`https://wa.me/${item.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${item.name.split(" ")[0]}, thanks for booking a consultation with EazWorld!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={14} aria-hidden="true" /> WhatsApp
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-error dark:text-error-dark"
                  onClick={() => onDelete(item)}
                >
                  <Trash2 size={14} aria-hidden="true" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AdminConsultationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("consultation");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdminRole(user?.role)) router.replace("/dashboard");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (filter !== "all") params.set("status", filter);
      const res = await api.get(`/contacts?${params}`);
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => {
    if (!authLoading && isAdminRole(user?.role)) fetchData();
  }, [authLoading, user?.role, fetchData]);

  const handleStatusChange = async (id, update) => {
    try {
      await api.patch(`/contacts/${id}`, update);
      setItems((prev) => prev.map((c) => (c._id === id ? { ...c, ...update } : c)));
    } catch {}
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/contacts/${deleteTarget._id}`);
      setItems((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {} finally {
      setDeleting(false);
    }
  };

  if (authLoading || !isAdminRole(user?.role)) return null;

  const counts = items.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
  const newCount = counts.new || 0;

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Consultations"
          description="Manage booking requests from the consultation form."
          actions={
            <>
              {newCount > 0 && <Badge tone="brand">{newCount} new</Badge>}
              <Button size="sm" variant="secondary" onClick={fetchData} disabled={loading}>
                <RotateCw size={15} aria-hidden="true" className={loading ? "animate-spin" : ""} /> Refresh
              </Button>
            </>
          }
        />

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by request type">
            {TYPE_FILTERS.map((t) => (
              <Button
                key={t.value}
                size="sm"
                variant={typeFilter === t.value ? "primary" : "secondary"}
                aria-pressed={typeFilter === t.value}
                onClick={() => setTypeFilter(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((s) => (
              <Button
                key={s.value}
                size="sm"
                variant={filter === s.value ? "primary" : "secondary"}
                aria-pressed={filter === s.value}
                onClick={() => setFilter(s.value)}
              >
                {s.label}{s.value !== "all" && counts[s.value] ? ` (${counts[s.value]})` : ""}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {STATUS_KEYS.map((key) => (
            <Card key={key} padding="sm" className="text-center">
              <p className={`text-2xl font-bold tabular-nums ${
                key === "new" && counts.new > 0 ? "text-brand-ink dark:text-brand-400" : "text-gray-900 dark:text-white"
              }`}>
                {counts[key] || 0}
              </p>
              <p className="mt-1 text-caption text-gray-600 dark:text-slate-400">{STATUS_CONFIG[key].label}</p>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={Inbox}
              title="No bookings yet"
              description="Consultation requests submitted on the public site land here."
              action={
                filter !== "all" || typeFilter !== "consultation" ? (
                  <Button variant="secondary" onClick={() => { setFilter("all"); setTypeFilter("consultation"); }}>
                    Reset filters
                  </Button>
                ) : null
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ConsultationCard
                key={item._id}
                item={item}
                onStatusChange={handleStatusChange}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this booking?"
        description={deleteTarget ? `${deleteTarget.name} · ${deleteTarget.email}` : undefined}
        confirmLabel="Delete booking"
      >
        <p className="text-body-sm text-gray-600 dark:text-slate-400">
          The request and its admin note are removed permanently. To keep the record but clear
          the queue, set it to Archived instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}
