"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fmtDate } from "@/components/dashboard/customer/CustomerCards";
import { useMyRepairs } from "@/hooks/queries/useRepairs";
import {
  Badge, Button, Card, EmptyState, PageHeader,
  Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

// T22: staff/technician had a second, overlapping repair-jobs view here
// (read-only, unscoped by assignment — up to 50 most recent jobs system-
// wide) alongside their own better-suited pages. Redirect them to whichever
// one is actually theirs per posNav: technicians land on /dashboard/pos
// ("My Jobs" — jobs assigned to them, with stats); staff/admin/superadmin
// land on /dashboard/pos/jobs ("Jobs" — the full filterable jobs list).
// Customers are unaffected — this page stays their one repairs view.
const STAFF_LIKE_ROLES = ["superadmin", "admin", "staff"];

/* Semantic tones only — see components/ui/Badge.jsx. Waiting-for-parts reads
 * as warning (action needed elsewhere), repairing as brand (actively ours). */
const REPAIR_STATUS_TONES = {
  received:          { tone: "info",    label: "Received" },
  diagnosing:        { tone: "info",    label: "Diagnosing" },
  waiting_for_parts: { tone: "warning", label: "Waiting for Parts" },
  repairing:         { tone: "brand",   label: "Repairing" },
  ready:             { tone: "success", label: "Ready" },
  collected:         { tone: "neutral", label: "Collected" },
  cancelled:         { tone: "neutral", label: "Cancelled" },
};

export default function CustomerRepairsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isTechnician = user?.role === "technician";
  const isStaffLike = STAFF_LIKE_ROLES.includes(user?.role);

  useEffect(() => {
    if (authLoading) return;
    if (isTechnician) { router.replace("/dashboard/pos"); return; }
    if (isStaffLike) { router.replace("/dashboard/pos/jobs"); return; }
  }, [authLoading, isTechnician, isStaffLike, router]);

  const { data: repairs = [], isLoading: loading } = useMyRepairs({
    enabled: !authLoading && !isTechnician && !isStaffLike,
  });

  // While redirecting a staff/technician role away, render nothing.
  if (authLoading || isTechnician || isStaffLike) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-20">
      <PageHeader
        title="My Repairs"
        description="Device repairs booked in-store, matched by your phone number."
        actions={<Button href="/repair" size="sm">Create a Repair Job</Button>}
      />

      {loading ? (
        <Card>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        </Card>
      ) : repairs.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Wrench}
            title="No repairs linked to your account yet."
            description="Create a repair job online — bring your device in or have a rider collect it."
            action={<Button href="/repair">Create a Repair Job</Button>}
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <TableWrap>
            <Table className="min-w-[760px]">
              <thead>
                <tr className="bg-paper dark:bg-slate-800/50">
                  <Th>Device</Th>
                  <Th>Job #</Th>
                  <Th>Fault</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {repairs.map((j) => {
                  const badge = REPAIR_STATUS_TONES[j.status] || REPAIR_STATUS_TONES.received;
                  const device = [j.deviceBrand, j.deviceModel].filter(Boolean).join(" ") || "Device";
                  // Only customers ever reach this table now (staff/technician
                  // are redirected away above), so this always links out to
                  // the public tracking page, never the staff job detail page.
                  const href = j.trackingToken ? `/track/${j.trackingToken}` : null;
                  return (
                    <tr
                      key={j._id}
                      onClick={() => href && router.push(href)}
                      className="cursor-pointer hover:bg-paper dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <Td className="font-medium text-gray-900 dark:text-white">{device}</Td>
                      <Td className="text-xs font-mono text-gray-600 dark:text-slate-400 whitespace-nowrap">{j.jobNumber || "—"}</Td>
                      <Td className="text-xs text-gray-600 dark:text-slate-400 truncate max-w-[220px]">{j.faultDescription || "—"}</Td>
                      <Td className="text-xs text-gray-600 dark:text-slate-400 whitespace-nowrap">{fmtDate(j.createdAt)}</Td>
                      <Td>
                        <Badge tone={badge.tone} className="capitalize whitespace-nowrap">{badge.label}</Badge>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        {href ? (
                          <Button
                            href={href}
                            variant="secondary"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-600">—</span>
                        )}
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
  );
}
