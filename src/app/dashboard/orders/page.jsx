"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge, fmtDate } from "@/components/dashboard/customer/CustomerCards";
import { useOrders, useMyOrders, useUpdateOrderStatus } from "@/hooks/queries/useOrders";
import { formatGhs } from "@/lib/shop";

const ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState({});

  // Admin/staff see all orders; customers see only their own. Both hooks are
  // declared unconditionally (rules of hooks) but only the relevant one runs.
  const seesAll = ["admin", "superadmin", "staff"].includes(user?.role);
  const allOrdersQ = useOrders({}, { enabled: !!user && seesAll });
  const myOrdersQ = useMyOrders({ enabled: !!user && !seesAll });
  const orders = seesAll ? (allOrdersQ.data ?? []) : (myOrdersQ.data ?? []);
  const loading = seesAll ? allOrdersQ.isLoading : myOrdersQ.isLoading;

  const updateStatus = useUpdateOrderStatus();
  // Mark the row whose status change is in flight.
  const updating = updateStatus.isPending ? updateStatus.variables?.id : null;

  const setDraft = (id, status) => setDrafts((d) => ({ ...d, [id]: status }));

  const handleStatusUpdate = (id) => {
    const status = drafts[id];
    if (!status) return;
    // The mutation invalidates ["orders"], so the list refetches automatically.
    updateStatus.mutate(
      { id, status },
      { onError: (err) => alert(err.message || "Update failed") },
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">
            {seesAll ? "Shop Orders" : "My Shop Orders"}
          </h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">
            {seesAll
              ? "All customer orders."
              : "Orders matched by the phone or email you use at checkout."}
          </p>
        </div>
        <Link href="/shop" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
          Visit Shop
        </Link>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
          <ShoppingBag size={28} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-2">
            {seesAll ? "No shop orders yet." : "No shop orders linked to your account."}
          </p>
          <p className="text-xs text-gray-300 dark:text-slate-600 mb-4">
            {seesAll
              ? "Orders placed on the shop will appear here."
              : "Orders are matched by the phone or email you use at checkout."}
          </p>
          <Link href="/shop" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
            Browse the Shop
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                  <th className="px-4 py-3">{seesAll ? "Customer" : "Order"}</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  {seesAll && <th className="px-4 py-3 text-right">Update status</th>}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-paper/80 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white capitalize truncate max-w-[200px]">
                        {seesAll ? o.customer?.name || "—" : o.orderNumber}
                      </p>
                      {seesAll ? (
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-[200px] font-mono">
                          {o.orderNumber}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-[200px]">
                          {o.customer?.name}
                        </p>
                      )}
                      {o.trackingNumber && (
                        <p className="text-xs text-gray-300 dark:text-slate-600 truncate max-w-[200px] font-mono">
                          {o.trackingNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-500 whitespace-nowrap">
                      {fmtDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {formatTotal(o.total)}
                    </td>
                    {seesAll && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            value={drafts[o._id] ?? o.status}
                            onChange={(e) => setDraft(o._id, e.target.value)}
                            className="text-xs font-medium px-2 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(o._id)}
                            disabled={updating === o._id || (drafts[o._id] ?? o.status) === o.status}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-50"
                          >
                            {updating === o._id ? <Loader2 className="animate-spin" size={10} /> : "Update"}
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/orders/${o._id}`}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 transition"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTotal(total) {
  return formatGhs(total);
}