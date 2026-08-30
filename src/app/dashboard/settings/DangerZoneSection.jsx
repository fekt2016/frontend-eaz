"use client";

/*
 * Account deactivation (owner request, 2026-08-30).
 *
 * REVERSIBLE by decision: orders and history are untouched and an admin can
 * switch the account back on. The copy below says so plainly, because "delete
 * my account" and "deactivate my account" set very different expectations and
 * the user should know which one this is before they confirm.
 *
 * Three deliberate frictions, in increasing order of how much they matter:
 *   1. the section is visually separated as a danger zone
 *   2. the confirm is behind a second step, not one click
 *   3. the server requires the account password — this ends every session, and
 *      someone who walked away from an unlocked laptop should not be able to do
 *      it to them
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { Button, Field, Input, SectionCard } from "@/components/ui";

export default function DangerZoneSection({ isAdmin }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // The server refuses this for admin/superadmin — an admin locking themselves
  // out could leave the shop with no administrator. Say so instead of offering
  // a button that always fails.
  if (isAdmin) {
    return (
      <SectionCard
        icon={AlertTriangle}
        title="Deactivate Account"
        description="Not available for administrator accounts."
        iconColor="bg-error"
      >
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Administrator accounts cannot be self-deactivated. Ask another
          administrator to do it for you.
        </p>
      </SectionCard>
    );
  }

  async function deactivate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/account/deactivate", { password, reason });
      // Every session is now dead server-side, so send them out rather than
      // leaving a shell that 401s on its next request.
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <SectionCard
      icon={AlertTriangle}
      title="Deactivate Account"
      description="Temporarily close your account."
      iconColor="bg-error"
    >
      <div className="rounded-xl border border-error/30 bg-error/5 p-4 dark:border-error-dark/30 dark:bg-error-dark/10">
        <p className="text-sm text-gray-700 dark:text-slate-300">
          Deactivating signs you out everywhere and stops you signing back in.
          <strong className="font-semibold"> Your orders and history are kept</strong>, and
          support can reactivate your account for you later.
        </p>

        {!open ? (
          <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
            Deactivate my account
          </Button>
        ) : (
          <form onSubmit={deactivate} className="mt-4 space-y-3">
            <Field label="Confirm your password" hint="Required — this ends every signed-in session.">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="Reason (optional)">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why, if you'd like"
              />
            </Field>

            {error && <p className="text-sm text-error dark:text-error-dark" role="alert">{error}</p>}

            <div className="flex items-center gap-2">
              <Button type="submit" variant="danger" loading={busy}>
                Yes, deactivate
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(""); }}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </SectionCard>
  );
}
