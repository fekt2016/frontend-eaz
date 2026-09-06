"use client";

import { errorMessage } from "@/lib/api";
import { useState } from "react";
import { Ship, Plus, PackageCheck, Link2, SlidersHorizontal, History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useShipments, useCreateShipment, useAdvanceShipment, useAttachOrdersToShipment,
  SHIPMENT_STAGES, CUSTOMER_LABEL_FOR,
} from "@/hooks/queries/useShipments";
import BatchHistory from "@/components/commerce/BatchHistory";
import { useOrders } from "@/hooks/queries/useOrders";
import {
  Alert, Button, Card, EmptyState, Input, PageHeader, Select, Skeleton,
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
 * The batch's raw `stageHistory` in the shape BatchHistory renders. The list
 * endpoint returns the stored entries, so the labels are added here.
 */
function historyEntries(shipment) {
  return (shipment.stageHistory || []).map((e) => ({
    stage: e.stage,
    label: labelFor(e.stage),
    note: e.note || "",
    date: e.date,
    updatedBy: e.updatedBy?.name || "",
    customerLabel: CUSTOMER_LABEL_FOR[e.stage] || "",
  }));
}

/** The pre-order lines on an order that are still waiting, for the picker's label. */
function waitingLineNames(order) {
  return (order.items || [])
    .filter((i) => i.isPreorder && !i.preorderReleasedAt)
    .map((i) => `${i.name}${i.qty > 1 ? ` × ${i.qty}` : ""}`)
    .join(", ");
}

/**
 * One batch, with the two things staff need to drive it: where it is, and which
 * customers are riding on it.
 *
 * The attach picker is the link that was missing entirely — the endpoint and the
 * hook both existed, but nothing rendered them, so no pre-order could ever be
 * put on a batch and every customer's tracking page sat on "awaiting shipment"
 * however far the goods had actually travelled.
 */
function ShipmentCard({ shipment, waitingOrders, onError }) {
  const advance = useAdvanceShipment();
  const attach = useAttachOrdersToShipment();
  const [panel, setPanel] = useState(null);
  const [stage, setStage] = useState(shipment.stage);
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState([]);

  const at = indexOf(shipment.stage);
  const next = SHIPMENT_STAGES[at + 1];

  const isOnThisBatch = (order) =>
    (order.items || []).some(
      (i) => i.isPreorder && !i.preorderReleasedAt && String(i.shipment) === String(shipment._id),
    );

  const attached = waitingOrders.filter(isOnThisBatch);
  const attachable = waitingOrders.filter((o) => !isOnThisBatch(o));

  const openPanel = (which) => {
    onError("");
    setStage(shipment.stage);
    setNote("");
    setPicked([]);
    setPanel((cur) => (cur === which ? null : which));
  };

  const move = (toStage, why) => {
    onError("");
    advance.mutate(
      { id: shipment._id, stage: toStage, note: why || undefined },
      {
        onSuccess: () => setPanel(null),
        onError: (err) => onError(errorMessage(err, "Could not update the shipment.")),
      },
    );
  };

  const attachPicked = () => {
    onError("");
    attach.mutate(
      { id: shipment._id, orderIds: picked },
      {
        onSuccess: () => { setPicked([]); setPanel(null); },
        onError: (err) => onError(errorMessage(err, "Could not attach those orders.")),
      },
    );
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Ship size={14} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{shipment.name}</p>
            <span className="font-mono text-xs text-gray-600 dark:text-slate-400">{shipment.reference}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            {labelFor(shipment.stage)}
            {shipment.containerNumber ? ` · ${shipment.containerNumber}` : ""}
            {` · expected ${fmtDate(shipment.expectedArrival)}`}
            {` · ${shipment.waitingLines} pre-order${shipment.waitingLines === 1 ? "" : "s"} waiting`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openPanel("attach")}>
            <Link2 size={13} aria-hidden="true" /> Pre-orders
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openPanel("stage")}>
            <SlidersHorizontal size={13} aria-hidden="true" /> Edit stage
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openPanel("history")}>
            <History size={13} aria-hidden="true" /> History
          </Button>
          {next ? (
            <Button variant="secondary" size="sm" onClick={() => move(next.key)} disabled={advance.isPending}>
              Move to {next.label} →
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success dark:text-success-dark">
              <PackageCheck size={12} aria-hidden="true" /> At the shop — release the pre-orders
            </span>
          )}
        </div>
      </div>

      {/* Progress across the eight operational stages. */}
      <div className="mt-4 flex gap-1">
        {SHIPMENT_STAGES.map((s, i) => (
          <span
            key={s.key}
            title={s.label}
            className={`h-1.5 flex-1 rounded-full ${i <= at ? "bg-brand-500" : "bg-gray-200 dark:bg-slate-700"}`}
          />
        ))}
      </div>

      {panel === "stage" && (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Stage" value={stage} onChange={(e) => setStage(e.target.value)}>
              {SHIPMENT_STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </Select>
            <Input
              label="Message to the customer"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Shown to the customer, e.g. Held at the port"
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-400">
            Each stage is stamped with the time you save it. Saving the stage it is already
            on re-stamps it; picking an earlier stage moves the batch back, and anything after
            that stage is dropped from what customers see.
          </p>
          <Button size="sm" loading={advance.isPending} onClick={() => move(stage, note)}>
            Save stage
          </Button>
        </div>
      )}

      {panel === "history" && (
        <div className="mt-4 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Shipping history
          </p>
          <BatchHistory
            entries={historyEntries(shipment)}
            emptyHint="Nothing recorded yet — this batch has not moved since it was created."
          />
        </div>
      )}

      {panel === "attach" && (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Pre-orders on this batch ({attached.length})
          </p>
          {attached.length === 0 ? (
            <p className="text-xs text-gray-600 dark:text-slate-400">
              None yet — until an order is attached, that customer&apos;s tracking page shows
              &ldquo;awaiting shipment&rdquo; no matter where this batch actually is.
            </p>
          ) : (
            <ul className="space-y-1">
              {attached.map((o) => (
                <li key={o._id} className="text-xs text-gray-700 dark:text-slate-300">
                  <span className="font-mono">{o.orderNumber}</span> — {waitingLineNames(o)}
                </li>
              ))}
            </ul>
          )}

          {attachable.length > 0 && (
            <>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Waiting to be assigned
              </p>
              <ul className="max-h-56 space-y-1 overflow-y-auto">
                {attachable.map((o) => (
                  <li key={o._id}>
                    <label className="flex items-start gap-2 text-xs text-gray-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 dark:border-slate-600"
                        checked={picked.includes(o._id)}
                        onChange={(e) =>
                          setPicked((prev) =>
                            e.target.checked ? [...prev, o._id] : prev.filter((id) => id !== o._id),
                          )
                        }
                      />
                      <span>
                        <span className="font-mono">{o.orderNumber}</span>
                        {o.customer?.name ? ` · ${o.customer.name}` : ""} — {waitingLineNames(o)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button size="sm" loading={attach.isPending} disabled={!picked.length} onClick={attachPicked}>
                Attach {picked.length || ""} pre-order{picked.length === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
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
  // The release queue doubles as the pool of pre-orders that can be put on a
  // batch: same orders, asked for from the other direction.
  const { data: waitingOrders = [] } = useOrders({ preorder: "pending", limit: 100 }, { enabled: isAllowed });

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
              label="Message to the customer"
              value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Shown to the customer, e.g. Held at the port"
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
          {shipments.map((s) => (
            <ShipmentCard
              key={s._id}
              shipment={s}
              waitingOrders={waitingOrders}
              onError={setError}
            />
          ))}
        </div>
      )}
    </div>
  );
}
