"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  FaTrash,
  FaSearch,
  FaRedo,
  FaExternalLinkAlt,
  FaClipboardList,
  FaExclamationTriangle,
  FaSpinner,
  FaServer,
  FaCheckCircle,
} from "react-icons/fa";

const statusColors = {
  pending: "bg-brand-50 text-brand-700 ring-brand-100",
  paid: "bg-blue-50 text-blue-700 ring-blue-100",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  suspended: "bg-orange-50 text-orange-700 ring-orange-100",
  cancelled: "bg-red-50 text-red-700 ring-red-100",
  terminated: "bg-red-50 text-red-700 ring-red-100",
  failed: "bg-red-50 text-red-700 ring-red-100",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending review" },
  { value: "paid", label: "Paid (provisioning)" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "terminated", label: "Terminated" },
];

function buildOrdersQuery(statusFilter, search) {
  const p = new URLSearchParams();
  if (statusFilter && statusFilter !== "all") p.set("status", statusFilter);
  if (search && search.trim()) p.set("q", search.trim());
  const qs = p.toString();
  return qs ? `/hosting/orders?${qs}` : "/hosting/orders";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isLikelyPdf(url) {
  return /\.pdf(\?|$)/i.test(url || "");
}

function StatCard({ label, value, hint, accent }) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${accent || "text-gray-900 dark:text-white"}`}>{value ?? "—"}</p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-slate-500 leading-snug">{hint}</p>}
    </div>
  );
}

function ProvisioningBadge({ order }) {
  if (order.status === "pending" || order.status === "cancelled" || order.status === "failed") return null;
  const ps = order.provisioningStatus || "—";
  const tone =
    ps === "provisioned"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
      : ps === "failed"
        ? "bg-red-50 text-red-800 ring-red-100"
        : ps === "pending"
          ? "bg-blue-50 text-blue-800 ring-blue-100"
          : ps === "skipped"
            ? "bg-violet-50 text-violet-800 ring-violet-100"
            : "bg-paper text-gray-700 ring-gray-100";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 ${tone} capitalize max-w-[10rem]`} title={order.provisioningError || ""}>
      {String(ps).replace(/_/g, " ")}
    </span>
  );
}

export default function AdminHostingOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [cpanelBusy, setCpanelBusy] = useState(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 360);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await api.get("/hosting/orders/admin-summary");
      setSummary(res.data || null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(buildOrdersQuery(statusFilter, debouncedSearch));
      setOrders(res.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    if (authLoading || user?.role !== "admin") return;
    fetchSummary();
  }, [authLoading, user?.role, fetchSummary]);

  useEffect(() => {
    if (authLoading || user?.role !== "admin") return;
    fetchOrders();
  }, [authLoading, user?.role, fetchOrders]);

  const handleRefreshAll = () => {
    fetchSummary();
    fetchOrders();
  };

  const handleStatusUpdate = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.patch(`/hosting/orders/${orderId}`, { status });
      await fetchOrders();
      await fetchSummary();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const handleLifecycle = async (orderId, action) => {
    if (action === "terminate" && !confirm("Terminate this hosting account? This permanently deletes the cPanel account and all its data. This cannot be undone.")) return;
    setUpdating(orderId);
    try {
      const body = action === "terminate" ? { confirm: true } : {};
      await api.post(`/hosting/orders/${orderId}/${action}`, body);
      await fetchOrders();
      await fetchSummary();
    } catch (err) {
      alert(err.message || `${action} failed`);
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    setDeleting(orderId);
    try {
      await api.delete(`/hosting/orders/${orderId}`);
      await fetchOrders();
      await fetchSummary();
    } catch (err) {
      alert(err.message || "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleAdminCpanel = async (orderId) => {
    setCpanelBusy(orderId);
    try {
      const res = await api.get(`/hosting/orders/${orderId}/cpanel-login`);
      if (res.data?.url) window.open(res.data.url, "_blank", "noopener,noreferrer");
      else alert("No session URL returned");
    } catch (err) {
      alert(err.message || "Could not create cPanel session");
    } finally {
      setCpanelBusy(null);
    }
  };

  const attentionAlerts = useMemo(() => {
    if (!summary) return [];
    const a = [];
    if (summary.provisioningFailed > 0) {
      a.push(`${summary.provisioningFailed} paid order(s) with provisioning failed — filter “Paid” and retry after fixing WHM config.`);
    }
    if (summary.paidProvisioningSkippedNeedsManualFulfillment > 0) {
      a.push(`${summary.paidProvisioningSkippedNeedsManualFulfillment} paid order(s) skipped auto‑provisioning — fulfill manually if required.`);
    }
    return a;
  }, [summary]);

  if (authLoading || user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="mb-4 inline-block text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-11 h-11 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <FaServer size={20} className="text-brand-600 dark:text-brand-400" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Hosting — Admin</h1>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">Fulfillment pipeline, proofs, provisioning, and cPanel access.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link
                href="/dashboard/hosting/new-account"
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition"
              >
                + Create account
              </Link>
              <Link
                href="/dashboard/users"
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 transition"
              >
                Manage users
              </Link>
              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={loading && summaryLoading}
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 transition disabled:opacity-50"
              >
                <FaRedo size={11} /> Refresh metrics & list
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {attentionAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {attentionAlerts.map((msg, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border border-brand-200 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/20 px-4 py-3 text-sm text-brand-900 dark:text-brand-300"
              >
                <FaExclamationTriangle className="shrink-0 mt-0.5 text-brand-600" />
                <span>{msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          <StatCard
            label="Total orders"
            value={summaryLoading ? "…" : summary?.total}
            hint="All hosting checkout records"
          />
          <StatCard
            label="Pending review"
            value={summaryLoading ? "…" : summary?.pending}
            hint="Often bank transfers — verify payout"
            accent="text-brand-700"
          />
          <StatCard
            label="With proof uploaded"
            value={summaryLoading ? "…" : summary?.pendingBankTransfersWithProof}
            hint="Pending + bank TX + receipt"
            accent="text-brand-800"
          />
          <StatCard
            label="Paid (queue)"
            value={summaryLoading ? "…" : summary?.paid}
            hint={`In progress WHM · ${summary?.paidProvisioningInProgress ?? 0} flagged pending`}
            accent="text-blue-700"
          />
          <StatCard label="Live / active" value={summaryLoading ? "…" : summary?.active} hint="Buyer can Manage hosting" accent="text-emerald-700" />
          <StatCard
            label="Provision failed"
            value={summaryLoading ? "…" : summary?.provisioningFailed}
            hint={summary?.paidProvisioningSkippedNeedsManualFulfillment ? `${summary.paidProvisioningSkippedNeedsManualFulfillment} skipped auto` : "WHM errors"}
            accent="text-red-600"
          />
        </div>

        {/* Toolbar */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 min-w-[12rem]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={13} />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search email, name, domain, Paystack ref, Mongo order ID…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-300 dark:focus:border-brand-600"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border transition ${
                    statusFilter === opt.value
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                      : "bg-paper dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-gray-400 dark:text-slate-500">
            <FaClipboardList className="inline mr-1 -mt-px" size={11} /> Up to <strong className="text-gray-600 dark:text-slate-400">200</strong> rows per request —
            tighten filters if you rely on pagination later.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500 dark:text-slate-400">
            <FaSpinner className="animate-spin text-2xl text-brand-500" />
            <span className="text-sm">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">No orders match this view.</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Adjust filters or clear search.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                    <th className="px-4 py-3 whitespace-nowrap">Proof</th>
                    <th className="px-4 py-3 whitespace-nowrap">Customer</th>
                    <th className="px-4 py-3 whitespace-nowrap">Plan</th>
                    <th className="px-4 py-3 whitespace-nowrap">Amount</th>
                    <th className="px-4 py-3 whitespace-nowrap">Pay</th>
                    <th className="px-4 py-3 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 whitespace-nowrap">Provisioning</th>
                    <th className="px-4 py-3 whitespace-nowrap">Dates</th>
                    <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {orders.map((order) => {
                    const risky = order.status === "paid" && order.provisioningStatus === "failed";
                    return (
                      <tr key={order._id} className={risky ? "bg-red-50/40 dark:bg-red-900/10" : "hover:bg-paper/80 dark:hover:bg-slate-800/50"}>
                        <td className="px-4 py-3 align-middle w-28">
                          {order.proofUploadUrl ? (
                            isLikelyPdf(order.proofUploadUrl) ? (
                              <a
                                href={order.proofUploadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                              >
                                PDF receipt <FaExternalLinkAlt size={9} />
                              </a>
                            ) : (
                              <a href={order.proofUploadUrl} target="_blank" rel="noopener noreferrer" className="block">
                                {/* eslint-disable-next-line @next/next/no-img-element -- external Cloudinary */}
                                <img
                                  src={order.proofUploadUrl}
                                  alt=""
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-slate-700"
                                />
                              </a>
                            )
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-gray-900 dark:text-white truncate max-w-[14rem]" title={order.customer?.email}>
                            {order.customer?.name || "—"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[14rem]" title={order.customer?.email}>{order.customer?.email}</p>
                          {order.domain && (
                            <p className="text-xs font-mono text-gray-600 dark:text-slate-400 mt-1 truncate max-w-[14rem]" title={order.domain}>{order.domain}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top capitalize">
                          <Link href={`/dashboard/hosting/${order._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 hover:underline">
                            {order.planType} · {order.tier}
                          </Link>
                          <p className="text-xs text-gray-400 dark:text-slate-500 capitalize">{order.billingCycle}</p>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap font-medium text-gray-900 dark:text-white">GH₵{order.amount}</td>
                        <td className="px-4 py-3 align-top capitalize text-xs text-gray-600 dark:text-slate-400">
                          {(order.paymentMethod || "").replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ring-1 ${statusColors[order.status] || "bg-gray-100 text-gray-600 ring-gray-100"
                              }`}
                          >
                            {order.status === "active" ? <FaCheckCircle size={10} /> : null}
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="space-y-1">
                            <ProvisioningBadge order={order} />
                            {order.provisioningStatus === "failed" && order.provisioningError && (
                              <p className="text-[10px] text-red-600 dark:text-red-400 leading-snug max-w-[14rem]" title={order.provisioningError}>
                                {order.provisioningError}
                              </p>
                            )}
                            {order.cpanelUsername && (
                              <p className="text-[10px] font-mono text-gray-600 dark:text-slate-400">u:{order.cpanelUsername}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-gray-500 dark:text-slate-500 whitespace-nowrap">
                          <span className="block">Created</span>
                          <span className="text-gray-800 dark:text-slate-300">{formatDate(order.createdAt)}</span>
                          {order.paidAt && (
                            <>
                              <span className="block mt-1">Paid</span>
                              <span className="text-gray-800 dark:text-slate-300">{formatDate(order.paidAt)}</span>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <Link
                              href={`/dashboard/hosting/${order._id}`}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-800 dark:text-slate-300"
                            >
                              Open
                            </Link>
                            {order.status === "active" && order.cpanelUsername && (
                              <button
                                type="button"
                                disabled={cpanelBusy === order._id}
                                onClick={() => handleAdminCpanel(order._id)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 inline-flex items-center gap-1"
                              >
                                {cpanelBusy === order._id ? <FaSpinner size={11} className="animate-spin" /> : null}
                                cPanel
                              </button>
                            )}
                            {order.status === "active" && order.cpanelUsername && (
                              <button
                                type="button"
                                onClick={() => handleLifecycle(order._id, "suspend")}
                                disabled={updating === order._id}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-900/40 dark:text-orange-400 disabled:opacity-50"
                              >
                                {updating === order._id ? "…" : "Suspend"}
                              </button>
                            )}
                            {order.status === "suspended" && (
                              <button
                                type="button"
                                onClick={() => handleLifecycle(order._id, "unsuspend")}
                                disabled={updating === order._id}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {updating === order._id ? "…" : "Unsuspend"}
                              </button>
                            )}
                            {order.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(order._id, "paid")}
                                disabled={updating === order._id}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50"
                              >
                                {updating === order._id ? "…" : "Mark paid"}
                              </button>
                            )}
                            {order.status === "paid" && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(order._id, "paid")}
                                disabled={updating === order._id}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {updating === order._id ? "…" : "Retry"}
                              </button>
                            )}
                            {["active", "suspended"].includes(order.status) && order.cpanelUsername && (
                              <button
                                type="button"
                                onClick={() => handleLifecycle(order._id, "terminate")}
                                disabled={updating === order._id}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 disabled:opacity-50"
                              >
                                {updating === order._id ? "…" : "Terminate"}
                              </button>
                            )}
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => handleDelete(order._id)}
                              disabled={deleting === order._id}
                              className="p-1.5 rounded-full text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                            >
                              {deleting === order._id ? <FaSpinner size={13} className="animate-spin" /> : <FaTrash size={13} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
