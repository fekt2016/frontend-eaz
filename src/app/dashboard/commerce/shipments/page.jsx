"use client";

import { useState } from "react";
import { Ship, Plus, Loader2, AlertTriangle, PackageCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useShipments, useCreateShipment, useAdvanceShipment, SHIPMENT_STAGES,
} from "@/hooks/queries/useShipments";

const ALLOWED = ["admin", "superadmin", "staff"];

const labelFor = (key) => SHIPMENT_STAGES.find((s) => s.key === key)?.label || key;
const indexOf = (key) => SHIPMENT_STAGES.findIndex((s) => s.key === key);

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * T45 — incoming stock batches.
 *
 * The point of tracking here rather than on each order: one container carries
 * many customers' pre-orders, so a stage is entered ONCE and everyone waiting on
 * it moves. Customers see a simplified version of this on their own tracking page.
 */
export default function ShipmentsPage() {
  const { user } = useAuth();
  const isAllowed = ALLOWED.includes(user?.role);
  const { data: shipments = [], isLoading } = useShipments({ enabled: isAllowed });
  const createShipment = useCreateShipment();
  const advance = useAdvanceShipment();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", containerNumber: "", expectedArrival: "", note: "" });
  const [error, setError] = useState("");

  if (!isAllowed) return null;

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Give the batch a name you'll recognise.");
    createShipment.mutate(
      { ...form, name: form.name.trim() },
      {
        onSuccess: () => {
          setForm({ name: "", containerNumber: "", expectedArrival: "", note: "" });
          setShowForm(false);
        },
        onError: (err) => setError(err.message || "Could not create the shipment."),
      },
    );
  };

  const moveTo = (shipment, stage) => {
    setError("");
    advance.mutate(
      { id: shipment._id, stage },
      { onError: (err) => setError(err.message || "Could not update the shipment.") },
    );
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500";

  return (
    <div className="space-y-5 p-5 lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Incoming shipments</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Batches on their way in. Move one along and every pre-order riding on it
            updates — customers see a simplified version on their tracking page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
        >
          <Plus size={13} /> New shipment
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
          <AlertTriangle size={14} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Batch name *</span>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. March iPhone batch" className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Container number</span>
              <input
                value={form.containerNumber} onChange={(e) => setForm({ ...form, containerNumber: e.target.value })}
                placeholder="e.g. CMAU1234567" className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Expected in Ghana</span>
              <input
                type="date" value={form.expectedArrival}
                onChange={(e) => setForm({ ...form, expectedArrival: e.target.value })}
                className={`mt-1 ${inputCls}`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Note</span>
              <input
                value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Internal — customers never see this" className={`mt-1 ${inputCls}`}
              />
            </label>
          </div>
          <button
            type="submit" disabled={createShipment.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 dark:bg-brand-500 px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 disabled:opacity-50"
          >
            {createShipment.isPending ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : <>Create shipment</>}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={20} className="animate-spin text-brand-500" /></div>
      ) : shipments.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-12 text-center">
          <p className="text-sm text-gray-500">Nothing on its way in yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => {
            const at = indexOf(s.stage);
            const next = SHIPMENT_STAGES[at + 1];
            return (
              <div key={s._id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Ship size={14} className="text-brand-600 dark:text-brand-400" />
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{s.name}</p>
                      <span className="font-mono text-xs text-gray-400">{s.reference}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {labelFor(s.stage)}
                      {s.containerNumber ? ` · ${s.containerNumber}` : ""}
                      {` · expected ${fmtDate(s.expectedArrival)}`}
                      {` · ${s.waitingLines} pre-order${s.waitingLines === 1 ? "" : "s"} waiting`}
                    </p>
                  </div>
                  {next ? (
                    <button
                      type="button"
                      onClick={() => moveTo(s, next.key)}
                      disabled={advance.isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-gray-400 transition disabled:opacity-50"
                    >
                      Move to {next.label} →
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <PackageCheck size={12} /> At the shop — release the pre-orders
                    </span>
                  )}
                </div>

                {/* Progress across the eight operational stages. */}
                <div className="mt-4 flex gap-1">
                  {SHIPMENT_STAGES.map((stage, i) => (
                    <span
                      key={stage.key}
                      title={stage.label}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= at ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
