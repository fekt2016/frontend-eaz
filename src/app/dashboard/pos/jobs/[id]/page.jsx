"use client";

import { controlBase, controlSizes, controlBorder } from "@/components/ui/controlStyles";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import { formatGhs } from "@/lib/shop";
import { useMomoCharge } from "@/hooks/useMomoCharge";
import { useCardCharge } from "@/hooks/useCardCharge";
import { CustomerDeviceCard } from "./_components/CustomerDeviceCard";
import { JobHeader } from "./_components/JobHeader";
import { JobInvoice } from "./_components/JobInvoice";
import { statusBannerClass, statusLabel } from "./_components/jobStatus";
import { useAuth } from "@/context/AuthContext";
import {
  Trash2, Search, Plus,
  Check, Loader2, Smartphone, CheckCircle2, XCircle, Wrench, Link2, CreditCard, AlertTriangle,
} from "lucide-react";
import { formatPhoneInput } from "@/lib/sanitize";
import { printRepairReceipt } from "@/lib/printReceipt";
import JobPhotos from "@/components/pos/JobPhotos";
import { useDebounce } from "@/hooks/useDebounce";
import { useInventorySearch } from "@/hooks/queries/useInventory";

const inputCls = `${controlBase} ${controlSizes.md} ${controlBorder(false)}`;
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = "block text-body-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5";

const STATUSES = ["received", "diagnosing", "waiting_for_parts", "repairing", "ready", "collected", "cancelled"];

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isTechnician = user?.role === "technician";

  const [job,      setJob]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  // Edit fields
  const [status,               setStatus]               = useState("");
  const [diagnosis,            setDiagnosis]            = useState("");
  const [repairWork,           setRepairWork]           = useState("");
  const [laborCost,            setLaborCost]            = useState("");
  const [notes,                setNotes]                = useState("");
  const [diagnosisFee,         setDiagnosisFee]         = useState("");
  const [estimatedCompletion,  setEstimatedCompletion]  = useState("");
  const [warrantyDays,         setWarrantyDays]         = useState("0");
  const [warrantyNotes,        setWarrantyNotes]        = useState("");

  // Parts
  const [selectedParts, setSelectedParts] = useState([]);
  const [partQuery,     setPartQuery]     = useState("");
  const [showPartDrop,  setShowPartDrop]  = useState(false);
  // Debounced inventory search via React Query (real /pos/inventory API).
  const debouncedPartQuery = useDebounce(partQuery, 250);
  const partSearch = useInventorySearch(debouncedPartQuery);
  const partResults = debouncedPartQuery.trim().length >= 1 ? (partSearch.data ?? []) : [];
  const [showParts,     setShowParts]     = useState(false);
  const partRef = useRef(null);

  // Manual payment
  const [payAmount,    setPayAmount]    = useState("");
  const [payMethod,    setPayMethod]    = useState("cash");
  const [payRef,       setPayRef]       = useState("");
  const [payLoading,   setPayLoading]   = useState(false);

  // Share-link copy feedback
  const [linkCopied,   setLinkCopied]   = useState(false);

  // T18: Cancel Job asks for confirmation before it fires — irreversible,
  // customer-facing (mirrors the block/unblock user confirm modal's pattern).
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // MoMo + card charge state and polling live in dedicated hooks (wired up
  // below, once balanceDue and fetchJob are in scope).

  const fetchJob = useCallback(async () => {
    try {
      const res = await api.get(`/pos/jobs/${id}`);
      const j = res.data;
      setJob(j);
      setStatus(j.status);
      setDiagnosis(j.diagnosis || "");
      setRepairWork(j.repairWork || "");
      // Money arrives from the API in integer pesewas; edit inputs work in cedis.
      setLaborCost(String((j.laborCost || 0) / 100));
      setNotes(j.notes || "");
      setDiagnosisFee(String((j.diagnosisFee || 0) / 100));
      setSelectedParts(j.parts?.map(p => ({
        id:          p._id || p.part?._id || Math.random().toString(36).slice(2),
        name:        p.name || p.part?.name || "",
        quantity:    p.quantity || 1,
        cost:        Math.round(p.priceAtTime || 0),  // integer pesewas (T43)
        costAtTime:  Math.round(p.costAtTime  || 0),
        sku:         p.part?.sku || "",
      })) || []);
      if (j.parts?.length) setShowParts(true);
      setEstimatedCompletion(j.estimatedCompletion ? new Date(j.estimatedCompletion).toISOString().slice(0, 16) : "");
      setWarrantyDays(String(j.warrantyDays || 0));
      setWarrantyNotes(j.warrantyNotes || "");
    } catch {
      setError("Failed to load job.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  const pickPart = (part) => {
    setSelectedParts(prev => {
      const exists = prev.find(p => p.id === part._id);
      if (exists) return prev.map(p => p.id === part._id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { id: part._id, name: part.name, sku: part.sku || "", quantity: 1, cost: Math.round(Number(part.sellingPrice) || 0) }];
    });
    setPartQuery(""); setShowPartDrop(false);
  };

  const removePart = (id) => setSelectedParts(prev => prev.filter(p => p.id !== id));

  const updatePart = (id, field, val) =>
    setSelectedParts(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));

  // Integer pesewas throughout (T43). `laborCost` and `diagnosisFee` stay cedis
  // strings because they are edit-box state a technician types into — converted
  // once here, rather than the whole file working in cedis.
  const laborCostPesewas    = Math.round((Number(laborCost) || 0) * 100);
  const diagnosisFeePesewas = Math.round((Number(diagnosisFee) || 0) * 100);
  const totalParts     = selectedParts.reduce((s, p) => s + (p.cost || 0) * (p.quantity || 1), 0);
  const totalPartsCost = selectedParts.reduce((s, p) => s + (p.costAtTime || 0) * (p.quantity || 1), 0);
  const totalAmount    = (job?.requiresDiagnosis ? diagnosisFeePesewas : 0) + totalParts + laborCostPesewas;
  const totalPaid      = job?.payments?.reduce((s, p) => s + p.amount, 0) || 0;
  const balanceDue     = Math.max(0, totalAmount - totalPaid);
  const grossProfit    = totalAmount - totalPartsCost;
  const marginPct      = totalAmount > 0 ? Math.round((grossProfit / totalAmount) * 100) : 0;

  // T20: once the job is done or cancelled, the Technician Update + Parts
  // forms go read-only — the work is over, editing them shouldn't change history.
  const isEditable = !["ready", "collected", "cancelled"].includes(status);

  const {
    momoPhone, setMomoPhone, momoProvider, setMomoProvider, momoAmount, setMomoAmount,
    momoStatus, momoRef, momoMsg, momoLoading, initiateMomo, cancelMomo,
    // balanceDue is pesewas (T43); these hooks multiply by 100 themselves, so they
    // take cedis. Getting this wrong charges the customer 100x.
  } = useMomoCharge({ jobId: id, balanceDue: balanceDue / 100, onPaid: fetchJob, defaultPhone: job?.customer?.phone });

  const {
    cardAmount, setCardAmount, cardStatus, cardRef, cardUrl, cardMsg, cardLoading,
    initiateCard, cancelCard,
  } = useCardCharge({ jobId: id, balanceDue: balanceDue / 100, onPaid: fetchJob });  // cedis — see above

  const quickStatus = async (newStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      await api.patch(`/pos/jobs/${id}`, { status: newStatus });
      await fetchJob();
    } catch (err) {
      setError(errorMessage(err, "Failed to update status."));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/pos/jobs/${id}`, {
        // Money entered in cedis → sent as integer pesewas (×100).
        status, diagnosis, repairWork, laborCost: laborCostPesewas, notes,
        diagnosisFee: diagnosisFeePesewas,
        estimatedCompletion: estimatedCompletion || undefined,
        warrantyDays:  Number(warrantyDays) || 0,
        warrantyNotes: warrantyNotes || undefined,
        parts: selectedParts.map(p => ({ name: p.name, quantity: p.quantity, cost: Math.round(Number(p.cost) || 0), partId: p.id })),
      });
      await fetchJob();
    } catch (err) {
      setError(errorMessage(err, "Failed to save."));
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;
    setPayLoading(true);
    try {
      await api.post(`/pos/jobs/${id}/payments`, {
        amount: Math.round(Number(payAmount) * 100), method: payMethod, // cedis → pesewas
        reference: payRef || undefined,
      });
      setPayAmount(""); setPayRef("");
      await fetchJob();
    } catch (err) {
      setError(errorMessage(err, "Payment failed."));
    } finally {
      setPayLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!job?.trackingToken) return;
    const url = `${window.location.origin}/track/${job.trackingToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  // printRepairReceipt renders cedis. Everything above is pesewas now (T43), so
  // this call site is the single place that converts back — deliberately, at the
  // boundary of a helper this task does not own.
  const handlePrint = () => printRepairReceipt(
    { ...job, repairWork, laborCost: laborCostPesewas / 100, diagnosisFee: diagnosisFeePesewas / 100,
      parts: selectedParts.map(p => ({ name: p.name, quantity: p.quantity, priceAtTime: (p.cost || 0) / 100 })),
      status, estimatedCompletion },
    (job?.payments || []).map(p => ({ ...p, amount: (p.amount || 0) / 100 }))
  );

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-700 border-t-brand-400 rounded-full animate-spin" />
    </div>
  );

  if (!job && !loading) return (
    <div className="text-center py-16 text-gray-500">
      Job not found. <Link href="/dashboard/pos/jobs" className="text-brand-ink dark:text-brand-400 hover:underline">Back to jobs</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 print:p-0 print:space-y-4">
      {/* Header */}
<JobHeader
        job={job}
        linkCopied={linkCopied}
        saving={saving}
        onCopyLink={handleCopyLink}
        onPrint={handlePrint}
        onSave={handleSave}
      />


      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Customer + Device */}
          <CustomerDeviceCard job={job} />

          {/* Technician section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 print:hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50">
              <Wrench size={11} className="text-brand-ink dark:text-brand-400" />
              <p className="text-xs font-semibold text-brand-ink dark:text-brand-400 uppercase tracking-wide">Technician Update</p>
            </div>
            {isEditable ? (
            <div className="p-5 space-y-4">
              {/* Repair work — key field for teller */}
              <div>
                <label className={labelCls}>
                  Work to be done / performed
                  <span className="ml-2 text-brand-500 text-xs font-normal">shown on invoice</span>
                </label>
                <textarea
                  value={repairWork}
                  onChange={e => setRepairWork(e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="e.g. Replace screen, clean charging port, replace battery…"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Labour charge (GH₵)</label>
                  <input
                    type="number" min="0" value={laborCost}
                    onChange={e => setLaborCost(e.target.value)}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                {job?.requiresDiagnosis && (
                  <div>
                    <label className={labelCls}>
                      Diagnosis fee (GH₵)
                      <span className="ml-2 text-brand-ink dark:text-brand-400 text-xs font-normal">upfront</span>
                    </label>
                    <input
                      type="number" min="0" value={diagnosisFee}
                      onChange={e => setDiagnosisFee(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Estimated completion</label>
                <input
                  type="datetime-local"
                  value={estimatedCompletion}
                  onChange={e => setEstimatedCompletion(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Diagnosis / findings</label>
                <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="What did you find?" />
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
                  {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Internal notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Notes visible only to staff…" />
              </div>

              {/* Warranty */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Warranty</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Warranty period</label>
                    <select value={warrantyDays} onChange={e => setWarrantyDays(e.target.value)} className={selectCls}>
                      <option value="0">No warranty</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="180">6 months</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>What&apos;s covered</label>
                    <input
                      value={warrantyNotes}
                      onChange={e => setWarrantyNotes(e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Screen replacement only"
                    />
                  </div>
                </div>
                {job?.warrantyExpires && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                    job.warrantyStatus === "active"        ? "bg-success-surface border-success/20 text-success dark:bg-success-surface-dark dark:border-success-dark/30 dark:text-success-dark" :
                    job.warrantyStatus === "expiring_soon" ? "bg-brand-500/10 border-brand-500/20 text-brand-ink dark:text-brand-400" :
                    "bg-gray-500/10 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                    <span className="font-medium">Warranty expires:</span>
                    <span>{new Date(job.warrantyExpires).toLocaleDateString("en-GH", { dateStyle: "long" })}</span>
                    {job.warrantyStatus === "expiring_soon" && <span className="ml-auto font-semibold">Expiring soon!</span>}
                    {job.warrantyStatus === "expired"       && <span className="ml-auto font-semibold">Expired</span>}
                  </div>
                )}
              </div>
            </div>
            ) : (
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className={labelCls}>Work performed</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{repairWork || "—"}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className={labelCls}>Labour charge</p>
                  <p className="text-gray-900 dark:text-white">{formatGhs(laborCostPesewas)}</p>
                </div>
                {job?.requiresDiagnosis && (
                  <div>
                    <p className={labelCls}>Diagnosis fee</p>
                    <p className="text-gray-900 dark:text-white">{formatGhs(diagnosisFeePesewas)}</p>
                  </div>
                )}
              </div>

              <div>
                <p className={labelCls}>Diagnosis / findings</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{diagnosis || "—"}</p>
              </div>

              <div>
                <p className={labelCls}>Internal notes</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{notes || "—"}</p>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Warranty</p>
                <p className="text-gray-900 dark:text-white">
                  {Number(warrantyDays) > 0
                    ? `${warrantyDays} days${warrantyNotes ? ` — ${warrantyNotes}` : ""}`
                    : "No warranty"}
                </p>
                {job?.warrantyExpires && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                    job.warrantyStatus === "active"        ? "bg-success-surface border-success/20 text-success dark:bg-success-surface-dark dark:border-success-dark/30 dark:text-success-dark" :
                    job.warrantyStatus === "expiring_soon" ? "bg-brand-500/10 border-brand-500/20 text-brand-ink dark:text-brand-400" :
                    "bg-gray-500/10 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                    <span className="font-medium">Warranty expires:</span>
                    <span>{new Date(job.warrantyExpires).toLocaleDateString("en-GH", { dateStyle: "long" })}</span>
                    {job.warrantyStatus === "expiring_soon" && <span className="ml-auto font-semibold">Expiring soon!</span>}
                    {job.warrantyStatus === "expired"       && <span className="ml-auto font-semibold">Expired</span>}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Parts — hidden until the teller searches (read-only summary once done/cancelled) */}
          {!isEditable ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Parts</p>
            </div>
            <div className="p-5 space-y-2">
              {selectedParts.length === 0 ? (
                <p className="text-sm text-gray-600">No parts used.</p>
              ) : (
                selectedParts.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 last:border-0 text-sm">
                    <p className="text-gray-900 dark:text-white">
                      {p.name}{p.sku ? ` (${p.sku})` : ""} × {p.quantity}
                    </p>
                    <p className="font-semibold text-brand-ink dark:text-brand-400">
                      {formatGhs((p.cost || 0) * p.quantity)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          ) : !showParts && selectedParts.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Parts</p>
                <button
                  type="button"
                  onClick={() => setShowParts(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition"
                >
                  <Plus size={9} /> Add parts
                </button>
              </div>
            </div>
          ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Parts</p>
              <p className="text-xs text-gray-600">Leave empty if no parts needed</p>
            </div>
            <div className="p-5 space-y-3">
              {/* Search input */}
              <div ref={partRef} className="relative print:hidden">
                <Search size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={partQuery}
                  onChange={e => { setPartQuery(e.target.value); setShowPartDrop(true); }}
                  onBlur={() => setTimeout(() => setShowPartDrop(false), 150)}
                  placeholder="Search by name, SKU, or barcode…"
                  className={`${inputCls} pl-9`}
                />
                {showPartDrop && partResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden shadow-xl">
                    {partResults.map(p => (
                      <button
                        key={p._id}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); pickPart(p); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.sku && <span className="mr-2">SKU: {p.sku}</span>}
                            {p.barcode && <span>Barcode: {p.barcode}</span>}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-brand-ink dark:text-brand-400 font-semibold">{formatGhs(p.sellingPrice || 0)}</p>
                          <p className="text-xs text-gray-500">Stock: {p.quantity}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedParts.length === 0 ? (
                <p className="text-sm text-gray-600 py-1">No parts added — labour only is fine.</p>
              ) : (
                <div className="space-y-2">
                  {selectedParts.map(p => (
                    <div key={p.id} className="flex items-center gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.sku && <span className="mr-2">SKU: {p.sku}</span>}
                          <span className="text-success dark:text-success-dark">{formatGhs(p.cost || 0)} each</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 print:hidden">
                        <button onClick={() => updatePart(p.id, "quantity", Math.max(1, p.quantity - 1))} className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-xs flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600">−</button>
                        <span className="text-sm text-gray-900 dark:text-white w-5 text-center">{p.quantity}</span>
                        <button onClick={() => updatePart(p.id, "quantity", p.quantity + 1)} className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-xs flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600">+</button>
                      </div>
                      <p className="text-sm font-semibold text-brand-ink dark:text-brand-400 w-20 text-right">
                        {formatGhs((p.cost || 0) * p.quantity)}
                      </p>
                      <button onClick={() => removePart(p.id)} className="text-gray-600 hover:text-error dark:hover:text-error-dark transition print:hidden">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}

          {/* Device photos */}
          <JobPhotos
            jobId={id}
            photos={job?.photos || []}
            onUpdate={fetchJob}
            readOnly={false}
          />

        </div>

        {/* Right column — summary + payments */}
        <div className="space-y-5">

          {/* Status + quick progression */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden print:hidden">
            <div className={`p-4 text-center border-b ${statusBannerClass(status)}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">Status</p>
              <p className="text-lg font-bold">{statusLabel(status)}</p>
            </div>
            {/* Next-step action buttons */}
            {status === "received" && (
              <div className="p-3 flex flex-col gap-2">
                <button onClick={() => quickStatus("diagnosing")} className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition">
                  Start Diagnosing
                </button>
                <button onClick={() => quickStatus("repairing")} className="w-full py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold transition">
                  Skip to Repairing
                </button>
              </div>
            )}
            {status === "diagnosing" && (
              <div className="p-3">
                <button onClick={() => quickStatus("repairing")} className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-gray-900 text-xs font-semibold transition">
                  Diagnosis done → Start Repairing
                </button>
              </div>
            )}
            {status === "waiting_for_parts" && (
              <div className="p-3">
                <button onClick={() => quickStatus("repairing")} className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition">
                  Parts arrived → Start Repairing
                </button>
              </div>
            )}
            {status === "repairing" && (
              <div className="p-3">
                <button onClick={() => quickStatus("ready")} className="w-full py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition">
                  Repair done → Mark Ready for Collection
                </button>
              </div>
            )}
            {status === "ready" && !isTechnician && (
              <div className="p-3">
                <button onClick={() => quickStatus("collected")} className="w-full py-2 rounded-xl bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs font-semibold transition">
                  Customer collected → Close Job
                </button>
              </div>
            )}
            {/* T18: cancellable from any live status except `ready` (job is about
                to be collected) — matches the backend's canTransitionJobStatus
                guard, which rejects ready->cancelled. */}
            {["received","diagnosing","waiting_for_parts","repairing"].includes(status) && (
              <div className="px-3 pb-3">
                <button onClick={() => setShowCancelConfirm(true)} className="w-full py-1.5 rounded-xl border border-error/30 text-error dark:text-error-dark text-xs hover:bg-error/10 transition">
                  Cancel Job
                </button>
              </div>
            )}
          </div>

          {/* Invoice — teller view */}
          <JobInvoice
            status={status}
            repairWork={repairWork}
            job={job}
            selectedParts={selectedParts}
            diagnosisFee={diagnosisFee}
            laborCost={laborCost}
            totalParts={totalParts}
            totalAmount={totalAmount}
            totalPaid={totalPaid}
            balanceDue={balanceDue}
            isTechnician={isTechnician}
            totalPartsCost={totalPartsCost}
            grossProfit={grossProfit}
            marginPct={marginPct}
          />

          {/* Record payment — teller/admin only */}
          {balanceDue > 0 && !isTechnician && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden print:hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Collect Payment</p>
            </div>
            <div className="p-5 space-y-3">
              {/* Quick-select amount buttons */}
              <div>
                <label className={labelCls}>Quick select</label>
                <div className="flex flex-wrap gap-2">
                  {job?.requiresDiagnosis && diagnosisFeePesewas > 0 && totalPaid < diagnosisFeePesewas && (
                    <button type="button" onClick={() => setPayAmount(String(Number(diagnosisFee)))}
                      className="px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-ink dark:text-brand-400 text-xs font-medium hover:bg-brand-500/30 transition border border-brand-500/20">
                      Diagnosis {formatGhs(diagnosisFeePesewas)}
                    </button>
                  )}
                  {(totalParts + laborCostPesewas) > 0 && (
                    <button type="button" onClick={() => setPayAmount(((Math.max(0, totalParts + laborCostPesewas - Math.max(0, totalPaid - diagnosisFeePesewas))) / 100).toFixed(2))}
                      className="px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-ink dark:text-brand-400 text-xs font-medium hover:bg-brand-500/30 transition border border-brand-500/20">
                      Parts + Labour {formatGhs(totalParts + laborCostPesewas)}
                    </button>
                  )}
                  {balanceDue > 0 && (
                    <button type="button" onClick={() => setPayAmount(String(balanceDue))}
                      className="px-3 py-1.5 rounded-lg bg-success/15 text-success dark:text-success-dark text-xs font-medium hover:bg-success/30 transition border border-success/20">
                      Full balance {formatGhs(balanceDue)}
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handlePayment} className="space-y-3">
                <div>
                  <label className={labelCls}>Amount (GH₵)</label>
                  <input
                    type="number" min="0"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="Enter amount…"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Method</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className={selectCls}>
                    <option value="cash">Cash</option>
                    <option value="momo">MoMo</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                {payMethod !== "cash" && (
                  <div>
                    <label className={labelCls}>Reference</label>
                    <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction ref…" className={inputCls} />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={payLoading || !payAmount}
                  className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {payLoading ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
                  Record Payment
                </button>
              </form>
            </div>
          </div>
          )}

          {/* MoMo Payment — teller/admin only */}
          {!isTechnician && (balanceDue > 0 || momoStatus === "pending" || momoStatus === "success") && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 print:hidden">
            <div className="flex items-center gap-2">
              <Smartphone size={14} className="text-brand-ink dark:text-brand-400" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Request MoMo Payment</p>
            </div>

            {momoStatus === "success" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <CheckCircle2 size={20} aria-hidden="true" className="text-success dark:text-success-dark flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-success dark:text-success-dark">Payment confirmed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{momoMsg}</p>
                </div>
                <button
                  onClick={cancelMomo}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
                >
                  New
                </button>
              </div>
            ) : momoStatus === "failed" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <XCircle size={20} aria-hidden="true" className="text-error dark:text-error-dark flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-error dark:text-error-dark">Payment failed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{momoMsg}</p>
                </div>
                <button
                  onClick={cancelMomo}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Retry
                </button>
              </div>
            ) : momoStatus === "pending" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/30">
                  <Loader2 size={16} className="text-brand-ink dark:text-brand-400 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-brand-ink dark:text-brand-400">Waiting for customer…</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{momoMsg || "Customer will receive a USSD prompt on their phone."}</p>
                    {momoRef && <p className="text-xs text-gray-600 mt-0.5 font-mono">Ref: {momoRef}</p>}
                  </div>
                </div>
                <button
                  onClick={cancelMomo}
                  className="w-full py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Test mode helper */}
                {process.env.NODE_ENV !== "production" && (
                  <div className="px-3 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400 font-medium mb-1.5">Test numbers (Paystack sandbox)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "MTN",       phone: "0551234987", provider: "mtn" },
                        { label: "Vodafone",  phone: "0201234987", provider: "vod" },
                        { label: "AirtelTigo",phone: "0271234987", provider: "tgo" },
                      ].map(t => (
                        <button
                          key={t.provider}
                          type="button"
                          onClick={() => { setMomoPhone(t.phone); setMomoProvider(t.provider); }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-yellow-500/15 text-yellow-300 hover:bg-yellow-500/30 transition font-mono"
                        >
                          {t.label} · {t.phone}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Customer phone</label>
                    <input
                      type="tel"
                      value={momoPhone}
                      onChange={e => setMomoPhone(formatPhoneInput(e.target.value))}
                      placeholder="024 000 0000"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Network</label>
                    <select value={momoProvider} onChange={e => setMomoProvider(e.target.value)} className={selectCls}>
                      <option value="mtn">MTN MoMo</option>
                      <option value="vod">Vodafone Cash</option>
                      <option value="tgo">AirtelTigo Money</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Amount (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    value={momoAmount || (balanceDue > 0 ? balanceDue : "")}
                    onChange={e => setMomoAmount(e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={initiateMomo}
                  disabled={momoLoading || !momoPhone || (!momoAmount && balanceDue <= 0)}
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-gray-900 text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {momoLoading ? <Loader2 className="animate-spin" size={12} /> : <Smartphone size={12} />}
                  Send Payment Request
                </button>
              </div>
            )}
          </div>
          )}

          {/* Card Payment — teller/admin only */}
          {!isTechnician && (balanceDue > 0 || cardStatus === "pending" || cardStatus === "success") && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 print:hidden">
            <div className="flex items-center gap-2">
              <CreditCard size={14} className="text-brand-ink dark:text-brand-400" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Charge Card (Paystack)</p>
            </div>

            {cardStatus === "success" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <CheckCircle2 size={20} aria-hidden="true" className="text-success dark:text-success-dark flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-success dark:text-success-dark">Payment confirmed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cardMsg}</p>
                </div>
                <button
                  onClick={cancelCard}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
                >
                  New
                </button>
              </div>
            ) : cardStatus === "failed" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <XCircle size={20} aria-hidden="true" className="text-error dark:text-error-dark flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-error dark:text-error-dark">Payment failed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cardMsg}</p>
                </div>
                <button
                  onClick={cancelCard}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
                >
                  Retry
                </button>
              </div>
            ) : cardStatus === "pending" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/30">
                  <Loader2 size={16} className="text-brand-ink dark:text-brand-400 animate-spin flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-ink dark:text-brand-400">Waiting for customer…</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cardMsg || "The Paystack payment page is open in a new tab."}</p>
                    {cardRef && <p className="text-xs text-gray-600 mt-0.5 font-mono break-all">Ref: {cardRef}</p>}
                    {cardUrl && (
                      <a
                        href={cardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-ink dark:text-brand-400 text-xs font-medium hover:bg-brand-500/30 transition border border-brand-500/20"
                      >
                        <Link2 size={10} /> Reopen payment page
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={cancelCard}
                  className="w-full py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Amount (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    value={cardAmount || (balanceDue > 0 ? balanceDue : "")}
                    onChange={e => setCardAmount(e.target.value)}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={initiateCard}
                  disabled={cardLoading || (balanceDue <= 0 && !cardAmount)}
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-gray-900 text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cardLoading ? <Loader2 className="animate-spin" size={12} /> : <CreditCard size={12} />}
                  Charge Card
                </button>
              </div>
            )}
          </div>
          )}

          {/* Payment history */}
          {job?.payments?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Payment History</p>
              <div className="space-y-2">
                {job.payments.map(p => (
                  <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">{p.method}</p>
                      <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString("en-GH")}</p>
                    </div>
                    <p className="text-sm font-semibold text-success dark:text-success-dark">{formatGhs(p.amount || 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {error && <p className="text-error dark:text-error-dark text-sm print:hidden" role="alert">{error}</p>}

      {/* T18: confirm before cancelling — irreversible, customer-facing. */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-100 dark:bg-red-900/30">
                <AlertTriangle size={20} aria-hidden="true" className="text-error dark:text-error-dark" />
              </div>
              <h3 className="font-bold text-center text-gray-900 dark:text-white mb-1">Cancel Job?</h3>
              <p className="text-center text-xs text-gray-600 dark:text-slate-500 mb-4">
                Job #{job?.jobNumber} will be marked cancelled and the customer notified. This cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-paper dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Keep Job
              </button>
              <button
                onClick={async () => { setShowCancelConfirm(false); await quickStatus("cancelled"); }}
                disabled={saving}
                className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={12} /> : null}
                Cancel Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
