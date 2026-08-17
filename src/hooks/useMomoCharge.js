import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";

/**
 * Mobile-money charge for a repair job: send the Paystack prompt, then poll every
 * 4s (up to ~3 min) until it reports success/failure. `onPaid` runs once the
 * payment is confirmed so the caller can reload the job's payment history.
 *
 * Extracted verbatim from the POS job-detail page to shrink that component; the
 * polling logic is unchanged.
 */
export function useMomoCharge({ jobId, balanceDue, onPaid, defaultPhone }) {
  const [momoPhone,    setMomoPhone]    = useState("");
  const [momoProvider, setMomoProvider] = useState("mtn");
  const [momoAmount,   setMomoAmount]   = useState("");
  const [momoStatus,   setMomoStatus]   = useState(null); // null|'pending'|'success'|'failed'
  const [momoRef,      setMomoRef]      = useState("");
  const [momoMsg,      setMomoMsg]      = useState("");
  const [momoLoading,  setMomoLoading]  = useState(false);
  const [pollTimer,    setPollTimer]    = useState(null);

  // Prefill the phone from the job's customer once it's known.
  useEffect(() => {
    if (defaultPhone) setMomoPhone(defaultPhone);
  }, [defaultPhone]);

  const startPolling = (ref) => {
    // Poll every 4 seconds for up to 3 minutes
    let attempts = 0;
    const max = 45;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/pos/jobs/${jobId}/momo-charge/${ref}`);
        const { status, message } = res;
        if (status === "success") {
          clearInterval(timer);
          setMomoStatus("success");
          setMomoMsg(`Payment confirmed! ${formatGhs(res.amount || 0)} received.`);
          await onPaid?.(); // reload payment history
        } else if (status === "failed" || status === "abandoned") {
          clearInterval(timer);
          setMomoStatus("failed");
          setMomoMsg(message || "Payment was not completed.");
        } else if (attempts >= max) {
          clearInterval(timer);
          setMomoStatus("failed");
          setMomoMsg("Timed out. Ask customer to try again.");
        }
      } catch { /* keep polling */ }
    }, 4000);
    setPollTimer(timer);
  };

  const initiateMomo = async () => {
    const effectiveAmount = momoAmount || (balanceDue > 0 ? balanceDue : "");
    if (!momoPhone.trim() || !effectiveAmount) return;
    setMomoLoading(true);
    setMomoStatus(null);
    setMomoMsg("");
    try {
      const res = await api.post(`/pos/jobs/${jobId}/momo-charge`, {
        phone:    momoPhone.trim(),
        provider: momoProvider,
        amount:   Math.round(Number(effectiveAmount) * 100), // cedis → pesewas
      });
      setMomoRef(res.reference);
      setMomoStatus("pending");
      setMomoMsg(res.message || "Prompt sent. Waiting for customer to approve…");
      startPolling(res.reference);
    } catch (err) {
      setMomoStatus("failed");
      setMomoMsg(err.message || "Failed to send payment request.");
    } finally {
      setMomoLoading(false);
    }
  };

  const cancelMomo = () => {
    if (pollTimer) clearInterval(pollTimer);
    setMomoStatus(null);
    setMomoRef("");
    setMomoMsg("");
    setMomoAmount("");
  };

  return {
    momoPhone, setMomoPhone, momoProvider, setMomoProvider, momoAmount, setMomoAmount,
    momoStatus, momoRef, momoMsg, momoLoading, initiateMomo, cancelMomo,
  };
}
