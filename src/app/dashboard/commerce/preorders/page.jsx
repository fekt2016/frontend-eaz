"use client";

import { useState } from "react";
import Link from "next/link";
import { PackageCheck, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { usePreorders, useReleasePreorder } from "@/hooks/queries/useOrders";

const ALLOWED = ["admin", "superadmin", "staff"];

function fmtDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * T45 — the pre-order release queue.
 *
 * Releasing is deliberately a person's decision, not something a stock change
 * triggers: stock moves for corrections, returns and POS voids too, and none of
 * those should ship anything. Oldest order first, because that customer has been
 * waiting longest.
 */
export default function PreordersPage() {
  const { user } = useAuth();
  const isAllowed = ALLOWED.includes(user?.role);
  const { data: orders = [], isLoading } = usePreorders({ enabled: isAllowed });
  const release = useReleasePreorder();
  const [error, setError] = useState("");
  const [releasing, setReleasing] = useState(null);

  if (!isAllowed) return null;

  const handleRelease = (order) => {
    setError("");
    setReleasing(order._id);
    release.mutate(order._id, {
      onError: (err) => setError(err.message || "Could not release this pre-order."),
      onSettled: () => setReleasing(null),
    });
  };

  return (
    <div className="space-y-5 p-5 lg:p-7">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Pre-orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Paid orders waiting on stock. Release one when the item is physically in —
          that moves the stock, counts the sale, and emails the customer.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
          <AlertTriangle size={14} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={20} className="animate-spin text-brand-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-12 text-center">
          <p className="text-sm text-gray-500">No pre-orders waiting on stock.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const pending = (order.items || []).filter((i) => i.isPreorder && !i.preorderReleasedAt);
            return (
              <div
                key={order._id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/dashboard/commerce/orders/${order._id}`}
                      className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.customer?.name || "Customer"} · {order.customer?.phone} · ordered {fmtDate(order.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRelease(order)}
                    disabled={releasing === order._id}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-900 dark:bg-brand-500 px-4 py-2 text-xs font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-50"
                  >
                    {releasing === order._id
                      ? <><Loader2 size={12} className="animate-spin" /> Releasing…</>
                      : <><PackageCheck size={12} /> Release</>}
                  </button>
                </div>

                <ul className="mt-3 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-3">
                  {pending.map((item, i) => (
                    <li key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.name}{item.variant?.sku ? ` (${item.variant.sku})` : ""} × {item.qty}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatGhs((item.price || 0) * (item.qty || 1))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
