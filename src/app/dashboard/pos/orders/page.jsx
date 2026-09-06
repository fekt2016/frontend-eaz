"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { errorMessage } from "@/lib/api";
import { PackageCheck, ShoppingBag } from "lucide-react";
import { useOrders, useReleasePreorder } from "@/hooks/queries/useOrders";
import { preorderState, PreorderBadge } from "@/components/dashboard/PreorderBadge";
import {
  Alert, Badge, Button, Card, EmptyState, PageHeader,
  Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

const ALLOWED = ["superadmin", "admin", "staff"];

/*
 * The pre-order release queue is a view of this list, not a page of its own.
 *
 * It was /dashboard/commerce/preorders: the same order rows plus one button. As
 * a second implementation of "list orders" it had already drifted — no search,
 * no pagination, against an endpoint capped at 10, so with twelve customers
 * waiting two were invisible with nothing on screen saying so. One list means
 * one set of columns, one pagination and one permissions check.
 */
const VIEWS = [
  { key: "all", label: "All orders", params: {} },
  // Server-sorted oldest-first: the customer who has waited longest is served
  // first. The default list is newest-first — right for browsing, wrong for a queue.
  { key: "awaiting", label: "Awaiting release", params: { preorder: "pending" } },
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PosOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isAllowed = ALLOWED.includes(user?.role);

  // Only staff and above may manage orders; send technicians back to their jobs.
  useEffect(() => {
    if (!authLoading && !isAllowed) router.replace("/dashboard/pos");
  }, [authLoading, isAllowed, router]);

  const [view, setView] = useState("all");
  const [error, setError] = useState("");
  const [releasing, setReleasing] = useState(null);
  const release = useReleasePreorder();

  const activeView = VIEWS.find((v) => v.key === view) || VIEWS[0];
  const shopQ = useOrders(
    { ...activeView.params, limit: 100 },
    { enabled: !authLoading && isAllowed }
  );

  const shopOrders = shopQ.data ?? [];
  const loading = shopQ.isLoading;

  const handleRelease = (order) => {
    setError("");
    setReleasing(order._id);
    release.mutate(order._id, {
      onError: (err) => setError(errorMessage(err)),
      onSettled: () => setReleasing(null),
    });
  };

  if (authLoading || !isAllowed) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Shop orders. Open one to update its status or add tracking." />

      <div className="flex gap-2" role="tablist" aria-label="Order views">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              view === v.key
                ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-500"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : (
        shopOrders.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={ShoppingBag}
              title={view === "awaiting" ? "Nothing waiting on stock" : "No shop orders yet"}
              description={
                view === "awaiting"
                  ? "Pre-orders appear here until their stock lands and you release them."
                  : "Orders placed on the storefront show up here for fulfilment."
              }
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <TableWrap>
              <Table>
                <thead>
                  <tr className="bg-paper dark:bg-slate-800">
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th>Date</Th>
                    <Th>Items</Th>
                    <Th className="text-right">Total</Th>
                    <Th className="text-right">Status</Th>
                    <Th className="text-right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {shopOrders.map(order => (
                    <tr key={order._id}>
                      <Td className="font-semibold text-gray-900 dark:text-white">
                        {order.orderNumber}
                        {preorderState(order) && (
                          <span className="mt-1 block"><PreorderBadge state={preorderState(order)} /></span>
                        )}
                      </Td>
                      <Td>
                        {order.customer?.name || "—"}
                        <span className="block text-caption text-gray-600 dark:text-slate-400">
                          {order.customer?.phone || "—"}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap">{formatDate(order.createdAt)}</Td>
                      <Td>{order.items?.reduce((n, i) => n + (i.qty || 0), 0) || 0}</Td>
                      <Td className="whitespace-nowrap text-right font-semibold text-gray-900 dark:text-white">
                        {formatGhs(order.total)}
                      </Td>
                      <Td className="text-right">
                        <Badge tone="neutral" className="capitalize">{order.status}</Badge>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        {preorderState(order) === "pending" && (
                          <Button
                            size="sm"
                            className="mr-2"
                            onClick={() => handleRelease(order)}
                            disabled={releasing === order._id}
                          >
                            <PackageCheck size={12} aria-hidden="true" />
                            {releasing === order._id ? "Releasing…" : "Release"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          href={`/dashboard/commerce/orders/${order._id}`}
                        >
                          View
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        )
      )}
    </div>
  );
}

