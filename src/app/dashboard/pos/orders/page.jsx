"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { ShoppingBag } from "lucide-react";
import { useOrders } from "@/hooks/queries/useOrders";
import {
  Badge, Button, Card, EmptyState, PageHeader,
  Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

const ALLOWED = ["superadmin", "admin", "staff"];

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

  const shopQ = useOrders({}, { enabled: !authLoading && isAllowed });

  const shopOrders = shopQ.data ?? [];
  const loading = shopQ.isLoading;

  if (authLoading || !isAllowed) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="Shop orders. Open one to update its status or add tracking." />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : (
        shopOrders.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={ShoppingBag}
              title="No shop orders yet"
              description="Orders placed on the storefront show up here for fulfilment."
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
                      <Td className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</Td>
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
                      <Td className="text-right">
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

