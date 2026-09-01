"use client";

import { errorMessage } from "@/lib/api";
import { useState } from "react";
import { Ship, Plus, PackageCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useShipments, useCreateShipment, useAdvanceShipment, SHIPMENT_STAGES,
} from "@/hooks/queries/useShipments";
import {
  Alert, Button, Card, EmptyState, Input, PageHeader, Skeleton,
} from "@/components/ui";

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
        onError: (err) => setError(errorMessage(err, "Could not create the shipment.")),
      },
    );
  };

  const moveTo = (shipment, stage) => {
    setError("");
    advance.mutate(
      { id: shipment._id, stage },
      { onError: (err) => setError(errorMessage(err, "Could not update the shipment.")) },
    );
  };

  return (
    <div className="space-y-5 p-5 lg:p-7">
      <PageHeader
        title="Incoming shipments"
        description="Batches on their way in. Move one along and every pre-order riding on it updates — customers see a simplified version on their tracking page."
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus size={13} aria-hidden="true" /> New shipment
          </Button>
        }
      />

      <Alert tone="error">{error}</Alert>

      {showForm && (
        <Card as="form" onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Batch name *"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. March iPhone batch"
            />
            <Input
              label="Container number"
              value={form.containerNumber} onChange={(e) => setForm({ ...form, containerNumber: e.target.value })}
              placeholder="e.g. CMAU1234567"
            />
            <Input
              label="Expected in Ghana"
              type="date" value={form.expectedArrival}
              onChange={(e) => setForm({ ...form, expectedArrival: e.target.value })}
            />
            <Input
              label="Note"
              value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Internal — customers never see this"
            />
          </div>
          <Button type="submit" size="sm" loading={createShipment.isPending}>
            Create shipment
          </Button>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : shipments.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Ship}
            title="Nothing on its way in yet."
            description="Log a shipment when stock is bought, then advance it as each stage completes."
            action={<Button size="sm" onClick={() => setShowForm(true)}>New shipment</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => {
            const at = indexOf(s.stage);
            const next = SHIPMENT_STAGES[at + 1];
            return (
              <Card key={s._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Ship size={14} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{s.name}</p>
                      <span className="font-mono text-xs text-gray-600 dark:text-slate-400">{s.reference}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                      {labelFor(s.stage)}
                      {s.containerNumber ? ` · ${s.containerNumber}` : ""}
                      {` · expected ${fmtDate(s.expectedArrival)}`}
                      {` · ${s.waitingLines} pre-order${s.waitingLines === 1 ? "" : "s"} waiting`}
                    </p>
                  </div>
                  {next ? (
                    <Button variant="secondary" size="sm" onClick={() => moveTo(s, next.key)} disabled={advance.isPending}>
                      Move to {next.label} →
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success dark:text-success-dark">
                      <PackageCheck size={12} aria-hidden="true" /> At the shop — release the pre-orders
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
                        i <= at ? "bg-brand-500" : "bg-gray-200 dark:bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
