"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, RotateCw, Trash2, ChevronDown, Mail, Phone, Building, CalendarDays, Target, MessageCircle, Inbox } from "lucide-react";
import { isAdminRole } from "@/lib/roles";

const STATUS_CONFIG = {
  new:      { label: "New",      cls: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800/40",     dot: "bg-brand-400" },
  read:     { label: "Read",     cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40",           dot: "bg-blue-400" },
  replied:  { label: "Replied",  cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40", dot: "bg-emerald-400" },
  archived: { label: "Archived", cls: "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400 border border-gray-200 dark:border-slate-700",            dot: "bg-gray-400" },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ConsultationCard({ item, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState(item.adminNote || "");
  const [savingNote, setSavingNote] = useState(false);

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
    <div className={`rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden transition ${
      item.status === "new" ? "border-brand-200 dark:border-brand-800/40" : "border-gray-100 dark:border-slate-800"
    }`}>
      {/* Header row */}
      <div
        className="flex items-start justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-paper dark:hover:bg-slate-800/50 transition"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm flex-shrink-0 mt-0.5">
            {item.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{item.name}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{item.email}</p>
            {item.service && (
              <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mt-1"><Target size={11} className="inline text-brand-600 dark:text-brand-400" /> {item.service}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={item.status} />
          <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap hidden sm:block">{fmtDate(item.createdAt)}</span>
          <ChevronDown size={12} className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50 dark:border-slate-800">
          <div className="pt-4 space-y-4">

            {/* Contact info */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-slate-400">
              <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 hover:text-brand-500 transition">
                <Mail size={11} /> {item.email}
              </a>
              {item.phone && (
                <a href={`tel:${item.phone}`} className="flex items-center gap-1.5 hover:text-brand-500 transition">
                  <Phone size={11} /> {item.phone}
                </a>
              )}
              {item.businessName && (
                <span className="flex items-center gap-1.5">
                  <Building size={11} /> {item.businessName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays size={11} /> {fmtDate(item.createdAt)}
              </span>
            </div>

            {/* Message */}
            {item.message && (
              <div className="bg-paper dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5 uppercase tracking-wide">Message</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{item.message}</p>
              </div>
            )}

            {/* Admin note */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mb-1.5 uppercase tracking-wide">Admin Note</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Add a private note (only visible to admin)…"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-400 transition resize-none"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="mt-1.5 text-xs font-semibold px-4 py-1.5 rounded-full bg-gray-900 dark:bg-slate-700 text-white hover:bg-gray-700 dark:hover:bg-slate-600 disabled:opacity-50 transition"
              >
                {savingNote ? "Saving…" : "Save Note"}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => handleStatus(key)}
                    disabled={updating || item.status === key}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition disabled:opacity-40 ${
                      item.status === key
                        ? cfg.cls
                        : "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800"
                    }`}
                  >
                    {updating && item.status !== key ? <Loader2 className="animate-spin" size={10} /> : cfg.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <a
                  href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || "Your Consultation Request")}`}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-500 text-white hover:bg-brand-400 transition"
                >
                  <Mail size={10} /> Reply by Email
                </a>
                {item.phone && (
                  <a
                    href={`https://wa.me/${item.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${item.name.split(" ")[0]}, thanks for booking a consultation with EazWorld!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition"
                  >
                    <MessageCircle size={10} /> WhatsApp
                  </a>
                )}
                <button
                  onClick={() => onDelete(item._id)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminConsultationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("consultation");

  useEffect(() => {
    if (!authLoading && !isAdminRole(user?.role)) router.replace("/dashboard");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/v1/contacts?${params}`);
      const json = await res.json();
      setItems(json.data || []);
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
      const res = await fetch(`/api/v1/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        setItems((prev) => prev.map((c) => c._id === id ? { ...c, ...update } : c));
      }
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/v1/contacts/${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((c) => c._id !== id));
    } catch {}
  };

  if (authLoading || !isAdminRole(user?.role)) return null;

  const counts = items.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {});
  const newCount = counts.new || 0;

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
              Consultations
              {newCount > 0 && (
                <span className="ml-2 text-sm font-semibold px-2.5 py-1 rounded-full bg-brand-500 text-white">{newCount} new</span>
              )}
            </h1>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">Manage booking requests from the consultation form.</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50"
          >
            <RotateCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Type filter */}
          <div className="flex gap-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-full p-1">
            {[["consultation", "Consultations"], ["general", "General"], ["all", "All Types"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  typeFilter === val
                    ? "bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-full p-1">
            {[["all", "All"], ["new", "New"], ["read", "Read"], ["replied", "Replied"], ["archived", "Archived"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  filter === val
                    ? "bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {label}
                {val !== "all" && counts[val] ? ` (${counts[val]})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[["new", "New"], ["read", "Read"], ["replied", "Replied"], ["archived", "Archived"]].map(([key, label]) => (
            <div key={key} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 text-center">
              <p className={`text-2xl font-bold ${key === "new" && counts.new > 0 ? "text-brand-500" : "text-gray-900 dark:text-white"}`}>
                {counts[key] || 0}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 className="animate-spin text-brand-500" size={24} />
            <span className="text-sm">Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 text-gray-400 dark:text-slate-500">
            <Inbox size={36} className="mb-4 mx-auto text-gray-400 dark:text-slate-500" />
            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">No bookings yet</p>
            <p className="text-xs">Consultation requests will appear here once submitted.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ConsultationCard
                key={item._id}
                item={item}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
