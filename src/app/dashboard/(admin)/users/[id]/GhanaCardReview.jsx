"use client";

/*
 * Ghana Card review — the admin half of the identity verification the customer
 * submits from their settings page.
 *
 * Two things here differ from ordinary admin UI, both because this is a
 * national ID rather than a product photo:
 *
 *  - The card images are stored on Cloudinary with `authenticated` delivery, so
 *    there is no URL to render. Each view asks the server to mint a signed link
 *    that expires in five minutes, and the server logs who looked. The images
 *    are therefore loaded ON DEMAND, never eagerly with the page — opening
 *    someone's profile should not log an ID inspection you did not make.
 *  - The full card number is fetched from a dedicated admin endpoint, not from
 *    the user record, because reviewing means comparing the typed number with
 *    the printed one and a masked number cannot be compared.
 */

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Clock, Eye, ShieldAlert } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Badge, Button, Card, Field, Input, Skeleton } from "@/components/ui";

const STATUS = {
  none:     { tone: "neutral", label: "Not submitted", Icon: ShieldAlert },
  pending:  { tone: "warning", label: "Pending review", Icon: Clock },
  approved: { tone: "success", label: "Verified",       Icon: BadgeCheck },
  rejected: { tone: "error",   label: "Rejected",       Icon: ShieldAlert },
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function GhanaCardReview({ userId }) {
  const [card, setCard] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [opening, setOpening] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/admin/users/${userId}/ghana-card`);
      setCard(res.data);
    } catch (err) {
      setCard({ status: "none" });
      setError(errorMessage(err));
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Mint a fresh signed URL per view. Deliberately not cached in state: the link
  // expires in five minutes, and a stale one would fail confusingly.
  async function openImage(side) {
    setOpening(side);
    setError("");
    try {
      const res = await api.get(`/admin/users/${userId}/ghana-card/image/${side}`);
      window.open(res.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setOpening("");
    }
  }

  async function decide(decision) {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/admin/users/${userId}/ghana-card`, {
        decision,
        ...(decision === "rejected" ? { reason } : {}),
      });
      setShowReject(false);
      setReason("");
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (card === null) {
    return (
      <Card className="p-6">
        <Skeleton className="h-24 w-full" />
      </Card>
    );
  }

  const meta = STATUS[card.status] || STATUS.none;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          <meta.Icon className="h-4 w-4" /> Identity (Ghana Card)
        </h2>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      {card.status === "none" ? (
        <p className="text-sm text-gray-600 dark:text-slate-400">
          This customer has not submitted a Ghana Card.
        </p>
      ) : (
        <div className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600 dark:text-slate-400">Card number</dt>
              <dd className="font-mono text-gray-900 dark:text-white">{card.number || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-600 dark:text-slate-400">Submitted</dt>
              <dd className="text-gray-900 dark:text-white">{fmt(card.submittedAt)}</dd>
            </div>
            {card.reviewedAt && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600 dark:text-slate-400">Reviewed</dt>
                <dd className="text-gray-900 dark:text-white">{fmt(card.reviewedAt)}</dd>
              </div>
            )}
            {card.status === "rejected" && card.rejectionReason && (
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600 dark:text-slate-400">Reason</dt>
                <dd className="text-error dark:text-error-dark">{card.rejectionReason}</dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary" size="sm"
              disabled={!card.hasFront}
              loading={opening === "front"}
              onClick={() => openImage("front")}
            >
              <Eye className="h-4 w-4" /> View front
            </Button>
            <Button
              variant="secondary" size="sm"
              disabled={!card.hasBack}
              loading={opening === "back"}
              onClick={() => openImage("back")}
            >
              <Eye className="h-4 w-4" /> View back
            </Button>
          </div>
          <p className="text-caption text-gray-500 dark:text-slate-500">
            Card images open in a new tab via a link that expires after five
            minutes. Each view is recorded in the activity log.
          </p>

          {card.status === "pending" && (
            <div className="border-t border-gray-100 pt-4 dark:border-slate-800">
              {!showReject ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="brand" loading={busy} onClick={() => decide("approved")}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => setShowReject(true)}>
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Why is this being rejected?" hint="The customer sees this, so make it actionable.">
                    <Input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. The back of the card is unreadable"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="danger" loading={busy} onClick={() => decide("rejected")}>
                      Confirm rejection
                    </Button>
                    <Button variant="ghost" onClick={() => { setShowReject(false); setReason(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-error dark:text-error-dark" role="alert">{error}</p>}
    </Card>
  );
}
