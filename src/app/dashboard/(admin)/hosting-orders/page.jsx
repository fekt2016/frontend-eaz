"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isAdminRole } from "@/lib/roles";
import { formatGhsMajor } from "@/lib/shop";
import {
  Trash2, Search, RotateCw, ExternalLink, ClipboardList,
  TriangleAlert, Server, CheckCircle2,
} from "lucide-react";
import KpiCard from "@/components/reports/KpiCard";
import {
  Badge, Button, Card, ConfirmDialog, EmptyState,
  Input, PageHeader, Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

/*
 * These were seven hand-written pill strings with NO dark: variants at all —
 * so in dark mode every status rendered brand-700 text on a near-white chip.
 * The semantic tones carry both themes and are contrast-measured.
 */
const statusTones = {
  pending:    "warning",
  paid:       "info",
  active:     "success",
  suspended:  "warning",
  cancelled:  "neutral",
  terminated: "error",
  failed:     "error",
};

const provisioningTones = {
  provisioned: "success",
  failed:      "error",
  pending:     "info",
  skipped:     "brand",
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
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isLikelyPdf(url) {
  return /\.pdf(\?|$)/i.test(url || "");
}

function ProvisioningBadge({ order }) {
  if (order.status === "pending" || order.status === "cancelled" || order.status === "failed") return null;
  const ps = order.provisioningStatus || "—";
  return (
    <Badge
      tone={provisioningTones[ps] || "neutral"}
      className="max-w-[10rem] capitalize"
      title={order.provisioningError || ""}
    >
      {String(ps).replace(/_/g, " ")}
    </Badge>
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
  const [notice, setNotice] = useState(null);
  const [terminateTarget, setTerminateTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAdminRole(user?.role)) router.replace("/dashboard");
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
    if (authLoading || !isAdminRole(user?.role)) return;
    fetchSummary();
  }, [authLoading, user?.role, fetchSummary]);

  useEffect(() => {
    if (authLoading || !isAdminRole(user?.role)) return;
    fetchOrders();
  }, [authLoading, user?.role, fetchOrders]);

  const handleRefreshAll = () => {
    fetchSummary();
    fetchOrders();
  };

  const refreshBoth = async () => {
    await fetchOrders();
    await fetchSummary();
  };

  // Failures used to arrive as window.alert(); they now land in the page's own
  // status banner, so the tab is never blocked and the message stays readable.
  const fail = (err, fallback) => setNotice({ tone: "error", text: err?.message || fallback });

  const handleStatusUpdate = async (orderId, status) => {
    setUpdating(orderId);
    setNotice(null);
    try {
      await api.patch(`/hosting/orders/${orderId}`, { status });
      await refreshBoth();
    } catch (err) {
      fail(err, "Update failed.");
    } finally {
      setUpdating(null);
    }
  };

  const runLifecycle = async (orderId, action) => {
    setUpdating(orderId);
    setNotice(null);
    try {
      const body = action === "terminate" ? { confirm: true } : {};
      await api.post(`/hosting/orders/${orderId}/${action}`, body);
      await refreshBoth();
    } catch (err) {
      fail(err, `${action} failed.`);
    } finally {
      setUpdating(null);
    }
  };

  const confirmTerminate = async () => {
    const id = terminateTarget?._id;
    setTerminateTarget(null);
    if (id) await runLifecycle(id, "terminate");
  };

  const confirmDelete = async () => {
    const id = deleteTarget?._id;
    if (!id) return;
    setDeleting(id);
    setNotice(null);
    try {
      await api.delete(`/hosting/orders/${id}`);
      setDeleteTarget(null);
      await refreshBoth();
    } catch (err) {
      fail(err, "Delete failed.");
    } finally {
      setDeleting(null);
    }
  };

  const handleAdminCpanel = async (orderId) => {
    setCpanelBusy(orderId);
    setNotice(null);
    try {
      const res = await api.get(`/hosting/orders/${orderId}/cpanel-login`);
      if (res.data?.url) window.open(res.data.url, "_blank", "noopener,noreferrer");
      else setNotice({ tone: "error", text: "No cPanel session URL was returned." });
    } catch (err) {
      fail(err, "Could not create a cPanel session.");
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

  if (authLoading || !isAdminRole(user?.role)) return null;

  const kpi = (v) => (summaryLoading ? "…" : v);

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-body-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
        >
          ← Back to Dashboard
        </Link>

        <PageHeader
          title="Hosting — Admin"
          description="Fulfillment pipeline, proofs, provisioning, and cPanel access."
          actions={
            <>
              <Button size="sm" variant="brand" href="/dashboard/hosting/new-account">
                + Create account
              </Button>
              <Button size="sm" variant="secondary" href="/dashboard/users">
                Manage users
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleRefreshAll}
                disabled={loading && summaryLoading}
              >
                <RotateCw size={15} aria-hidden="true" className={loading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
                <Server size={18} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
              </span>
            </>
          }
        />

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-error/20 bg-error-surface px-4 py-3 text-body-sm font-medium text-error dark:border-error-dark/30 dark:bg-error-surface-dark dark:text-error-dark"
          >
            {notice.text}
          </div>
        )}

        {/* Alerts */}
        {attentionAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {attentionAlerts.map((msg, i) => (
              <div
                key={i}
                role="status"
                className="flex items-start gap-2 rounded-xl border border-warning/20 bg-warning-surface px-4 py-3 text-body-sm text-warning dark:border-warning-dark/30 dark:bg-warning-surface-dark dark:text-warning-dark"
              >
                <TriangleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span>{msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* KPI cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <KpiCard label="Total orders" value={kpi(summary?.total)} sub="All hosting checkout records" />
          <KpiCard label="Pending review" value={kpi(summary?.pending)} sub="Often bank transfers — verify payout" tone="brand" />
          <KpiCard label="With proof" value={kpi(summary?.pendingBankTransfersWithProof)} sub="Pending + bank TX + receipt" tone="brand" />
          <KpiCard
            label="Paid (queue)"
            value={kpi(summary?.paid)}
            sub={`In progress WHM · ${summary?.paidProvisioningInProgress ?? 0} flagged pending`}
            tone="blue"
          />
          <KpiCard label="Live / active" value={kpi(summary?.active)} sub="Buyer can Manage hosting" tone="green" />
          <KpiCard
            label="Provision failed"
            value={kpi(summary?.provisioningFailed)}
            sub={summary?.paidProvisioningSkippedNeedsManualFulfillment
              ? `${summary.paidProvisioningSkippedNeedsManualFulfillment} skipped auto`
              : "WHM errors"}
            tone="red"
          />
        </div>

        {/* Toolbar */}
        <Card padding="sm" className="mb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative min-w-[12rem] flex-1">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-600 dark:text-slate-400"
              />
              <Input
                label="Search hosting orders"
                hideLabel
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search email, name, domain, Paystack ref, order ID…"
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {FILTER_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={statusFilter === opt.value ? "primary" : "secondary"}
                  aria-pressed={statusFilter === opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-caption text-gray-600 dark:text-slate-400">
            <ClipboardList size={13} aria-hidden="true" />
            Up to <strong className="font-semibold">200</strong> rows per request — tighten filters if you rely on pagination later.
          </p>
        </Card>

        {loading ? (
          <Card padding="none">
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          </Card>
        ) : orders.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={Server}
              title="No orders match this view"
              description="Adjust the status filter or clear the search to see more."
              action={
                statusFilter !== "all" || searchInput ? (
                  <Button variant="secondary" onClick={() => { setStatusFilter("all"); setSearchInput(""); }}>
                    Clear filters
                  </Button>
                ) : null
              }
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <TableWrap>
              <Table className="min-w-[1000px]">
                <thead>
                  <tr className="bg-paper dark:bg-slate-800">
                    <Th>Proof</Th>
                    <Th>Customer</Th>
                    <Th>Plan</Th>
                    <Th>Amount</Th>
                    <Th>Pay</Th>
                    <Th>Status</Th>
                    <Th>Provisioning</Th>
                    <Th>Dates</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const risky = order.status === "paid" && order.provisioningStatus === "failed";
                    const busy = updating === order._id;
                    return (
                      <tr
                        key={order._id}
                        className={risky
                          ? "bg-error-surface/60 dark:bg-error-surface-dark/40"
                          : "transition-colors hover:bg-paper/80 dark:hover:bg-slate-800/50"}
                      >
                        <Td className="w-28 align-middle">
                          {order.proofUploadUrl ? (
                            isLikelyPdf(order.proofUploadUrl) ? (
                              <a
                                href={order.proofUploadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-caption font-semibold text-brand-ink hover:underline dark:text-brand-400"
                              >
                                PDF receipt <ExternalLink size={12} aria-hidden="true" />
                              </a>
                            ) : (
                              <a
                                href={order.proofUploadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                                aria-label={`Open payment proof for ${order.customer?.name || "this order"}`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element -- external Cloudinary */}
                                <img
                                  src={order.proofUploadUrl}
                                  alt=""
                                  className="h-12 w-12 rounded-lg border border-gray-200 object-cover dark:border-slate-700"
                                />
                              </a>
                            )
                          ) : (
                            <span className="text-gray-500 dark:text-slate-500">—</span>
                          )}
                        </Td>
                        <Td className="align-top">
                          <p className="max-w-[14rem] truncate font-medium text-gray-900 dark:text-white" title={order.customer?.email}>
                            {order.customer?.name || "—"}
                          </p>
                          <p className="max-w-[14rem] truncate text-caption text-gray-600 dark:text-slate-400" title={order.customer?.email}>
                            {order.customer?.email}
                          </p>
                          {order.domain && (
                            <p className="mt-1 max-w-[14rem] truncate font-mono text-caption text-gray-600 dark:text-slate-400" title={order.domain}>
                              {order.domain}
                            </p>
                          )}
                        </Td>
                        <Td className="align-top capitalize">
                          <Link
                            href={`/dashboard/hosting/${order._id}`}
                            className="font-semibold text-gray-900 hover:underline dark:text-white"
                          >
                            {order.planType} · {order.tier}
                          </Link>
                          <p className="text-caption capitalize text-gray-600 dark:text-slate-400">{order.billingCycle}</p>
                        </Td>
                        {/* Hosting amounts are still whole GH₵, not pesewas — see T44. */}
                        <Td className="whitespace-nowrap align-top font-medium text-gray-900 dark:text-white">
                          {formatGhsMajor(order.amount)}
                        </Td>
                        <Td className="align-top capitalize">{(order.paymentMethod || "").replace(/_/g, " ")}</Td>
                        <Td className="align-middle">
                          <Badge tone={statusTones[order.status] || "neutral"} className="capitalize">
                            {order.status === "active" && <CheckCircle2 size={12} aria-hidden="true" />}
                            {order.status}
                          </Badge>
                        </Td>
                        <Td className="align-top">
                          <div className="space-y-1">
                            <ProvisioningBadge order={order} />
                            {order.provisioningStatus === "failed" && order.provisioningError && (
                              <p
                                className="max-w-[14rem] text-caption leading-snug text-error dark:text-error-dark"
                                title={order.provisioningError}
                              >
                                {order.provisioningError}
                              </p>
                            )}
                            {order.cpanelUsername && (
                              <p className="font-mono text-caption text-gray-600 dark:text-slate-400">u:{order.cpanelUsername}</p>
                            )}
                          </div>
                        </Td>
                        <Td className="whitespace-nowrap align-top">
                          <span className="block text-caption text-gray-600 dark:text-slate-400">Created</span>
                          <span>{formatDate(order.createdAt)}</span>
                          {order.paidAt && (
                            <>
                              <span className="mt-1 block text-caption text-gray-600 dark:text-slate-400">Paid</span>
                              <span>{formatDate(order.paidAt)}</span>
                            </>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap text-right align-middle">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <Button size="sm" variant="secondary" href={`/dashboard/hosting/${order._id}`}>
                              Open
                            </Button>
                            {order.status === "active" && order.cpanelUsername && (
                              <>
                                <Button
                                  size="sm"
                                  variant="brand"
                                  loading={cpanelBusy === order._id}
                                  onClick={() => handleAdminCpanel(order._id)}
                                >
                                  cPanel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={busy}
                                  onClick={() => runLifecycle(order._id, "suspend")}
                                >
                                  Suspend
                                </Button>
                              </>
                            )}
                            {order.status === "suspended" && (
                              <Button size="sm" disabled={busy} onClick={() => runLifecycle(order._id, "unsuspend")}>
                                Unsuspend
                              </Button>
                            )}
                            {order.status === "pending" && (
                              <Button size="sm" disabled={busy} onClick={() => handleStatusUpdate(order._id, "paid")}>
                                Mark paid
                              </Button>
                            )}
                            {order.status === "paid" && (
                              <Button size="sm" variant="secondary" disabled={busy} onClick={() => handleStatusUpdate(order._id, "paid")}>
                                Retry
                              </Button>
                            )}
                            {["active", "suspended"].includes(order.status) && order.cpanelUsername && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-error dark:text-error-dark"
                                disabled={busy}
                                onClick={() => setTerminateTarget(order)}
                              >
                                Terminate
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2 text-error dark:text-error-dark"
                              disabled={deleting === order._id}
                              onClick={() => setDeleteTarget(order)}
                              aria-label={`Delete order for ${order.customer?.name || order.customer?.email || "this customer"}`}
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </Button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!terminateTarget}
        onClose={() => setTerminateTarget(null)}
        onConfirm={confirmTerminate}
        loading={updating === terminateTarget?._id}
        title="Terminate this hosting account?"
        description={terminateTarget
          ? `${terminateTarget.domain || terminateTarget.customer?.email || "This account"} · ${terminateTarget.planType} ${terminateTarget.tier}`
          : undefined}
        confirmLabel="Terminate account"
      >
        <p className="text-body-sm text-gray-600 dark:text-slate-400">
          This permanently deletes the cPanel account and every site, mailbox and database in it.
          There is no undo and no backup on our side. To pause access instead, use Suspend.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting === deleteTarget?._id}
        title="Delete this order record?"
        description={deleteTarget?.customer?.email || undefined}
        confirmLabel="Delete order"
      >
        <p className="text-body-sm text-gray-600 dark:text-slate-400">
          This removes the order from the dashboard, including its payment proof and audit fields.
          It does not touch any cPanel account that was already provisioned.
        </p>
      </ConfirmDialog>
    </div>
  );
}
