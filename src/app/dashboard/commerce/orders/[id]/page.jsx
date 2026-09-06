"use client";

import { errorMessage } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Send } from "lucide-react";
import { formatGhs, formatShippingMethod } from "@/lib/shop";
import {
  useOrder, useUpdateOrderStatus, useAddTrackingEvent,
  useUpdatePreorderLine, useReleasePreorder, useSetPreorderStage,
} from "@/hooks/queries/useOrders";
import PreorderProgress from "@/components/shop/PreorderProgress";
import BatchHistory from "@/components/commerce/BatchHistory";
import { useAdvanceShipment, useShipments, SHIPMENT_STAGES } from "@/hooks/queries/useShipments";
import {
  Badge, Button, Card, EmptyState, Skeleton,
} from "@/components/ui";
import { controlBase, controlSizes, controlBorder } from "@/components/ui/controlStyles";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

/* Same semantic mapping as the staff dashboard's RecentOrdersList so a status
 * reads the same colour wherever it appears. */
const STATUS_TONES = {
  pending:    "brand",
  paid:       "info",
  processing: "info",
  shipped:    "info",
  delivered:  "success",
  cancelled:  "neutral",
};

const fieldCls = `${controlBase} ${controlSizes.md} ${controlBorder(false)}`;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}


/**
 * The batch this pre-order is riding on — its internal journey, and the control
 * to move it — on the customer's own order.
 *
 * Support works from the order, not from the batch list: someone on the phone
 * has this page open, and making them go and find the right container to record
 * "it cleared customs today" is how a batch goes a fortnight without an update.
 * The move still belongs to the batch, so every other customer on it moves too.
 */
function JourneyPanel({ orderId, journey, expectedArrival }) {
  const advance = useAdvanceShipment();
  const setStageOnOrder = useSetPreorderStage();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(journey.stage || SHIPMENT_STAGES[0].key);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const onBatch = journey.source === "batch";
  const saving = onBatch ? advance.isPending : setStageOnOrder.isPending;

  const save = () => {
    setError("");
    const done = {
      onSuccess: () => { setOpen(false); setNote(""); },
      onError: (err) => setError(errorMessage(err, "Could not record the stage.")),
    };
    // One source drives one journey: a line on a batch moves WITH the batch, so
    // every other customer on that container moves too. A line on its own is
    // recorded against the order and affects nobody else.
    if (onBatch) {
      advance.mutate({ id: journey.batch.id, stage, note: note || undefined }, done);
    } else {
      setStageOnOrder.mutate({ id: orderId, stage, note: note || undefined }, done);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {onBatch ? journey.batch.name : "This order's own journey"}
            {onBatch && (
              <span className="ml-2 font-mono text-xs text-gray-600 dark:text-slate-400">
                {journey.batch.reference}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
            {journey.stageLabel || "Nothing recorded yet"}
            {onBatch && journey.batch.containerNumber ? ` · ${journey.batch.containerNumber}` : ""}
            {expectedArrival ? ` · expected ${new Date(expectedArrival).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setStage(journey.stage || SHIPMENT_STAGES[0].key); setOpen((v) => !v); }}
        >
          {open ? "Cancel" : journey.stage ? "Update stage" : "Record a stage"}
        </Button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl border border-gray-100 dark:border-slate-800 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Stage</span>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className={`mt-1 w-full ${fieldCls}`}>
                {SHIPMENT_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Message to the customer</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Shown to the customer, e.g. Held at the port"
                className={`mt-1 w-full ${fieldCls}`}
              />
            </label>
          </div>
          {stage === "at_shop" && (
            <p className="rounded-xl bg-warning-surface px-3 py-2 text-xs text-warning dark:bg-warning-surface-dark dark:text-warning-dark">
              Saving this releases the order: the goods are here, so it leaves the pre-order
              queue, the customer is emailed, and the ordinary status and tracking updates open up.
            </p>
          )}
          <p className="text-xs text-gray-600 dark:text-slate-400">
            {onBatch
              ? "Stamped with the time you save it, and this moves every order on the batch."
              : "Stamped with the time you save it. This order only."}
            {" "}Saving the stage it is already on corrects that stage&apos;s date or note;
            picking an earlier one moves it back, dropping everything after it.
          </p>
          {error && <p className="text-xs text-error dark:text-error-dark">{error}</p>}
          <Button size="sm" loading={saving} onClick={save}>Save stage</Button>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Shipping history
        </p>
        <BatchHistory
          entries={journey.history}
          emptyHint="Nothing recorded yet — record the first stage above and the customer sees it."
        />
      </div>
    </div>
  );
}

/**
 * Correct the pre-order lines on this order: how many, and which batch each
 * rides on — plus the release that ends the wait.
 *
 * The batch panel above moves a whole container. This is the single customer:
 * the one who ordered two instead of three, or whose line went onto the wrong
 * container. Taking a line OFF a batch is here too; nothing could do that.
 *
 * A pre-order is paid in full up front, so a quantity change leaves money owed
 * one way or the other. The server recomputes the totals and reports the
 * difference without moving anything — this form says so out loud rather than
 * letting staff assume the order is settled.
 */
// Mirrors IN_GHANA_STAGES in the backend's orderController: releasing hands
// goods over, so it may not happen while they are still abroad. The server
// refuses it either way; this stops staff clicking into that refusal.
const IN_GHANA = ["port_ghana", "at_shop"];

function PreorderLines({ orderId, items, stage }) {
  const { data: batches = [] } = useShipments();
  const update = useUpdatePreorderLine();
  const release = useReleasePreorder();
  const [draft, setDraft] = useState({});
  const [result, setResult] = useState(null);

  const waiting = (items || []).filter((i) => i.isPreorder && !i.preorderReleasedAt);
  if (!waiting.length) return null;

  const inGhana = IN_GHANA.includes(stage);

  const valueFor = (item, field) =>
    draft[item._id]?.[field] ?? (field === "qty" ? item.qty : item.shipment || "");

  const edit = (item, field, value) =>
    setDraft((d) => ({ ...d, [item._id]: { ...d[item._id], [field]: value } }));

  const save = (item) => {
    setResult(null);
    const qty = Number(valueFor(item, "qty"));
    const shipment = valueFor(item, "shipment");
    update.mutate(
      { id: orderId, itemId: item._id, qty, shipment: shipment || null },
      {
        onSuccess: (res) => {
          setDraft((d) => ({ ...d, [item._id]: undefined }));
          setResult({ tone: "ok", difference: res?.meta?.difference ?? 0 });
        },
        onError: (err) => setResult({ tone: "error", message: errorMessage(err, "Could not update the line.") }),
      },
    );
  };

  const doRelease = () => {
    setResult(null);
    release.mutate(orderId, {
      onError: (err) => setResult({ tone: "error", message: errorMessage(err, "Could not release.") }),
    });
  };

  return (
    <div className="mt-3 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pre-order lines</h3>
      <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
        Changing a quantity changes what this customer owes — the figure is reported here,
        but no money moves. Settle it with a refund or by collecting the difference.
      </p>

      <div className="mt-3 space-y-3">
        {waiting.map((item) => (
          <div key={item._id} className="rounded-xl border border-gray-100 dark:border-slate-800 p-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
            <p className="text-xs text-gray-600 dark:text-slate-400">{formatGhs(item.price)} each</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-[6rem_1fr_auto] sm:items-end">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={valueFor(item, "qty")}
                  onChange={(e) => edit(item, "qty", e.target.value)}
                  className={`mt-1 w-full ${fieldCls}`}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500">On batch</span>
                <select
                  value={valueFor(item, "shipment")}
                  onChange={(e) => edit(item, "shipment", e.target.value)}
                  className={`mt-1 w-full ${fieldCls}`}
                >
                  <option value="">(not on a batch)</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>{b.reference} — {b.name}</option>
                  ))}
                </select>
              </label>
              <Button size="sm" loading={update.isPending} onClick={() => save(item)}>Save</Button>
            </div>
          </div>
        ))}
      </div>

      {result?.tone === "error" && (
        <p className="mt-3 text-xs text-error dark:text-error-dark">{result.message}</p>
      )}
      {result?.tone === "ok" && (
        <p className="mt-3 rounded-xl bg-warning-surface px-3 py-2 text-xs text-warning dark:bg-warning-surface-dark dark:text-warning-dark">
          {result.difference > 0
            ? `Saved. ${formatGhs(result.difference)} is still to collect from this customer.`
            : result.difference < 0
              ? `Saved. ${formatGhs(-result.difference)} is owed back to this customer — issue a refund.`
              : "Saved. The order total is unchanged."}
        </p>
      )}

      <div className="mt-4 border-t border-gray-100 dark:border-slate-800 pt-3">
        <Button
          variant="secondary"
          size="sm"
          loading={release.isPending}
          disabled={!inGhana}
          onClick={doRelease}
        >
          Release now
        </Button>
        <p className="mt-1.5 text-xs text-gray-600 dark:text-slate-400">
          {inGhana
            ? "Releasing moves stock, tells the customer their item has arrived, and starts the ordinary local tracking."
            : "Not until the goods are in Ghana. Record the pre-order as arrived at the port, or at our warehouse, first."}
        </p>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const isAllowed = ["admin", "superadmin", "staff"].includes(user?.role);

  const [trackStatus, setTrackStatus] = useState("processing");
  const [trackNote, setTrackNote] = useState("");
  const [trackLocation, setTrackLocation] = useState("");
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAllowed) router.replace("/dashboard");
  }, [authLoading, isAllowed, router]);

  const { data: order, isLoading: loading } = useOrder(id, { enabled: !authLoading && isAllowed });
  const updateStatus = useUpdateOrderStatus();
  const addTracking = useAddTrackingEvent();
  const updating = updateStatus.isPending;
  const saving = addTracking.isPending;
  // Any line still waiting on its batch holds the whole order: there is no
  // partial shipment, so nothing goes out until everything has landed.
  const preorderHeld = (order?.items || []).some((i) => i.isPreorder && !i.preorderReleasedAt);
  // Terminal on the server too — canTransition refuses every move out of these.
  // Nothing further is recorded against such an order, so both the status row
  // and the tracking form go: the history is the complete record.
  const settled = ["delivered", "cancelled"].includes(order?.status);

  if (authLoading || !isAllowed) return null;

  const handleStatus = (status) => {
    updateStatus.mutate({ id, status }, { onError: (err) => alert(errorMessage(err, "Update failed")) });
  };

  const handleTrackingUpdate = (e) => {
    e.preventDefault();
    addTracking.mutate(
      { id, status: trackStatus, note: trackNote, location: trackLocation },
      {
        onSuccess: () => { setTrackNote(""); setTrackLocation(""); },
        onError: (err) => alert(errorMessage(err, "Update failed")),
      },
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
        <div className="mx-auto max-w-3xl space-y-4 py-6">
          <Skeleton className="h-8 w-56 rounded-xl" />
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
        <div className="mx-auto max-w-3xl">
          <Card padding="none">
            <EmptyState
              title="Order not found."
              description="The order may have been removed, or the link is out of date."
              action={<Button variant="secondary" href="/dashboard/pos/orders">← Back to Orders</Button>}
            />
          </Card>
        </div>
      </div>
    );
  }

  const zone = order.deliveryZone;
  const deliveryFee = order.shippingFee || zone?.fee || order.deliveryFee || 0;
  const history = order.trackingHistory || [];

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">{order.orderNumber}</h1>
            <p className="text-gray-500 text-sm">Placed {formatDate(order.createdAt)}</p>
            {order.trackingNumber && (
              <p className="text-gray-500 text-sm mt-0.5">
                Tracking number{" "}
                {/* This page is admin/staff only, so the number goes to the update
                    form below rather than to the customer's read-only view — and
                    while a pre-order is held that form is not on the page, so the
                    number is plain text rather than a link to nowhere. */}
                {preorderHeld || settled ? (
                  <span className="font-mono font-semibold text-gray-900">{order.trackingNumber}</span>
                ) : (
                  <Link
                    href="#tracking-update"
                    className="font-mono font-semibold text-brand-ink hover:underline"
                  >
                    {order.trackingNumber}
                  </Link>
                )}{" "}
                <Link
                  href={`/track/order/${order.trackingNumber}`}
                  className="text-xs text-gray-600 hover:underline"
                >
                  (view as customer)
                </Link>
              </p>
            )}
          </div>
          <Badge tone={STATUS_TONES[order.status] || "neutral"} className="capitalize">
            {order.status}
          </Badge>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-2">Customer</h2>
          <Row label="Name" value={order.customer?.name || "—"} />
          <Row label="Phone" value={order.customer?.phone || "—"} />
          <Row label="Email" value={order.customer?.email || "—"} />
          <Row label="Address" value={order.customer?.address || "—"} />
          <Row label="Delivery Zone" value={order.shippingZoneCode || zone?.name || "—"} />
          <Row label="Delivery Method" value={formatShippingMethod(order) || "—"} />
          <Row label="Delivery Fee" value={deliveryFee > 0 ? formatGhs(deliveryFee) : "Free"} />
        </div>

        {/* A pre-order is the reason this order is not moving, so staff need it
            up front — with the batch, which is the first thing support reaches
            for when a customer calls to ask where their item is. */}
        {order.preorder && (
          <div className="mb-6">
            <PreorderProgress preorder={order.preorder} />
            <PreorderLines
              orderId={id}
              items={order.items}
              stage={order.preorder.journey?.stage || ""}
            />
            {order.preorder.journey && (
              <JourneyPanel
                orderId={id}
                journey={order.preorder.journey}
                expectedArrival={order.preorder.expectedArrival}
              />
            )}
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Items</h2>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={item._id || i} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                    {item.isPreorder && !item.preorderReleasedAt && (
                      <Badge tone="info" className="ml-2">Pre-order</Badge>
                    )}
                  </p>
                  <p className="text-xs text-gray-600">Qty {item.qty} × {formatGhs(item.price)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 shrink-0">
                  {formatGhs(item.price * item.qty)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
          <Row label="Subtotal" value={formatGhs(order.subtotal)} />
          <Row label="Delivery Fee" value={deliveryFee > 0 ? formatGhs(deliveryFee) : "Free"} />
          <div className="flex justify-between gap-4 pt-2">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-sm font-bold text-gray-900">{formatGhs(order.total)}</span>
          </div>
          {order.paystackReference && <Row label="Payment Reference" value={order.paystackReference} />}
          {order.paidAt && <Row label="Paid At" value={formatDate(order.paidAt)} />}
        </div>

        {/* Local fulfilment does not exist yet for a held pre-order: the goods are
            still on a container. Both controls are hidden rather than disabled —
            there is nothing here staff can usefully do until release, and an
            empty form invites the click the server would only refuse. */}
        {preorderHeld ? (
          <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">Local tracking</h2>
            <p className="rounded-xl bg-warning-surface px-3 py-2 text-xs text-warning dark:bg-warning-surface-dark dark:text-warning-dark">
              Held until release. This order is waiting on pre-order stock — follow it on
              the batch above. Releasing it once the goods reach our warehouse starts the
              ordinary status and tracking updates.
            </p>

            {/* Cancelling stays available while the rest is hidden: a customer
                may want out while their goods are still months away, and the
                fulfilment controls being gone must not trap them in the order.
                Two steps, because cancelling is terminal — there is no way back
                from it. */}
            <div className="mt-4 border-t border-gray-100 dark:border-slate-800 pt-3">
              {confirmingCancel ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-700 dark:text-slate-300">
                    Cancel this order? It cannot be undone. The customer paid in full up
                    front, so cancelling does <strong>not</strong> return their money —
                    refund them separately.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      loading={updating}
                      onClick={() => handleStatus("cancelled")}
                    >
                      Yes, cancel this order
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)}>
                      Keep it
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setConfirmingCancel(true)}>
                  Cancel order
                </Button>
              )}
            </div>
          </div>
        ) : (
        <>
        {settled ? (
          <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">Status</h2>
            <p className="text-xs text-gray-600 dark:text-slate-400">
              This order is {order.status} — the journey is over. Nothing further is
              recorded against it; the history below is the complete record.
            </p>
          </div>
        ) : (
        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === order.status ? "primary" : "secondary"}
                onClick={() => handleStatus(s)}
                disabled={updating || s === order.status}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
        )}

        {!settled && (
        <div id="tracking-update" className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6 scroll-mt-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Add tracking update</h2>
          <form onSubmit={handleTrackingUpdate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Status</span>
                <select
                  value={trackStatus}
                  onChange={(e) => setTrackStatus(e.target.value)}
                  className={`mt-1 w-full ${fieldCls}`}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Location (optional)</span>
                <input
                  type="text"
                  value={trackLocation}
                  onChange={(e) => setTrackLocation(e.target.value)}
                  placeholder="e.g. Accra depot"
                  className={`mt-1 w-full ${fieldCls}`}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-gray-500">Note (optional)</span>
              <textarea
                value={trackNote}
                onChange={(e) => setTrackNote(e.target.value)}
                rows={2}
                placeholder="e.g. Handed to courier for delivery"
                className={`mt-1 w-full ${fieldCls} resize-none`}
              />
            </label>
            <Button type="submit" size="sm" loading={saving}>
              <Send size={10} aria-hidden="true" /> Add tracking update
            </Button>
          </form>
        </div>
        )}
        </>
        )}

        <div className="rounded-2xl border border-gray-100 bg-paper p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Tracking history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-600">No tracking updates yet.</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-6">
              {[...history].reverse().map((h, i) => (
                <li key={i} className="ml-6">
                  <span className="absolute -left-[9px] mt-1 w-4 h-4 rounded-full border-2 border-white bg-brand-500" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">{h.status}</span>
                    <span className="text-xs text-gray-600">{formatDate(h.timestamp)}</span>
                  </div>
                  {h.note && <p className="text-sm text-gray-600 mt-1">{h.note}</p>}
                  {h.location && <p className="text-xs text-gray-600 mt-0.5">{h.location}</p>}
                  {h.updatedBy?.name && (
                    <p className="text-xs text-gray-600 mt-0.5">by {h.updatedBy.name} ({h.updatedBy.role})</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}