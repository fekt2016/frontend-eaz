"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  FaArrowLeft, FaExclamationTriangle, FaTrash, FaSearch,
  FaPrint, FaCheck, FaSpinner, FaMobileAlt, FaCheckCircle, FaTimesCircle, FaWrench, FaLink,
} from "react-icons/fa";
import { formatPhoneInput } from "@/lib/sanitize";
import { printRepairReceipt } from "@/lib/printReceipt";
import JobPhotos from "@/components/pos/JobPhotos";

const inputCls  = "w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition";
const selectCls = `${inputCls} cursor-pointer`;
const labelCls  = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5";

const STATUSES = ["received", "diagnosing", "repairing", "ready", "collected", "cancelled"];
const STATUS_COLORS = {
  received:   "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  diagnosing: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  repairing:  "bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30",
  ready:      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  collected:  "bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/30",
  cancelled:  "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isTechnician = user?.role === "technician" || user?.role === "admin";

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
  const [partResults,   setPartResults]   = useState([]);
  const [showPartDrop,  setShowPartDrop]  = useState(false);
  const partRef = useRef(null);

  // Manual payment
  const [payAmount,    setPayAmount]    = useState("");
  const [payMethod,    setPayMethod]    = useState("cash");
  const [payRef,       setPayRef]       = useState("");
  const [payLoading,   setPayLoading]   = useState(false);

  // MoMo charge
  const [linkCopied,   setLinkCopied]   = useState(false);
  const [momoPhone,    setMomoPhone]    = useState("");
  const [momoProvider, setMomoProvider] = useState("mtn");
  const [momoAmount,   setMomoAmount]   = useState("");
  const [momoStatus,   setMomoStatus]   = useState(null); // null|'pending'|'success'|'failed'
  const [momoRef,      setMomoRef]      = useState("");
  const [momoMsg,      setMomoMsg]      = useState("");
  const [momoLoading,  setMomoLoading]  = useState(false);
  const [pollTimer,    setPollTimer]    = useState(null);

  const fetchJob = useCallback(async () => {
    try {
      const res = await api.get(`/pos/jobs/${id}`);
      const j = res.data;
      setJob(j);
      setStatus(j.status);
      setDiagnosis(j.diagnosis || "");
      setRepairWork(j.repairWork || "");
      setLaborCost(j.laborCost?.toString() || "0");
      setNotes(j.notes || "");
      setDiagnosisFee(j.diagnosisFee?.toString() || "0");
      setSelectedParts(j.parts?.map(p => ({
        id:          p._id || p.part?._id || Math.random().toString(36).slice(2),
        name:        p.name || p.part?.name || "",
        quantity:    p.quantity || 1,
        cost:        p.priceAtTime || 0,
        costAtTime:  p.costAtTime  || 0,
        sku:         p.part?.sku || "",
      })) || []);
      setEstimatedCompletion(j.estimatedCompletion ? new Date(j.estimatedCompletion).toISOString().slice(0, 16) : "");
      setWarrantyDays(String(j.warrantyDays || 0));
      setWarrantyNotes(j.warrantyNotes || "");
      if (j.customer?.phone) setMomoPhone(j.customer.phone);
    } catch {
      setError("Failed to load job.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchJob(); }, [fetchJob]);

  // Part search — name, SKU, or barcode
  useEffect(() => {
    if (partQuery.length < 1) { setPartResults([]); setShowPartDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/pos/inventory?q=${encodeURIComponent(partQuery)}&limit=8`);
        setPartResults(res.data || []);
        setShowPartDrop((res.data || []).length > 0);
      } catch { setPartResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [partQuery]);

  const pickPart = (part) => {
    setSelectedParts(prev => {
      const exists = prev.find(p => p.id === part._id);
      if (exists) return prev.map(p => p.id === part._id ? { ...p, quantity: p.quantity + 1 } : p);
      return [...prev, { id: part._id, name: part.name, sku: part.sku || "", quantity: 1, cost: part.sellingPrice || 0 }];
    });
    setPartQuery(""); setPartResults([]); setShowPartDrop(false);
  };

  const removePart = (id) => setSelectedParts(prev => prev.filter(p => p.id !== id));

  const updatePart = (id, field, val) =>
    setSelectedParts(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));

  const totalParts     = selectedParts.reduce((s, p) => s + (p.cost || 0) * (p.quantity || 1), 0);
  const totalPartsCost = selectedParts.reduce((s, p) => s + (p.costAtTime || 0) * (p.quantity || 1), 0);
  const totalAmount    = (job?.requiresDiagnosis ? (Number(diagnosisFee) || 0) : 0) + totalParts + (Number(laborCost) || 0);
  const totalPaid      = job?.payments?.reduce((s, p) => s + p.amount, 0) || 0;
  const balanceDue     = Math.max(0, totalAmount - totalPaid);
  const grossProfit    = totalAmount - totalPartsCost;
  const marginPct      = totalAmount > 0 ? Math.round((grossProfit / totalAmount) * 100) : 0;

  const quickStatus = async (newStatus) => {
    setStatus(newStatus);
    setSaving(true);
    try {
      await api.patch(`/pos/jobs/${id}`, { status: newStatus });
      await fetchJob();
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/pos/jobs/${id}`, {
        status, diagnosis, repairWork, laborCost: Number(laborCost) || 0, notes,
        diagnosisFee: Number(diagnosisFee) || 0,
        estimatedCompletion: estimatedCompletion || undefined,
        warrantyDays:  Number(warrantyDays) || 0,
        warrantyNotes: warrantyNotes || undefined,
        parts: selectedParts.map(p => ({ name: p.name, quantity: p.quantity, cost: p.cost, partId: p.id })),
      });
      await fetchJob();
    } catch (err) {
      setError(err.message || "Failed to save.");
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
        amount: Number(payAmount), method: payMethod,
        reference: payRef || undefined,
      });
      setPayAmount(""); setPayRef("");
      await fetchJob();
    } catch (err) {
      setError(err.message || "Payment failed.");
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

  const handlePrint = () => printRepairReceipt(
    { ...job, repairWork, laborCost: Number(laborCost) || 0, diagnosisFee: Number(diagnosisFee) || 0,
      parts: selectedParts.map(p => ({ name: p.name, quantity: p.quantity, priceAtTime: p.cost || 0 })),
      status, estimatedCompletion },
    job?.payments || []
  );

  // ── MoMo charge ─────────────────────────────────────────────────────────────
  const initiateMomo = async () => {
    const effectiveAmount = momoAmount || (balanceDue > 0 ? balanceDue : "");
    if (!momoPhone.trim() || !effectiveAmount) return;
    setMomoLoading(true);
    setMomoStatus(null);
    setMomoMsg("");
    try {
      const res = await api.post(`/pos/jobs/${id}/momo-charge`, {
        phone:    momoPhone.trim(),
        provider: momoProvider,
        amount:   Number(effectiveAmount),
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

  const startPolling = (ref) => {
    // Poll every 4 seconds for up to 3 minutes
    let attempts = 0;
    const max = 45;
    const timer = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/pos/jobs/${id}/momo-charge/${ref}`);
        const { status, message } = res;
        if (status === "success") {
          clearInterval(timer);
          setMomoStatus("success");
          setMomoMsg(`Payment confirmed! GH₵${res.amount} received.`);
          await fetchJob(); // reload payment history
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

  const cancelMomo = () => {
    if (pollTimer) clearInterval(pollTimer);
    setMomoStatus(null);
    setMomoRef("");
    setMomoMsg("");
    setMomoAmount("");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-700 border-t-brand-400 rounded-full animate-spin" />
    </div>
  );

  if (!job && !loading) return (
    <div className="text-center py-16 text-gray-500">
      Job not found. <Link href="/dashboard/pos/jobs" className="text-brand-600 dark:text-brand-400 hover:underline">Back to jobs</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/pos/jobs" className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
            <FaArrowLeft size={12} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{job.jobNumber}</h1>
              {job.priority === "urgent" && (
                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                  <FaExclamationTriangle size={9} /> Urgent
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">Created {new Date(job.createdAt).toLocaleDateString("en-GH", { dateStyle: "long" })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyLink} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm transition ${
            linkCopied
              ? "border-green-500/50 text-green-600 dark:text-green-400"
              : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700"
          }`}>
            {linkCopied ? <FaCheck size={11} /> : <FaLink size={11} />}
            {linkCopied ? "Copied!" : "Track Link"}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-700 text-sm transition">
            <FaPrint size={12} /> Print
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
            Save
          </button>
        </div>
      </div>


      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Customer + Device */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 print:border print:rounded-none">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.customer?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{job.customer?.phone}</p>
                {job.customer?.email && <p className="text-sm text-gray-500 dark:text-gray-400">{job.customer.email}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Device</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{[job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—"}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{job.deviceType}</p>
                {job.imei  && <p className="text-xs text-gray-500 mt-1">IMEI: {job.imei}</p>}
                {job.color && <p className="text-xs text-gray-500">Color: {job.color}</p>}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fault</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{job.faultDescription}</p>
              {job.requiresDiagnosis && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Diagnosis required</span>
                  <span className="text-xs text-purple-300">· GH₵{(job.diagnosisFee || 0).toLocaleString()} charged upfront</span>
                </div>
              )}
              {job.repairWork && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Repair work</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{job.repairWork}</p>
                </div>
              )}
              {job.estimatedCompletion && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Est. completion:</span>
                  <span className="text-xs text-blue-300">
                    {new Date(job.estimatedCompletion).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
              )}
              {job.warrantyDays > 0 && (
                <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                  job.warrantyStatus === "active"        ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" :
                  job.warrantyStatus === "expiring_soon" ? "bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400" :
                  job.warrantyStatus === "expired"       ? "bg-gray-500/10 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400" :
                  "bg-teal-500/10 border-teal-500/20 text-teal-400"
                }`}>
                  <span className="font-medium">
                    🛡 Warranty: {job.warrantyDays} day{job.warrantyDays !== 1 ? "s" : ""}
                    {job.warrantyNotes ? ` — ${job.warrantyNotes}` : ""}
                  </span>
                  {job.warrantyExpires && (
                    <span>
                      {job.warrantyStatus === "expired"
                        ? "Expired"
                        : `Exp. ${new Date(job.warrantyExpires).toLocaleDateString("en-GH")}`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Technician section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 print:hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50">
              <FaWrench size={11} className="text-brand-600 dark:text-brand-400" />
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">Technician Update</p>
            </div>
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
                      <span className="ml-2 text-purple-600 dark:text-purple-400 text-xs font-normal">upfront</span>
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
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
                    job.warrantyStatus === "active"        ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400" :
                    job.warrantyStatus === "expiring_soon" ? "bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400" :
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
          </div>

          {/* Parts — search by name, SKU, or barcode */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Parts</p>
              <p className="text-xs text-gray-600">Leave empty if no parts needed</p>
            </div>
            <div className="p-5 space-y-3">
              {/* Search input */}
              <div ref={partRef} className="relative print:hidden">
                <FaSearch size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
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
                          <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold">GH₵{(p.sellingPrice || 0).toLocaleString()}</p>
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
                          <span className="text-green-600">GH₵{(p.cost || 0).toLocaleString()} each</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 print:hidden">
                        <button onClick={() => updatePart(p.id, "quantity", Math.max(1, p.quantity - 1))} className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-xs flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600">−</button>
                        <span className="text-sm text-gray-900 dark:text-white w-5 text-center">{p.quantity}</span>
                        <button onClick={() => updatePart(p.id, "quantity", p.quantity + 1)} className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-xs flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600">+</button>
                      </div>
                      <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 w-20 text-right">
                        GH₵{((p.cost || 0) * p.quantity).toLocaleString()}
                      </p>
                      <button onClick={() => removePart(p.id)} className="text-gray-600 hover:text-red-400 transition print:hidden">
                        <FaTrash size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
            <div className={`p-4 text-center border-b ${STATUS_COLORS[status] || "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 opacity-70">Status</p>
              <p className="text-lg font-bold capitalize">{status}</p>
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
                <button onClick={() => quickStatus("repairing")} className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition">
                  Diagnosis done → Start Repairing
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
            {["received","diagnosing","repairing","ready"].includes(status) && (
              <div className="px-3 pb-3">
                <button onClick={() => quickStatus("cancelled")} className="w-full py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 text-xs hover:bg-red-500/10 transition">
                  Cancel Job
                </button>
              </div>
            )}
          </div>

          {/* Invoice — teller view */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Invoice</p>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[status] || "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>

            {/* Repair work description — what teller tells the customer */}
            {(repairWork || job?.repairWork) && (
              <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-brand-500/5">
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">Repair work</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{repairWork || job?.repairWork}</p>
              </div>
            )}

            {/* Parts breakdown */}
            {selectedParts.length > 0 && (
              <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 space-y-1.5">
                <p className="text-xs text-gray-500 font-medium mb-2">Parts</p>
                {selectedParts.map(p => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">{p.name} × {p.quantity}</span>
                    <span className="text-gray-900 dark:text-white">GH₵{((p.cost || 0) * p.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="px-5 py-4 space-y-2.5">
              {job?.requiresDiagnosis && (
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    Diagnosis fee
                    <span className="text-xs bg-purple-500/15 border border-purple-500/20 px-1.5 py-0.5 rounded-full">upfront</span>
                  </span>
                  <span className="text-gray-900 dark:text-white">GH₵{(Number(diagnosisFee) || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Parts</span>
                <span className="text-gray-900 dark:text-white">GH₵{totalParts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Labour</span>
                <span className="text-gray-900 dark:text-white">GH₵{(Number(laborCost) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-gray-200 dark:border-gray-800 pt-2.5">
                <span className="text-gray-600 dark:text-gray-300">Total</span>
                <span className="text-gray-900 dark:text-white">GH₵{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Paid</span>
                <span className="text-green-600 dark:text-green-400">GH₵{totalPaid.toLocaleString()}</span>
              </div>
              <div className={`flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-800 pt-2.5 ${balanceDue > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                <span>Balance due</span>
                <span>GH₵{balanceDue.toLocaleString()}</span>
              </div>

              {/* Profit margin — staff/superadmin only */}
              {!isTechnician && totalAmount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Profit Breakdown</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Parts cost</span>
                    <span className="text-gray-500 dark:text-gray-400">GH₵{totalPartsCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Revenue</span>
                    <span className="text-gray-600 dark:text-gray-300">GH₵{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between text-sm font-bold pt-1 ${grossProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    <span>Gross Profit</span>
                    <span>GH₵{grossProfit.toLocaleString()} ({marginPct}%)</span>
                  </div>
                  {/* Visual margin bar */}
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${marginPct >= 50 ? "bg-green-500" : marginPct >= 25 ? "bg-brand-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

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
                  {job?.requiresDiagnosis && (Number(diagnosisFee) || 0) > 0 && totalPaid < (Number(diagnosisFee) || 0) && (
                    <button type="button" onClick={() => setPayAmount(String(Number(diagnosisFee)))}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition border border-purple-500/20">
                      Diagnosis GH₵{Number(diagnosisFee).toLocaleString()}
                    </button>
                  )}
                  {(totalParts + (Number(laborCost) || 0)) > 0 && (
                    <button type="button" onClick={() => setPayAmount(String(Math.max(0, totalParts + (Number(laborCost) || 0) - Math.max(0, totalPaid - (Number(diagnosisFee) || 0)))))}
                      className="px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-medium hover:bg-brand-500/30 transition border border-brand-500/20">
                      Parts + Labour GH₵{(totalParts + (Number(laborCost) || 0)).toLocaleString()}
                    </button>
                  )}
                  {balanceDue > 0 && (
                    <button type="button" onClick={() => setPayAmount(String(balanceDue))}
                      className="px-3 py-1.5 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400 text-xs font-medium hover:bg-green-500/30 transition border border-green-500/20">
                      Full balance GH₵{balanceDue.toLocaleString()}
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
                  {payLoading ? <FaSpinner className="animate-spin" size={12} /> : <FaCheck size={12} />}
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
              <FaMobileAlt size={14} className="text-brand-600 dark:text-brand-400" />
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Request MoMo Payment</p>
            </div>

            {momoStatus === "success" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <FaCheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">Payment confirmed</p>
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
                <FaTimesCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Payment failed</p>
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
                  <FaSpinner size={16} className="text-brand-600 dark:text-brand-400 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">Waiting for customer…</p>
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
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {momoLoading ? <FaSpinner className="animate-spin" size={12} /> : <FaMobileAlt size={12} />}
                  Send Payment Request
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
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">GH₵{p.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm print:hidden">{error}</p>}
    </div>
  );
}
