"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FaSearch, FaPlus, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { formatPhoneInput } from "@/lib/sanitize";

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition";
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5";

const DEVICE_TYPES = ["Phone", "Tablet", "Laptop", "Smartwatch", "Other"];
const BRANDS = ["Apple", "Samsung", "Tecno", "Infinix", "Itel", "Huawei", "Nokia", "Oppo", "Xiaomi", "OnePlus", "Other"];

export default function NewJobPage() {
  const router = useRouter();

  // Customer — unified phone search
  const [custPhone,        setCustPhone]        = useState("");
  const [custMatches,      setCustMatches]      = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDropdown,     setShowDropdown]     = useState(false);
  const dropdownRef = useRef(null);

  // Device info
  const [deviceType,  setDeviceType]  = useState("Phone");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [imei,        setImei]        = useState("");
  const [color,       setColor]       = useState("");

  // Job info
  const [faultDesc,          setFaultDesc]          = useState("");
  const [priority,           setPriority]           = useState("normal");
  const [deposit,            setDeposit]            = useState("");
  const [notes,              setNotes]              = useState("");
  const [requiresDiagnosis,  setRequiresDiagnosis]  = useState(false);
  const [diagnosisFee,       setDiagnosisFee]       = useState("");

  // Staff
  const [staff,      setStaff]      = useState([]);
  const [assignedTo, setAssignedTo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // Live phone search
  useEffect(() => {
    if (selectedCustomer || custPhone.length < 2) { setCustMatches([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/pos/customers?q=${encodeURIComponent(custPhone)}&limit=6`);
        setCustMatches(res.data || []);
        setShowDropdown((res.data || []).length > 0);
      } catch { setCustMatches([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [custPhone, selectedCustomer]);

  // Load staff
  useEffect(() => {
    api.get("/pos/staff?roles=staff,technician").then(r => setStaff(r.data || [])).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!faultDesc.trim()) { setError("Fault description is required."); return; }

    setLoading(true);
    try {
      let customerId = selectedCustomer?._id;

      if (!customerId) {
        if (!custPhone.trim()) {
          setError("Customer phone number is required.");
          setLoading(false);
          return;
        }
        const cRes = await api.post("/pos/customers", { phone: custPhone.trim() });
        customerId = cRes.data?._id;
        if (!customerId) throw new Error("Failed to create customer.");
        if (cRes.existing) setError("Phone already registered — using existing customer: " + cRes.data.name);
      }

      const res = await api.post("/pos/jobs", {
        customerId, deviceType, deviceBrand, deviceModel, imei, color,
        faultDescription: faultDesc, priority,
        depositPaid: deposit ? Number(deposit) : 0,
        assignedTo: assignedTo || undefined,
        notes: notes || undefined,
        requiresDiagnosis,
        diagnosisFee: requiresDiagnosis ? (Number(diagnosisFee) || 0) : 0,
      });

      const jobId = res.data?._id;
      if (!jobId) throw new Error("Failed to create job.");
      router.push(`/dashboard/pos/jobs/${jobId}`);
    } catch (err) {
      setError(err.message || "Failed to create job.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pos/jobs" className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
          <FaArrowLeft size={12} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Repair Job</h1>
          <p className="text-sm text-gray-500">Create a new intake ticket</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Customer section */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Customer</p>

          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCustomer.phone}</p>
                {selectedCustomer.name && <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCustomer.name}</p>}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedCustomer(null); setCustPhone(""); }}
                className="text-xs text-gray-500 hover:text-red-400 transition"
              >
                Change
              </button>
            </div>
          ) : (
            <div ref={dropdownRef} className="relative">
              <label className={labelCls}>Phone number *</label>
              <div className="relative">
                <FaSearch size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="tel"
                  value={custPhone}
                  onChange={e => { setCustPhone(formatPhoneInput(e.target.value)); setShowDropdown(true); }}
                  onFocus={() => custMatches.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="024 000 0000"
                  className={`${inputCls} pl-9`}
                  autoFocus
                />
              </div>

              {showDropdown && custMatches.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden shadow-xl">
                  <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-300 dark:border-gray-700">Existing customers</p>
                  {custMatches.map(c => (
                    <button
                      key={c._id}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); setSelectedCustomer(c); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs flex-shrink-0">
                        {c.phone.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{c.phone}</p>
                        {c.name && <p className="text-xs text-gray-500 dark:text-gray-400">{c.name}</p>}
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-gray-300 dark:border-gray-700 px-4 py-2.5">
                    <p className="text-xs text-gray-500">Not listed? Proceed to create new customer with this number.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Device info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Device</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Device type</label>
              <select value={deviceType} onChange={e => setDeviceType(e.target.value)} className={selectCls}>
                {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <select value={deviceBrand} onChange={e => setDeviceBrand(e.target.value)} className={selectCls}>
                <option value="">Select brand…</option>
                {BRANDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Model</label>
              <input value={deviceModel} onChange={e => setDeviceModel(e.target.value)} placeholder="e.g. iPhone 14, Galaxy A54" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Color <span className="text-gray-600">(optional)</span></label>
              <input value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Black, Gold" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>IMEI / Serial number <span className="text-gray-600">(optional)</span></label>
            <input value={imei} onChange={e => setImei(e.target.value)} placeholder="15-digit IMEI" className={inputCls} />
          </div>
        </div>

        {/* Job details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Job Details</p>

          <div>
            <label className={labelCls}>Fault description *</label>
            <textarea
              value={faultDesc}
              onChange={e => setFaultDesc(e.target.value)}
              placeholder="Describe what the customer says is wrong with the device…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Diagnosis toggle */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-100/60 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700">
            <input
              type="checkbox"
              id="requiresDiagnosis"
              checked={requiresDiagnosis}
              onChange={e => { setRequiresDiagnosis(e.target.checked); if (!e.target.checked) setDiagnosisFee(""); }}
              className="mt-0.5 accent-amber-500 cursor-pointer"
            />
            <div className="flex-1">
              <label htmlFor="requiresDiagnosis" className="text-sm text-gray-900 dark:text-white font-medium cursor-pointer">
                Requires diagnosis before repair
              </label>
              <p className="text-xs text-gray-500 mt-0.5">Customer will be charged a diagnosis fee upfront</p>
              {requiresDiagnosis && (
                <div className="mt-3">
                  <label className={labelCls}>Diagnosis fee (GH₵) *</label>
                  <input
                    type="number" min="0" value={diagnosisFee}
                    onChange={e => setDiagnosisFee(e.target.value)}
                    placeholder="e.g. 50"
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={selectCls}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Deposit paid (GH₵)</label>
              <input
                type="number" min="0" value={deposit}
                onChange={e => setDeposit(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Assign to technician</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={selectCls}>
              <option value="">Unassigned</option>
              {staff.filter(s => ['technician','staff','admin'].includes(s.role)).map(s => <option key={s._id} value={s._id}>{s.name} ({s.role})</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Internal notes <span className="text-gray-600">(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any internal notes…"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Creating…" : <><FaPlus size={11} /> Create Job Ticket</>}
        </button>
      </form>
    </div>
  );
}
