"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { FaShoppingBag, FaWrench, FaSpinner } from "react-icons/fa";
import { useOrders, useUpdateOrderStatus } from "@/hooks/queries/useOrders";
import { usePartOrders, useUpdatePosOrderStatus } from "@/hooks/queries/usePosDashboard";

const ALLOWED = ["superadmin", "admin", "staff"];

const SHOP_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
const PART_STATUSES = ["pending", "paid", "cancelled"];

const STATUS_COLORS = {
  pending:    "bg-brand-500/15 text-brand-600 dark:text-brand-400",
  paid:       "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  processing: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  shipped:    "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  delivered:  "bg-green-500/15 text-green-600 dark:text-green-400",
  cancelled:  "bg-red-500/15 text-red-600 dark:text-red-400",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const selectCls =
  "text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2.5 py-1.5 focus:outline-none focus:border-brand-400 capitalize disabled:opacity-50";

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${STATUS_COLORS[status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
      {status}
    </span>
  );
}

export default function PosOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState("shop"); // 'shop' | 'parts'
  const [error, setError] = useState("");

  const isAllowed = ALLOWED.includes(user?.role);

  // Only staff and above may manage orders; send technicians back to their jobs.
  useEffect(() => {
    if (!authLoading && !isAllowed) router.replace("/dashboard/pos");
  }, [authLoading, isAllowed, router]);

  const shopQ = useOrders({}, { enabled: !authLoading && isAllowed });
  const partQ = usePartOrders("all", { enabled: !authLoading && isAllowed });
  const updateShop = useUpdateOrderStatus();
  const updatePos = useUpdatePosOrderStatus();

  const shopOrders = shopQ.data ?? [];
  const partOrders = partQ.data ?? [];
  const loading = shopQ.isLoading || partQ.isLoading;
  const savingId = updateShop.isPending
    ? updateShop.variables?.id
    : updatePos.isPending
    ? updatePos.variables?.id
    : null;

  if (authLoading || !isAllowed) return null;

  const updateShopStatus = (id, status) => {
    setError("");
    updateShop.mutate({ id, status }, { onError: (e) => setError(e.message || "Failed to update order.") });
  };

  const updatePartStatus = (id, status, orderType) => {
    setError("");
    updatePos.mutate({ id, status, orderType }, { onError: (e) => setError(e.message || "Failed to update order.") });
  };

  const tabs = [
    { key: "shop",  label: "Shop Orders", icon: FaShoppingBag, count: shopOrders.length },
    { key: "parts", label: "Part Orders", icon: FaWrench,      count: partOrders.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and update product & repair part orders.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === key
                ? "bg-brand-500/15 text-brand-600 dark:text-brand-400"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Icon size={13} /> {label}
            <span className="text-xs opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : tab === "shop" ? (
        shopOrders.length === 0 ? (
          <EmptyState label="No shop orders yet." />
        ) : (
          <div className="space-y-3">
            {shopOrders.map(order => (
              <div key={order._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.customer?.name || "—"} · {order.customer?.phone || "—"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(order.createdAt)} · {order.items?.reduce((n, i) => n + (i.qty || 0), 0) || 0} item(s)
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatGhs(order.total)}</p>
                    <div className="flex items-center gap-2 justify-end">
                      {savingId === order._id && <FaSpinner className="animate-spin text-gray-400" size={11} />}
                      <select
                        value={order.status}
                        disabled={savingId === order._id}
                        onChange={e => updateShopStatus(order._id, e.target.value)}
                        className={selectCls}
                      >
                        {SHOP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : partOrders.length === 0 ? (
        <EmptyState label="No repair part orders yet." />
      ) : (
        <div className="space-y-3">
          {partOrders.map(order => (
            <div key={order._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {order.orderType === "repair"
                        ? (order.items || []).map(i => `${i.partName} ×${i.quantity}`).join(", ")
                        : order.partName}
                    </p>
                    <StatusBadge status={order.status} />
                    {order.orderType === "repair" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400 bg-brand-500/10 rounded-full px-2 py-0.5">
                        Multi-part
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.customerName || "—"} · {order.customerPhone || "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {order.job?.jobNumber ? (
                      <Link href={`/dashboard/pos/jobs/${order.job._id}`} className="text-brand-600 dark:text-brand-400 hover:underline">
                        {order.job.jobNumber}
                      </Link>
                    ) : "—"}
                    {" · "}{formatDate(order.createdAt)}
                    {order.orderType === "repair"
                      ? (order.shippingFeePesewas > 0 ? " · incl. shipping" : "")
                      : ` · Qty ${order.quantity}`}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {order.orderType === "repair"
                      ? formatGhs(order.totalPesewas)
                      : formatGhs(order.amountGhs)}
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    {savingId === order._id && <FaSpinner className="animate-spin text-gray-400" size={11} />}
                    <select
                      value={order.status}
                      disabled={savingId === order._id}
                      onChange={e => updatePartStatus(order._id, e.target.value, order.orderType)}
                      className={selectCls}
                    >
                      {PART_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}
