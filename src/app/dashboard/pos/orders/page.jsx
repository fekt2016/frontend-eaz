"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { ShoppingBag, Wrench, Loader2 } from "lucide-react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/queries/useOrders";
import { usePartOrders, useUpdatePosOrderStatus } from "@/hooks/queries/usePosDashboard";
import {
  Alert, Badge, Button, Card, EmptyState, PageHeader,
  Select, Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

const ALLOWED = ["superadmin", "admin", "staff"];

const SHOP_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
const PART_STATUSES = ["pending", "paid", "cancelled"];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The status dropdown, with a real label and a saving indicator. */
function StatusSelect({ value, statuses, disabled, saving, onChange, label }) {
  return (
    <div className="flex items-center justify-end gap-2">
      {saving && <Loader2 aria-hidden="true" className="animate-spin text-gray-600 dark:text-slate-400" size={14} />}
      <Select
        label={label}
        hideLabel
        size="sm"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="capitalize"
      >
        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
      </Select>
    </div>
  );
}

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
      <PageHeader title="Orders" description="Review and update product & repair part orders." />

      <div className="flex gap-2" role="group" aria-label="Order type">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "primary" : "secondary"}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            <Icon size={15} aria-hidden="true" /> {label}
            <span className="opacity-70">{count}</span>
          </Button>
        ))}
      </div>

      <Alert tone="error">{error}</Alert>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : tab === "shop" ? (
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
                        <StatusSelect
                          label={`Status for order ${order.orderNumber}`}
                          value={order.status}
                          statuses={SHOP_STATUSES}
                          disabled={savingId === order._id}
                          saving={savingId === order._id}
                          onChange={(s) => updateShopStatus(order._id, s)}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        )
      ) : partOrders.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Wrench}
            title="No repair part orders yet"
            description="Parts ordered for a repair job appear here."
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <TableWrap>
            <Table>
              <thead>
                <tr className="bg-paper dark:bg-slate-800">
                  <Th>Part(s)</Th>
                  <Th>Customer</Th>
                  <Th>Job</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {partOrders.map(order => (
                  <tr key={order._id}>
                    <Td className="max-w-[220px] truncate font-semibold text-gray-900 dark:text-white">
                      {order.orderType === "repair"
                        ? (order.items || []).map(i => `${i.partName} ×${i.quantity}`).join(", ")
                        : order.partName}
                      {order.orderType === "repair" && (
                        <Badge tone="brand" className="ml-2 uppercase">Multi-part</Badge>
                      )}
                    </Td>
                    <Td>
                      {order.customerName || "—"}
                      <span className="block text-caption text-gray-600 dark:text-slate-400">
                        {order.customerPhone || "—"}
                      </span>
                    </Td>
                    <Td>
                      {order.job?.jobNumber ? (
                        <Link
                          href={`/dashboard/pos/jobs/${order.job._id}`}
                          className="text-brand-ink hover:underline dark:text-brand-400"
                        >
                          {order.job.jobNumber}
                        </Link>
                      ) : "—"}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {formatDate(order.createdAt)}
                      {order.orderType === "repair"
                        ? (order.shippingFeePesewas > 0
                            ? <span className="block text-caption text-gray-600 dark:text-slate-400">incl. shipping</span>
                            : null)
                        : <span className="block text-caption text-gray-600 dark:text-slate-400">Qty {order.quantity}</span>}
                    </Td>
                    <Td className="whitespace-nowrap text-right font-semibold text-gray-900 dark:text-white">
                      {order.orderType === "repair"
                        ? formatGhs(order.totalPesewas)
                        : formatGhs(order.amountPesewas)}
                    </Td>
                    <Td className="text-right">
                      <StatusSelect
                        label={`Status for ${order.partName || "this part order"}`}
                        value={order.status}
                        statuses={PART_STATUSES}
                        disabled={savingId === order._id}
                        saving={savingId === order._id}
                        onChange={(s) => updatePartStatus(order._id, s, order.orderType)}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Card>
      )}
    </div>
  );
}
