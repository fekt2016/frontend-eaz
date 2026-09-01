"use client";

import { errorMessage } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { PackageCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { usePreorders, useReleasePreorder } from "@/hooks/queries/useOrders";
import { Alert, Button, Card, EmptyState, PageHeader, Skeleton } from "@/components/ui";

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
      onError: (err) => setError(errorMessage(err, "Could not release this pre-order.")),
      onSettled: () => setReleasing(null),
    });
  };

  return (
    <div className="space-y-5 p-5 lg:p-7">
      <PageHeader
        title="Pre-orders"
        description="Paid orders waiting on stock. Release one when the item is physically in — that moves the stock, counts the sale, and emails the customer."
      />

      <Alert tone="error">{error}</Alert>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={PackageCheck}
            title="No pre-orders waiting on stock."
            description="Paid orders appear here the moment a customer checks out on an out-of-stock item."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const pending = (order.items || []).filter((i) => i.isPreorder && !i.preorderReleasedAt);
            return (
              <Card key={order._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/dashboard/commerce/orders/${order._id}`}
                      className="font-mono text-sm font-semibold text-brand-ink hover:underline dark:text-brand-400"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                      {order.customer?.name || "Customer"} · {order.customer?.phone} · ordered {fmtDate(order.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRelease(order)}
                    loading={releasing === order._id}
                  >
                    <PackageCheck size={12} aria-hidden="true" /> Release
                  </Button>
                </div>

                <ul className="mt-3 space-y-1 border-t border-gray-100 dark:border-slate-800 pt-3">
                  {pending.map((item, i) => (
                    <li key={i} className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-slate-400">
                        {item.name}{item.variant?.sku ? ` (${item.variant.sku})` : ""} × {item.qty}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium tabular-nums">
                        {formatGhs((item.price || 0) * (item.qty || 1))}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
