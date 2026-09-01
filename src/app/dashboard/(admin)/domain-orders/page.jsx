"use client";

import { errorMessage } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ExternalLink, Globe, RotateCw, Search, CheckCircle2, Clock, Wallet } from "lucide-react";
import { useAdminDomainOrders, useUpdateDomainOrderStatus, useRetryDomainRegistration } from "@/hooks/queries/useDomains";
import { formatGhsMajor } from "@/lib/shop";
import { isAdminRole } from "@/lib/roles";
import KpiCard from "@/components/reports/KpiCard";
import {
  Badge, Button, Card, EmptyState, Input, PageHeader,
  Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

const statusTones = {
  pending:   "warning",
  completed: "success",
  failed:    "error",
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
  const [notice, setNotice] = useState(null);

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

  // These used to be window.alert(), which blocks the tab and reads as a
  // browser error rather than a result from this page.
  const handleStatusUpdate = (orderId, status) => {
    setNotice(null);
    updateStatus.mutate(
      { id: orderId, status },
      { onError: (err) => setNotice({ tone: "error", text: errorMessage(err, "Update failed.") }) },
    );
  };

  const handleRetryRegistration = (orderId) => {
    setNotice(null);
    retryReg.mutate(orderId, {
      onSuccess: () => setNotice({ tone: "success", text: "Domain registered successfully." }),
      onError: (err) => setNotice({ tone: "error", text: errorMessage(err, "Registration retry failed.") }),
    });
  };

  const completed = orders.filter((o) => o.status === "completed");
  // Domain order prices are still whole GH₵, not pesewas — see T44.
  const totalRevenue = completed.reduce((s, o) => s + (o.price || 0), 0);

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-body-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
        >
          ← Dashboard
        </Link>

        <PageHeader
          title="Domain Orders"
          description="Manage domain registrations and payments."
          actions={
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <Globe size={18} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
            </span>
          }
        />

        {notice && (
          <div
            role="status"
            className={`mb-4 rounded-xl border px-4 py-3 text-body-sm font-medium ${
              notice.tone === "success"
                ? "border-success/20 bg-success-surface text-success dark:border-success-dark/30 dark:bg-success-surface-dark dark:text-success-dark"
                : "border-error/20 bg-error-surface text-error dark:border-error-dark/30 dark:bg-error-surface-dark dark:text-error-dark"
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Total orders" value={orders.length} icon={Globe} tone="brand" />
          <KpiCard label="Completed" value={completed.length} icon={CheckCircle2} tone="green" />
          <KpiCard label="Pending" value={orders.filter((o) => o.status === "pending").length} icon={Clock} tone="gray" />
          <KpiCard label="Revenue" value={`GH₵${totalRevenue.toLocaleString()}`} icon={Wallet} tone="brand" />
        </div>

        {/* Toolbar */}
        <Card padding="sm" className="mb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-600 dark:text-slate-400"
              />
              <Input
                label="Search domain orders"
                hideLabel
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search domain, email, customer name…"
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={filter === f.value ? "primary" : "secondary"}
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </Button>
              ))}
              <Button size="sm" variant="secondary" onClick={fetchOrders} disabled={loading}>
                <RotateCw size={14} aria-hidden="true" className={loading ? "animate-spin" : ""} /> Refresh
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card padding="none">
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          </Card>
        ) : orders.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={Globe}
              title={q || filter !== "all" ? "No domain orders match" : "No domain orders yet"}
              description={
                q || filter !== "all"
                  ? "Try a different search, or switch the status filter back to All."
                  : "Orders appear here as customers register domains through the storefront."
              }
              action={
                q || filter !== "all" ? (
                  <Button variant="secondary" onClick={() => { setSearch(""); setFilter("all"); }}>
                    Clear filters
                  </Button>
                ) : null
              }
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <TableWrap>
              <Table className="min-w-[760px]">
                <thead>
                  <tr className="bg-paper dark:bg-slate-800">
                    <Th>Domain</Th>
                    <Th>Customer</Th>
                    <Th>Price</Th>
                    <Th>Years</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id} className="transition-colors hover:bg-paper/80 dark:hover:bg-slate-800/50">
                      <Td>
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">{o.domain}</span>
                        {o.registrationError && (
                          <p
                            className="mt-0.5 max-w-[200px] truncate text-caption text-error dark:text-error-dark"
                            title={o.registrationError}
                          >
                            {o.registrationError}
                          </p>
                        )}
                      </Td>
                      <Td>
                        <p className="max-w-[180px] truncate font-medium text-gray-900 dark:text-white">
                          {o.customerName || "—"}
                        </p>
                        <p className="max-w-[180px] truncate text-caption text-gray-600 dark:text-slate-400">{o.email}</p>
                      </Td>
                      <Td className="whitespace-nowrap font-semibold text-gray-900 dark:text-white">{formatGhsMajor(o.price)}</Td>
                      <Td>{o.years || 1}yr</Td>
                      <Td>
                        <Badge tone={statusTones[o.status] || "neutral"} className="capitalize">
                          {o.status}
                        </Badge>
                      </Td>
                      <Td className="whitespace-nowrap">{fmtDate(o.createdAt)}</Td>
                      <Td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(o._id, "completed")}
                              loading={updating === o._id}
                            >
                              Mark done
                            </Button>
                          )}
                          {o.status === "completed" && o.registrationError && (
                            <Button
                              size="sm"
                              variant="brand"
                              onClick={() => handleRetryRegistration(o._id)}
                              loading={retrying === o._id}
                              title="Re-attempt registration with the registrar for this paid order"
                            >
                              {retrying !== o._id && <RotateCw size={14} aria-hidden="true" />}
                              {retrying === o._id ? "Retrying…" : "Retry registration"}
                            </Button>
                          )}
                          {o.paystackReference && (
                            <Button
                              size="sm"
                              variant="secondary"
                              href="https://dashboard.paystack.com/#/transactions"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Paystack <ExternalLink size={13} aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        )}
      </div>
    </div>
  );
}
