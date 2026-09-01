"use client";

import { errorMessage } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Send } from "lucide-react";
import { formatGhs, formatShippingMethod } from "@/lib/shop";
import { useOrder, useUpdateOrderStatus, useAddTrackingEvent } from "@/hooks/queries/useOrders";
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

export default function AdminOrderDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = useParams();
  const isAllowed = ["admin", "superadmin", "staff"].includes(user?.role);

  const [trackStatus, setTrackStatus] = useState("processing");
  const [trackNote, setTrackNote] = useState("");
  const [trackLocation, setTrackLocation] = useState("");

  useEffect(() => {
    if (!authLoading && !isAllowed) router.replace("/dashboard");
  }, [authLoading, isAllowed, router]);

  const { data: order, isLoading: loading } = useOrder(id, { enabled: !authLoading && isAllowed });
  const updateStatus = useUpdateOrderStatus();
  const addTracking = useAddTrackingEvent();
  const updating = updateStatus.isPending;
  const saving = addTracking.isPending;

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
                    form below rather than to the customer's read-only view. */}
                <Link
                  href="#tracking-update"
                  className="font-mono font-semibold text-brand-ink hover:underline"
                >
                  {order.trackingNumber}
                </Link>{" "}
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

        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Items</h2>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={item._id || i} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
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
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
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