"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { ShoppingBag, Wrench, Loader2 } from "lucide-react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/queries/useOrders";
import { usePartOrders, useUpdatePosOrderStatus } from "@/hooks/queries/usePosDashboard";

const ALLOWED = ["superadmin", "admin", "staff"];

const SHOP_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
const PART_STATUSES = ["pending", "paid", "cancelled"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const selectCls =
  "text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2.5 py-1.5 focus:outline-none focus:border-brand-400 capitalize disabled:opacity-50";

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
    { key: "shop",  label: "Shop Orders", icon: ShoppingBag, count: shopOrders.length },
    { key: "parts", label: "Part Orders", icon: Wrench,      count: partOrders.length },
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
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}
        </div>
      ) : tab === "shop" ? (
        shopOrders.length === 0 ? (
          <EmptyState label="No shop orders yet." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th>Items</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {shopOrders.map(order => (
                <tr key={order._id}>
                  <Td className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</Td>
                  <Td>
                    {order.customer?.name || "—"}
                    <span className="block text-xs text-gray-400 dark:text-gray-500">{order.customer?.phone || "—"}</span>
                  </Td>
                  <Td className="text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</Td>
                  <Td className="text-gray-500 dark:text-gray-400">
                    {order.items?.reduce((n, i) => n + (i.qty || 0), 0) || 0}
                  </Td>
                  <Td className="text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatGhs(order.total)}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      {savingId === order._id && <Loader2 className="animate-spin text-gray-400" size={11} />}
                      <select
                        value={order.status}
                        disabled={savingId === order._id}
                        onChange={e => updateShopStatus(order._id, e.target.value)}
                        className={selectCls}
                      >
                        {SHOP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )
      ) : partOrders.length === 0 ? (
        <EmptyState label="No repair part orders yet." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Part(s)</Th>
              <Th>Customer</Th>
              <Th>Job</Th>
              <Th>Date</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Status</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {partOrders.map(order => (
              <tr key={order._id}>
                <Td className="font-semibold text-gray-900 dark:text-white max-w-[220px] truncate">
                  {order.orderType === "repair"
                    ? (order.items || []).map(i => `${i.partName} ×${i.quantity}`).join(", ")
                    : order.partName}
                  {order.orderType === "repair" && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400 bg-brand-500/10 rounded-full px-2 py-0.5">
                      Multi-part
                    </span>
                  )}
                </Td>
                <Td>
                  {order.customerName || "—"}
                  <span className="block text-xs text-gray-400 dark:text-gray-500">{order.customerPhone || "—"}</span>
                </Td>
                <Td>
                  {order.job?.jobNumber ? (
                    <Link href={`/dashboard/pos/jobs/${order.job._id}`} className="text-brand-600 dark:text-brand-400 hover:underline">
                      {order.job.jobNumber}
                    </Link>
                  ) : "—"}
                </Td>
                <Td className="text-gray-500 dark:text-gray-400">
                  {formatDate(order.createdAt)}
                  {order.orderType === "repair"
                    ? (order.shippingFeePesewas > 0 ? <span className="block text-xs">incl. shipping</span> : null)
                    : <span className="block text-xs">Qty {order.quantity}</span>}
                </Td>
                <Td className="text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  {order.orderType === "repair"
                    ? formatGhs(order.totalPesewas)
                    : formatGhs(order.amountPesewas)}
                </Td>
                <Td className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    {savingId === order._id && <Loader2 className="animate-spin text-gray-400" size={11} />}
                    <select
                      value={order.status}
                      disabled={savingId === order._id}
                      onChange={e => updatePartStatus(order._id, e.target.value, order.orderType)}
                      className={selectCls}
                    >
                      {PART_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
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

function Table({ children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
