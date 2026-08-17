"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Search, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { sanitizeEmail, sanitizePhone } from "@/lib/sanitize";

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition";
const selectCls = `${inputCls} cursor-pointer`;
const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5";

const DEVICE_TYPES = ["Phone", "Tablet", "Laptop", "Smartwatch", "Other"];
const BRANDS = ["Apple", "Samsung", "Tecno", "Infinix", "Itel", "Huawei", "Nokia", "Oppo", "Xiaomi", "OnePlus", "Other"];

export default function NewJobPage() {
  const router = useRouter();

  // Customer — unified phone search
  const [custPhone,        setCustPhone]        = useState("");
  const [custAccountVia,   setCustAccountVia]   = useState("none");
  const [custEmail,        setCustEmail]        = useState("");
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
  const [notes,              setNotes]              = useState("");
  const [requiresDiagnosis,  setRequiresDiagnosis]  = useState(false);
  const [diagnosisFee,       setDiagnosisFee]       = useState("");

  // Parts & payment
  const [partQuery,     setPartQuery]     = useState("");
  const [partResults,   setPartResults]   = useState([]);
  const [showPartDrop,  setShowPartDrop]  = useState(false);
  const [selectedParts, setSelectedParts] = useState([]);
  const [payAmount,     setPayAmount]     = useState("");
  const [payMethod,     setPayMethod]     = useState("cash");
  const [payRef,        setPayRef]        = useState("");
  const partRef = useRef(null);

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

  // Load technicians
  useEffect(() => {
    api.get("/pos/technicians").then(r => setStaff(r.data || [])).catch(() => {});
  }, []);

  // Live part inventory search
  useEffect(() => {
    if (partQuery.trim().length < 2) { setPartResults([]); setShowPartDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/pos/inventory?q=${encodeURIComponent(partQuery.trim())}&limit=8`);
        setPartResults(res.data || []);
        setShowPartDrop(true);
      } catch { setPartResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [partQuery]);

  // Close the part dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (partRef.current && !partRef.current.contains(e.target)) setShowPartDrop(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pickPart = (part) => {
    setSelectedParts(prev => {
      const exists = prev.find(p => p.id === part._id);
      if (exists) return prev.map(p => p.id === part._id ? { ...p, quantity: (p.quantity || 1) + 1 } : p);
      return [...prev, { id: part._id, name: part.name, sku: part.sku || "", quantity: 1, cost: (Number(part.sellingPrice) || 0) / 100 }];
    });
    setPartQuery(""); setPartResults([]); setShowPartDrop(false);
  };

  const removePart = (id) => setSelectedParts(prev => prev.filter(p => p.id !== id));
  const updatePart = (id, field, val) => setSelectedParts(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));

  const totalParts = selectedParts.reduce((s, p) => s + (p.cost || 0) * (p.quantity || 1), 0);

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
        const phone = sanitizePhone(custPhone);
        if (!phone) {
          setError("Select an existing customer or enter a phone number.");
          setLoading(false);
          return;
        }
        const cRes = await api.post("/pos/customers", {
          phone,
          accountVia: custAccountVia,
          ...(custAccountVia === "email" && custEmail.trim() ? { email: sanitizeEmail(custEmail) } : {}),
        });
        customerId = cRes.data?._id;
        if (!customerId) throw new Error("Failed to create customer.");
        if (cRes.existing) setError("Phone already registered — using existing customer: " + cRes.data.name);
      }

      const res = await api.post("/pos/jobs", {
        customerId, deviceType, deviceBrand, deviceModel, imei, color,
        faultDescription: faultDesc, priority,
        parts: selectedParts.map(p => ({ partId: p.id, quantity: p.quantity })),
        // Money is entered in cedis and sent as integer pesewas (×100).
        paymentAmount: payAmount ? Math.round(Number(payAmount) * 100) : 0,
        paymentMethod: payMethod,
        paymentReference: payRef || undefined,
        assignedTo: assignedTo || undefined,
        notes: notes || undefined,
        requiresDiagnosis,
        diagnosisFee: requiresDiagnosis ? Math.round((Number(diagnosisFee) || 0) * 100) : 0,
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
          <ArrowLeft size={12} />
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-500/10 border border-brand-500/30">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCustomer.phone}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {[selectedCustomer.name, selectedCustomer.email].filter(Boolean).join(" · ") || "No name on file"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedCustomer(null); setCustPhone(""); setCustEmail(""); setCustAccountVia("none"); }}
                className="text-xs text-gray-500 hover:text-red-400 transition"
              >
                Change
              </button>
            </div>
          ) : (
            <div ref={dropdownRef} className="relative">
              <label className={labelCls}>Search customer *</label>
              <div className="relative">
                <Search size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  autoComplete="off"
                  value={custPhone}
                  onChange={e => { setCustPhone(e.target.value); setShowDropdown(true); }}
                  onFocus={() => custMatches.length > 0 && setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Search by phone or name…"
                  className={`${inputCls} pl-9`}
                  autoFocus
                />
              </div>

              {showDropdown && custMatches.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden shadow-xl">
                  <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-300 dark:border-gray-700">Existing customers — click to select</p>
                  {custMatches.map(c => (
                    <button
                      key={c._id}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); setSelectedCustomer(c); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs flex-shrink-0">
                        {c.phone.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{c.phone}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {[c.name, c.email].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </button>
                  ))}
                  <div className="border-t border-gray-300 dark:border-gray-700 px-4 py-2.5">
                    <p className="text-xs text-gray-500">Not listed? Fill the form to create a new customer with this number.</p>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <label className={labelCls}>Create login account?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustAccountVia("none")}
                    className={`px-2 py-2 rounded-xl border text-xs font-medium transition ${custAccountVia === "none" ? "bg-brand-500 text-white border-brand-500" : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-500"}`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustAccountVia("email")}
                    className={`px-2 py-2 rounded-xl border text-xs font-medium transition ${custAccountVia === "email" ? "bg-brand-500 text-white border-brand-500" : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-500"}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustAccountVia("phone")}
                    className={`px-2 py-2 rounded-xl border text-xs font-medium transition ${custAccountVia === "phone" ? "bg-brand-500 text-white border-brand-500" : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-500"}`}
                  >
                    Text (SMS)
                  </button>
                </div>
                {custAccountVia === "email" && (
                  <div className="mt-3">
                    <label className={labelCls}>Email</label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={e => setCustEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className={inputCls}
                    />
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {custAccountVia === "none" && "Customer stays phone-only, no login."}
                  {custAccountVia === "email" && "Account created — credentials emailed to the customer."}
                  {custAccountVia === "phone" && "Account created — password sent via SMS (Hubtel) to the number above."}
                </p>
              </div>
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
              className="mt-0.5 accent-brand-500 cursor-pointer"
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
          </div>

          <div>
            <label className={labelCls}>Assign to technician</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={selectCls}>
              <option value="">Auto-assign (least busy)</option>
              {staff.filter(s => s.role === 'technician').map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Every job is assigned — chose one or let the shop auto-assign.</p>
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

        {/* Parts & payment */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Parts & Payment</p>

          {/* Part search */}
          <div ref={partRef} className="relative">
            <label className={labelCls}>Search parts to order <span className="text-gray-600">(optional)</span></label>
            <div className="relative">
              <Search size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={partQuery}
                onChange={e => { setPartQuery(e.target.value); setShowPartDrop(true); }}
                onFocus={() => partResults.length > 0 && setShowPartDrop(true)}
                onBlur={() => setTimeout(() => setShowPartDrop(false), 150)}
                placeholder="Search by name or SKU…"
                className={`${inputCls} pl-9`}
              />
            </div>

            {showPartDrop && partResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 overflow-hidden shadow-xl max-h-64 overflow-y-auto">
                {partResults.map(p => (
                  <button
                    key={p._id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); pickPart(p); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{p.name}</p>
                      {p.sku && <p className="text-xs text-gray-500 truncate">{p.sku}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold">GH₵{((Number(p.sellingPrice) || 0) / 100).toLocaleString()}</p>
                      <p className={`text-xs ${Number(p.quantity) <= 0 ? "text-red-500" : "text-gray-500"}`}>Stock: {p.quantity}</p>
                    </div>
                  </button>
                ))}
                {partResults.length === 0 && (
                  <p className="px-4 py-3 text-xs text-gray-500">No parts found.</p>
                )}
              </div>
            )}
          </div>

          {/* Selected parts */}
          {selectedParts.length > 0 && (
            <div className="space-y-2">
              {selectedParts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-100/60 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">GH₵{(p.cost || 0).toLocaleString()} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => updatePart(p.id, "quantity", Math.max(1, (p.quantity || 1) - 1))} className="w-7 h-7 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">−</button>
                    <span className="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">{p.quantity}</span>
                    <button type="button" onClick={() => updatePart(p.id, "quantity", (p.quantity || 1) + 1)} className="w-7 h-7 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">+</button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-20 text-right">GH₵{((p.cost || 0) * (p.quantity || 1)).toLocaleString()}</span>
                  <button type="button" onClick={() => removePart(p.id)} className="text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-1">
                <span className="text-gray-600 dark:text-gray-300">Parts total</span>
                <span className="text-gray-900 dark:text-white">GH₵{totalParts.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Payment at intake */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment at intake <span className="text-gray-600 dark:text-gray-400">(optional)</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Amount received (GH₵)</label>
                <input
                  type="number" min="0" value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder={totalParts ? String(totalParts) : "0"}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className={selectCls}>
                  <option value="cash">Cash</option>
                  <option value="momo">Mobile Money</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Reference <span className="text-gray-600">(optional)</span></label>
              <input
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
                placeholder="e.g. Momo reference / receipt no."
                className={inputCls}
              />
            </div>
            {totalParts > 0 && Number(payAmount || 0) >= totalParts && (
              <p className="text-xs text-green-600 dark:text-green-400">Covered by payment — parts fully paid at intake.</p>
            )}
          </div>
        </div>

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Creating…" : <><Plus size={11} /> Create Job Ticket</>}
        </button>
      </form>
    </div>
  );
}
