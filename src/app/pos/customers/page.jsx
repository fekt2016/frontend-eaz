"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { FaSearch, FaUser, FaPhone, FaPlus } from "react-icons/fa";
import { formatPhoneInput } from "@/lib/sanitize";

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition";
const labelCls = "block text-xs font-medium text-gray-400 mb-1.5";

function AddCustomerModal({ onClose, onSave }) {
  const [phone,    setPhone]    = useState("");
  const [matches,  setMatches]  = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  // Live search as phone is typed
  useEffect(() => {
    if (phone.length < 2) { setMatches([]); setShowDrop(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/pos/customers?q=${encodeURIComponent(phone)}&limit=5`);
        setMatches(res.data || []);
        setShowDrop((res.data || []).length > 0);
      } catch { setMatches([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [phone]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { setError("Phone number is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await api.post("/pos/customers", { phone: phone.trim() });
      if (res.existing) {
        // Already exists — just close and refresh
        onSave();
        return;
      }
      onSave();
    } catch (err) {
      setError(err.message || "Failed to create customer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">Add Customer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="relative">
            <label className={labelCls}>Phone number *</label>
            <div className="relative">
              <FaPhone size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(formatPhoneInput(e.target.value)); setShowDrop(true); }}
                onFocus={() => matches.length > 0 && setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                placeholder="024 000 0000"
                className={`${inputCls} pl-9`}
                autoFocus
                required
              />
            </div>
            {showDrop && matches.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-700">Existing customers</p>
                {matches.map(c => (
                  <button
                    key={c._id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); onClose(); window.location.href = `/pos/customers/${c._id}`; }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-700 transition"
                  >
                    <p className="text-sm text-white font-medium">{c.phone}</p>
                    {c.name && <p className="text-xs text-gray-400">{c.name}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 transition">
            {saving ? "Saving…" : "Add Customer"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [q,         setQ]         = useState("");
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState(false);
  const [error,     setError]     = useState("");
  const limit = 30;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit });
      if (q.trim()) params.set("q", q.trim());
      const res = await api.get(`/pos/customers?${params}`);
      setCustomers(res.data || []);
      setTotal(res.total);
    } catch (err) {
      setError(err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  if (error) return <p className="text-red-400 text-sm p-5">{error}</p>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registered customers</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
        >
          <FaPlus size={11} /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FaSearch size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }}
          placeholder="Search by name or phone…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      {/* List */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-800 animate-pulse" />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center">
            <FaUser size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No customers found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {customers.map(c => (
              <Link
                key={c._id}
                href={`/pos/customers/${c._id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-800/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                    {(c.name || c.phone).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-1.5">
                      <FaPhone size={9} className="text-gray-500" /> {c.phone}
                    </p>
                    {c.name && <p className="text-xs text-gray-500">{c.name}</p>}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString("en-GH")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 disabled:opacity-40 hover:bg-gray-800 transition">← Prev</button>
            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 disabled:opacity-40 hover:bg-gray-800 transition">Next →</button>
          </div>
        </div>
      )}

      {modal && (
        <AddCustomerModal
          onClose={() => setModal(false)}
          onSave={() => { setModal(false); fetchCustomers(); }}
        />
      )}
    </div>
  );
}
