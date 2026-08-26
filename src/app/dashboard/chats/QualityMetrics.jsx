"use client";

/*
 * T69 — the supervisor half of the chat console: how fast chats get answered,
 * how many get resolved, and how that splits per agent.
 *
 * Kept out of page.jsx (already 700 lines) and mounted collapsed: the endpoint
 * is admin-only and scans a date range of sessions, so it shouldn't fire on
 * every front-desk page load. First open triggers the fetch.
 */

import { useCallback, useEffect, useState } from "react";
import { BarChart3, RotateCw } from "lucide-react";
import { Badge, Button, SectionCard, Skeleton, Table, TableWrap, Td, Th } from "@/components/ui";
import { api } from "@/lib/api";

const RANGES = [
  { days: 7,  label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

/** ms → "42s" / "3m 20s" / "2h 5m". `null` (no sample) renders as an em dash. */
export function fmtDuration(ms) {
  if (ms === null || ms === undefined) return "—";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest  = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default function QualityMetrics() {
  const [days, setDays]       = useState(30);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(async (rangeDays) => {
    setLoading(true);
    setError("");
    try {
      const json = await api.get(`/chat/metrics?from=${encodeURIComponent(isoDaysAgo(rangeDays))}`);
      setData(json.data || null);
    } catch (err) {
      setError(err.message || "Could not load chat metrics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [load, days]);

  const totals = data?.totals;

  const cards = [
    { label: "Sessions",            value: totals ? totals.sessions : "—" },
    { label: "Resolved",            value: totals ? `${totals.resolutionRate}%` : "—",
      hint: totals ? `${totals.resolved} of ${totals.sessions}` : null },
    { label: "Median first reply",  value: fmtDuration(data?.firstResponse?.medianMs),
      hint: data ? `${data.firstResponse.sampleSize} answered` : null },
    { label: "Median time to close", value: fmtDuration(data?.resolution?.medianMs),
      hint: data ? `${data.resolution.sampleSize} closed` : null },
    // A 4.9 from two customers is a different claim from a 4.9 from sixty, so the
    // sample travels with the score rather than being buried in a tooltip.
    { label: "Customer rating",     value: data?.csat?.average != null ? `${data.csat.average} / 5` : "—",
      hint: data?.csat ? `${data.csat.count} rated · ${data.csat.responseRate}% of closed` : null },
  ];

  return (
    <SectionCard
      icon={BarChart3}
      iconColor="bg-brand-600"
      title="Chat quality"
      description="First-response and resolution times for the selected window, and how they split per agent."
      className="mb-6"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Metrics date range">
          {RANGES.map((r) => (
            <Button
              key={r.days}
              size="sm"
              variant={days === r.days ? "primary" : "secondary"}
              aria-pressed={days === r.days}
              onClick={() => setDays(r.days)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => load(days)}
          disabled={loading}
        >
          <RotateCw size={14} aria-hidden="true" className={loading ? "animate-spin" : ""} /> Refresh
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-body-sm text-error dark:text-error-dark">{error}</p>
      ) : loading && !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {cards.map(({ label, value, hint }) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-200 p-3 text-center dark:border-slate-800"
              >
                <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
                <p className="mt-1 text-caption text-gray-600 dark:text-slate-400">{label}</p>
                {hint && <p className="mt-0.5 text-caption text-gray-500 dark:text-slate-500">{hint}</p>}
              </div>
            ))}
          </div>

          <h3 className="mb-2 mt-6 text-body-sm font-semibold text-gray-900 dark:text-white">
            Per agent
          </h3>
          {!data?.perStaff?.length ? (
            <p className="text-body-sm text-gray-600 dark:text-slate-400">
              No agent replies in this window.
            </p>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Agent</Th>
                    <Th className="text-right">Claimed</Th>
                    <Th className="text-right">Replies</Th>
                    <Th className="text-right">Resolved</Th>
                    <Th className="text-right">Median first reply</Th>
                    <Th className="text-right">Rating</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.perStaff.map((row) => (
                    <tr key={row.staffId || "unattributed"}>
                      <Td className="font-medium text-gray-900 dark:text-white">
                        {row.staffId ? row.name : (
                          <span className="flex items-center gap-2">
                            <Badge tone="neutral">Unattributed</Badge>
                            <span className="text-caption text-gray-600 dark:text-slate-400">
                              replies sent before agent tracking
                            </span>
                          </span>
                        )}
                      </Td>
                      <Td className="text-right tabular-nums">{row.claimed}</Td>
                      <Td className="text-right tabular-nums">{row.replies}</Td>
                      <Td className="text-right tabular-nums">{row.resolved}</Td>
                      <Td className="text-right tabular-nums">
                        {fmtDuration(row.medianFirstResponseMs)}
                        {row.firstResponseSample > 0 && (
                          <span className="ml-1 text-caption text-gray-500 dark:text-slate-500">
                            ({row.firstResponseSample})
                          </span>
                        )}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {row.csatAverage == null ? "—" : (
                          <>
                            {row.csatAverage}
                            <span className="ml-1 text-caption text-gray-500 dark:text-slate-500">
                              ({row.csatCount})
                            </span>
                          </>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </>
      )}
    </SectionCard>
  );
}
