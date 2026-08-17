import { useState } from "react";
import { api } from "@/lib/api";
import { formatGhs } from "@/lib/shop";

/**
 * Card charge for a repair job: create a Paystack payment link (opened in a new
 * tab), then poll every 4s (up to ~5 min) until it reports success/failure.
 * `onPaid` runs once the payment is confirmed so the caller can reload the job's
 * payment history.
 *
 * Extracted verbatim from the POS job-detail page to shrink that component; the
 * polling logic is unchanged.
 */
export function useCardCharge({ jobId, balanceDue, onPaid }) {
  const [cardLoading,  setCardLoading]  = useState(false);
  const [cardStatus,   setCardStatus]   = useState(null); // null|'pending'|'success'|'failed'
  const [cardRef,      setCardRef]      = useState("");
  const [cardUrl,      setCardUrl]      = useState("");
  const [cardMsg,      setCardMsg]      = useState("");
  const [cardAmount,   setCardAmount]   = useState("");
  const [cardTimer,    setCardTimer]    = useState(null);

  const startCardPolling = (ref) => {
    // Poll every 4 seconds for up to 5 minutes
    let attempts = 0;
    const max = 75;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/pos/jobs/${jobId}/card-charge/${ref}`);
        const { status, message } = res;
        if (status === "success") {
          clearInterval(timer);
          setCardStatus("success");
          setCardMsg(`Payment confirmed! ${formatGhs(res.amount || 0)} received.`);
          await onPaid?.(); // reload payment history
        } else if (status === "failed" || status === "abandoned") {
          clearInterval(timer);
          setCardStatus("failed");
          setCardMsg(message || "Payment was not completed.");
        } else if (attempts >= max) {
          clearInterval(timer);
          setCardStatus("failed");
          setCardMsg("Timed out. Ask customer to retry or open the link again.");
        }
      } catch { /* keep polling */ }
    }, 4000);
    setCardTimer(timer);
  };

  const initiateCard = async () => {
    const effectiveAmount = cardAmount || (balanceDue > 0 ? balanceDue : "");
    if (!effectiveAmount) return;
    setCardLoading(true);
    setCardStatus(null);
    setCardMsg("");
    try {
      const res = await api.post(`/pos/jobs/${jobId}/card-charge`, {
        amount: Math.round(Number(effectiveAmount) * 100), // cedis → pesewas
      });
      setCardRef(res.reference);
      setCardUrl(res.authorizationUrl);
      setCardStatus("pending");
      setCardMsg(res.message || "Payment link created. Open it for the customer…");
      if (res.authorizationUrl) window.open(res.authorizationUrl, "_blank", "noopener");
      startCardPolling(res.reference);
    } catch (err) {
      setCardStatus("failed");
      setCardMsg(err.message || "Failed to create card charge.");
    } finally {
      setCardLoading(false);
    }
  };

  const cancelCard = () => {
    if (cardTimer) clearInterval(cardTimer);
    setCardStatus(null);
    setCardRef("");
    setCardUrl("");
    setCardMsg("");
    setCardAmount("");
  };

  return {
    cardAmount, setCardAmount, cardStatus, cardRef, cardUrl, cardMsg, cardLoading,
    initiateCard, cancelCard,
  };
}
