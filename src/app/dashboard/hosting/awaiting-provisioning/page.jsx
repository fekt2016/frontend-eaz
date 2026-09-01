"use client";

import { errorMessage } from "@/lib/api";
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
      { onSuccess: onDone, onError: (err) => onError(errorMessage(err, "Could not mark this order provisioned.")) }
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
 * VPS / Cloud / Email plans can't self-provision (a reseller plan only creates
 * cPanel accounts), so a paid order used to sit in silence after checkout. Staff
 * build the server by hand, then record it here — which activates the order and
 * emails the credentials. Oldest first, because that customer has been waiting
 * longest.
 *
 * Orders whose automatic build FAILED are listed here too. They used to appear
 * only as a number on the admin overview, with no row anywhere to act on, so the
 * customer waited unseen. They are flagged with their error rather than blending
 * in, because a failure usually has a server-side cause that will hit the next
 * order as well.
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
            description="Paid orders needing a manual build — and any whose automatic build failed — appear here the moment checkout completes."
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

              {/* A build that ERRORED and one that was never attempted both land
                  in this queue, but they need different handling: a failure is
                  usually a fixable server-side cause (missing WHM package,
                  unreachable host) that will recur on the next order too. Show
                  the reason rather than letting it read as a routine manual build. */}
              {order.provisioningStatus === "failed" && (
                <div className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 dark:border-red-900/40 dark:bg-red-900/20">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                    Automatic build failed
                  </p>
                  {order.provisioningError && (
                    <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                      {order.provisioningError}
                    </p>
                  )}
                </div>
              )}

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
