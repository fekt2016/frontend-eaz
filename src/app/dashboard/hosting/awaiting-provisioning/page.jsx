"use client";

import { useState } from "react";
import Link from "next/link";
import { ServerCog } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAwaitingProvisioning, useMarkProvisioned } from "@/hooks/queries/useHosting";
import { Alert, Button, Card, EmptyState, Input, PageHeader, Skeleton } from "@/components/ui";

const ALLOWED = ["admin", "superadmin", "staff"];

function fmtDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The credentials staff created by hand in Starlight Manager. The password is
 * sent to the customer once and never stored server-side.
 */
function ProvisionForm({ order, onDone, onError }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState(order.domain || "");
  const mark = useMarkProvisioned();

  const submit = (e) => {
    e.preventDefault();
    mark.mutate(
      { id: order._id, username, password, domain },
      { onSuccess: onDone, onError: (err) => onError(err.message || "Could not mark this order provisioned.") }
    );
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 border-t border-gray-100 dark:border-slate-800 pt-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
        />
        <Input
          label="Password"
          type="text"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
        />
        <Input
          label="Domain (optional)"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="their-domain.com"
        />
      </div>
      <Button type="submit" size="sm" loading={mark.isPending}>
        <ServerCog size={12} aria-hidden="true" /> Mark provisioned
      </Button>
    </form>
  );
}

/**
 * T68 — the manual provisioning queue.
 *
 * VPS / Cloud / Email plans can't self-provision (the VM has no API), so a paid
 * order used to sit in silence after checkout. Staff build the server by hand,
 * then record it here — which activates the order and emails the credentials.
 * Oldest first, because that customer has been waiting longest.
 */
export default function AwaitingProvisioningPage() {
  const { user } = useAuth();
  const isAllowed = ALLOWED.includes(user?.role);
  const { data: orders = [], isLoading } = useAwaitingProvisioning({ enabled: isAllowed });
  const [error, setError] = useState("");

  if (!isAllowed) return null;

  return (
    <div className="space-y-5 p-5 lg:p-7">
      <PageHeader
        title="Awaiting provisioning"
        description="Paid VPS, Cloud and Email orders waiting on a manual build. Create the account in Starlight Manager, enter its credentials here, and the customer gets their welcome email."
      />

      <Alert tone="error">{error}</Alert>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={ServerCog}
            title="Nothing awaiting provisioning."
            description="Paid orders that need a manual build appear here the moment checkout completes."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/dashboard/hosting/${order._id}`}
                    className="font-mono text-sm font-semibold text-brand-ink hover:underline dark:text-brand-400"
                  >
                    {order.paystackReference || order._id}
                  </Link>
                  <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                    {order.customer?.name || "Customer"} · {order.customer?.email} · paid {fmtDate(order.paidAt || order.createdAt)}
                  </p>
                </div>
                {/* Hosting amounts are still whole GH₵, not pesewas — see T44. */}
                <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  GH₵{order.amount}
                  <span className="ml-1 text-xs font-normal text-gray-500 dark:text-slate-400">/ {order.billingCycle}</span>
                </p>
              </div>

              <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">
                {order.planType} · {order.tier}
              </p>

              <ProvisionForm
                order={order}
                onDone={() => setError("")}
                onError={(msg) => setError(msg)}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
