"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { FaPaperPlane } from "react-icons/fa6";
import { formatGhs } from "@/lib/shop";
import { useOrder, useUpdateOrderStatus, useAddTrackingEvent } from "@/hooks/queries/useOrders";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

const statusColors = {
  pending: "bg-brand-50 text-brand-700",
  paid: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

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
    updateStatus.mutate({ id, status }, { onError: (err) => alert(err.message || "Update failed") });
  };

  const handleTrackingUpdate = (e) => {
    e.preventDefault();
    addTracking.mutate(
      { id, status: trackStatus, note: trackNote, location: trackLocation },
      {
        onSuccess: () => { setTrackNote(""); setTrackLocation(""); },
        onError: (err) => alert(err.message || "Update failed"),
      },
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
        <div className="mx-auto max-w-3xl flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-100 bg-paper p-8 text-center">
          <p className="text-gray-400 text-sm">Order not found.</p>
            <Link href="/dashboard/commerce/orders" className="text-sm text-gray-500 hover:text-gray-900 mt-2 inline-block">
              ← Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const zone = order.deliveryZone;
  const deliveryFee = zone?.fee != null ? zone.fee : order.deliveryFee;
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
                <Link
                  href={`/track/order/${order.trackingNumber}`}
                  className="font-mono font-semibold text-brand-600 hover:underline"
                >
                  {order.trackingNumber}
                </Link>
              </p>
            )}
          </div>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${statusColors[order.status] || "bg-gray-100 text-gray-600"}`}>
            {order.status}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-2">Customer</h2>
          <Row label="Name" value={order.customer?.name || "—"} />
          <Row label="Phone" value={order.customer?.phone || "—"} />
          <Row label="Email" value={order.customer?.email || "—"} />
          <Row label="Address" value={order.customer?.address || "—"} />
          <Row label="Delivery Zone" value={zone?.name || "—"} />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Items</h2>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={item._id || i} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">Qty {item.qty} × {formatGhs(item.price)}</p>
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
          <Row label="Delivery Fee" value={formatGhs(deliveryFee)} />
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
              <button
                key={s}
                onClick={() => handleStatus(s)}
                disabled={updating || s === order.status}
                className={`text-xs font-semibold px-3.5 py-2 rounded-full capitalize transition disabled:opacity-50 ${
                  s === order.status
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {updating ? "..." : s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-6">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">Add tracking update</h2>
          <form onSubmit={handleTrackingUpdate} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Status</span>
                <select
                  value={trackStatus}
                  onChange={(e) => setTrackStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
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
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
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
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 resize-none"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition disabled:opacity-50"
            >
              <FaPaperPlane size={10} /> {saving ? "Saving…" : "Add tracking update"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-paper p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Tracking history</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-400">No tracking updates yet.</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-6">
              {[...history].reverse().map((h, i) => (
                <li key={i} className="ml-6">
                  <span className="absolute -left-[9px] mt-1 w-4 h-4 rounded-full border-2 border-white bg-brand-500" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">{h.status}</span>
                    <span className="text-xs text-gray-400">{formatDate(h.timestamp)}</span>
                  </div>
                  {h.note && <p className="text-sm text-gray-600 mt-1">{h.note}</p>}
                  {h.location && <p className="text-xs text-gray-400 mt-0.5">{h.location}</p>}
                  {h.updatedBy?.name && (
                    <p className="text-xs text-gray-400 mt-0.5">by {h.updatedBy.name} ({h.updatedBy.role})</p>
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