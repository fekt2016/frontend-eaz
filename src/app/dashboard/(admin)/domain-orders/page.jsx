"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaRedo, FaSpinner } from "react-icons/fa";
import { Globe, Search, RotateCw, Loader2, ExternalLink } from "lucide-react";
import { useAdminDomainOrders, useUpdateDomainOrderStatus, useRetryDomainRegistration } from "@/hooks/queries/useDomains";
import { isAdminRole } from "@/lib/roles";
import { formatGhsMajor } from "@/lib/shop";

const statusColors = {
  pending:   "bg-brand-50 text-brand-700 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:ring-brand-900/30",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-900/30",
  failed:    "bg-red-50 text-red-700 ring-red-100 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-900/30",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDomainOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/dashboard");
  }, [authLoading, isAdmin, router]);

  const domainOrdersQ = useAdminDomainOrders(filter, { enabled: !authLoading && isAdmin });
  const allOrders = domainOrdersQ.data ?? [];
  const loading = domainOrdersQ.isLoading;
  const fetchOrders = () => domainOrdersQ.refetch();
  const q = search.trim().toLowerCase();
  const orders = q
    ? allOrders.filter((o) =>
        o.domain?.includes(q) || o.email?.includes(q) || o.customerName?.toLowerCase().includes(q))
    : allOrders;

  const updateStatus = useUpdateDomainOrderStatus();
  const updating = updateStatus.isPending ? updateStatus.variables?.id : null;

  const retryReg = useRetryDomainRegistration();
  const retrying = retryReg.isPending ? retryReg.variables : null;

  if (authLoading || !isAdmin) return null;

  const handleStatusUpdate = (orderId, status) => {
    updateStatus.mutate({ id: orderId, status }, { onError: (err) => alert(err.message || "Update failed") });
  };

  const handleRetryRegistration = (orderId) => {
    retryReg.mutate(orderId, {
      onSuccess: () => alert("Domain registered successfully."),
      onError: (err) => alert(err.message || "Registration retry failed."),
    });
  };

  const totalRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + (o.price || 0), 0);

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="mb-4 inline-block text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">← Dashboard</Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Globe size={18} className="text-violet-600 dark:text-violet-400" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Domain Orders</h1>
              <p className="text-gray-400 dark:text-slate-500 text-sm">Manage domain registrations and payments.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total orders", value: orders.length },
            { label: "Completed", value: orders.filter(o => o.status === "completed").length, accent: "text-emerald-700" },
            { label: "Pending", value: orders.filter(o => o.status === "pending").length, accent: "text-brand-700" },
            { label: "Revenue", value: formatGhsMajor(totalRevenue), accent: "text-gray-900" },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">{label}</p>
              <p className={`mt-2 text-2xl font-bold tabular-nums ${accent || "text-gray-900 dark:text-white"}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={12} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search domain, email, customer name…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-300"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button key={f.value} type="button" onClick={() => setFilter(f.value)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border transition ${filter === f.value ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white" : "bg-paper dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500"}`}>
                  {f.label}
                </button>
              ))}
              <button type="button" onClick={fetchOrders} disabled={loading}
className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50">
                <RotateCw size={10} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400 dark:text-slate-500">
            <Loader2 className="animate-spin text-brand-500" size={24} />
            <span className="text-sm">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
            <p className="text-gray-400 dark:text-slate-500 text-sm">No domain orders found.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[700px] w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Years</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-paper/80 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">{o.domain}</span>
                        {o.registrationError && (
                          <p className="text-xs text-red-500 mt-0.5 truncate max-w-[200px]" title={o.registrationError}>{o.registrationError}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">{o.customerName || "—"}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate max-w-[180px]">{o.email}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatGhsMajor(o.price)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400">{o.years || 1}yr</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 capitalize ${statusColors[o.status] || "bg-paper text-gray-600 ring-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-500 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.status === "pending" && (
                            <button type="button" onClick={() => handleStatusUpdate(o._id, "completed")}
                              disabled={updating === o._id}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                              {updating === o._id ? "…" : "Mark done"}
                            </button>
                          )}
                          {o.status === "completed" && o.registrationError && (
                            <button type="button" onClick={() => handleRetryRegistration(o._id)}
                              disabled={retrying === o._id}
                              title="Re-attempt Namecheap registration for this paid order"
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 inline-flex items-center gap-1">
                              {retrying === o._id
                                ? <><FaSpinner className="animate-spin" size={9} /> Retrying…</>
                                : <><FaRedo size={9} /> Retry registration</>}
                            </button>
                          )}
                          {o.paystackReference && (
                            <a href={`https://dashboard.paystack.com/#/transactions`} target="_blank" rel="noopener noreferrer"
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500 inline-flex items-center gap-1">
                              Paystack <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
