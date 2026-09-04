"use client";

/*
 * Ghana Card identity verification (owner request, 2026-08-30).
 *
 * Manual admin review by decision, not an automated NIA check: the card number
 * and both card images are submitted here, an admin approves or rejects on the
 * user detail page.
 *
 * The images are NOT uploaded through the app's shared /uploads route. That
 * route is admin/staff-only and stores files publicly on Cloudinary, where
 * anyone holding the link can fetch them forever — acceptable for a product
 * photo, not for a national ID. They go to POST /account/ghana-card instead,
 * which stores them with authenticated delivery so only a short-lived signed
 * URL can read them back.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Clock, ShieldAlert, Upload, X } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Badge, Button, Field, Input, SectionCard } from "@/components/ui";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

// GHA-XXXXXXXXX-X — nine digits then a check digit. Mirrors the server regex;
// the server is authoritative, this just avoids a pointless round trip.
const CARD_RE = /^GHA-\d{9}-\d$/;

// The input holds raw digits (like the phone field); the masked GHA-XXXX at
// the end. Nine digits then a check digit.
function maskCardNumber(digits) {
  const d = digits.slice(0, 10);
  const body = d.slice(0, 9);
  const check = d.slice(9);
  return check ? `GHA-${body}-${check}` : `GHA-${body}`;
}

// Keep only digits, capped at ten — the field never shows the mask while typing,
// so a stray "GHA-" or "-" from the placeholder can never wipe the input.
function digitsOnly(raw) {
  return String(raw).replace(/\D/g, "").slice(0, 10);
}

const STATUS = {
  none:     { tone: "neutral", label: "Not submitted", Icon: ShieldAlert },
  pending:  { tone: "warning", label: "Under review",  Icon: Clock },
  approved: { tone: "success", label: "Verified",      Icon: BadgeCheck },
  rejected: { tone: "error",   label: "Rejected",      Icon: ShieldAlert },
};

function FilePick({ label, file, onPick, onClear, inputRef }) {
  return (
    <Field label={label}>
      {file ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 dark:border-slate-700">
          <span className="truncate text-sm text-gray-900 dark:text-white">{file.name}</span>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${label}`}
            className="rounded p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-600 hover:border-gray-400 dark:border-slate-700 dark:text-slate-400"
        >
          <Upload size={16} aria-hidden="true" /> Choose image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
    </Field>
  );
}

export default function IdentitySection() {
  const [state, setState] = useState(null);
  const [number, setNumber] = useState("");
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const frontRef = useRef(null);
  const backRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/account/ghana-card");
      setState(res.data);
    } catch {
      setState({ status: "none" });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!CARD_RE.test(maskCardNumber(number))) {
      setError("Enter your card number in the form GHA-123456789-0.");
      return;
    }
    if (!front || !back) {
      setError("Both the front and back of the card are required.");
      return;
    }
    for (const [f, side] of [[front, "front"], [back, "back"]]) {
      if (f.size > MAX_BYTES) {
        setError(`The ${side} image is larger than 5MB. Please choose a smaller photo.`);
        return;
      }
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("number", maskCardNumber(number));
      body.append("front", front);
      body.append("back", back);
      const res = await api.upload("/account/ghana-card", body);
      setState(res.data);
      setFront(null);
      setBack(null);
      setNumber("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const status = state?.status || "none";
  const meta = STATUS[status] || STATUS.none;
  const canSubmit = status === "none" || status === "rejected";

  return (
    <SectionCard
      icon={meta.Icon}
      title="Identity Verification"
      description="Verify your identity with your Ghana Card."
      iconColor="bg-info"
    >
      <div className="mb-4 flex items-center gap-3">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {state?.maskedNumber && (
          <span className="text-sm text-gray-600 dark:text-slate-400">{state.maskedNumber}</span>
        )}
      </div>

      {status === "pending" && (
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Your card is with our team for review. We&apos;ll update this page once it&apos;s checked.
        </p>
      )}

      {status === "approved" && (
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Your identity is verified. Contact support if your card details change.
        </p>
      )}

      {status === "rejected" && state?.rejectionReason && (
        <p className="mb-4 text-sm text-error dark:text-error-dark">
          Rejected: {state.rejectionReason}. You can submit again below.
        </p>
      )}

      {canSubmit && (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Ghana Card number" hint="Printed on the front of the card.">
            <Input
              value={number}
              onChange={(e) => setNumber(digitsOnly(e.target.value))}
              placeholder="GHA-123456789-0"
              inputMode="numeric"
              maxLength={10}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <FilePick label="Front of card" file={front} inputRef={frontRef}
              onPick={setFront} onClear={() => setFront(null)} />
            <FilePick label="Back of card" file={back} inputRef={backRef}
              onPick={setBack} onClear={() => setBack(null)} />
          </div>

          {/* Say plainly what happens to the images — this is a national ID, and
              a person handing one over is entitled to know. */}
          <p className="text-caption text-gray-500 dark:text-slate-500">
            Your card images are stored privately and can only be opened by our
            verification team. They are never shown publicly or shared.
          </p>

          {error && <p className="text-sm text-error dark:text-error-dark" role="alert">{error}</p>}

          <Button type="submit" loading={busy} variant="brand">
            Submit for verification
          </Button>
        </form>
      )}
    </SectionCard>
  );
}
