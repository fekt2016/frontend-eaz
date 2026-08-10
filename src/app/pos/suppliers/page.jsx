"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { FaPlus, FaTruck, FaSearch, FaCheck, FaTimes, FaEdit, FaTrash, FaChevronRight } from "react-icons/fa";

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition";
const labelCls = "block text-xs font-medium text-gray-400 mb-1.5";

const EMPTY_FORM = { name: "", contactPerson: "", phone: "", email: "", address: "", notes: "" };

export default function SuppliersPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [q,         setQ]         = useState("");

  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");

  const [editId,    setEditId]    = useState(null);
  const [editForm,  setEditForm]  = useState(EMPTY_FORM);
  const [editSaving,setEditSaving]= useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res = await api.get(`/pos/suppliers?${params}`);
      setSuppliers(res.data || []);
    } catch (e) {
      setError(e.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true); setFormError("");
    try {
      await api.post("/pos/suppliers", form);
      setForm(EMPTY_FORM); setShowForm(false);
      await fetchSuppliers();
    } catch (e) {
      setFormError(e.message || "Failed to save.");
    } finally { setSaving(false); }
  };

  const startEdit = (s) => {
    setEditId(s._id);
    setEditForm({
      name: s.name || "", contactPerson: s.contactPerson || "",
      phone: s.phone || "", email: s.email || "",
      address: s.address || "", notes: s.notes || "",
    });
  };

  const handleEdit = async (id) => {
    setEditSaving(true);
    try {
      await api.patch(`/pos/suppliers/${id}`, editForm);
      setEditId(null);
      await fetchSuppliers();
    } catch (e) {
      setError(e.message || "Failed to update.");
    } finally { setEditSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this supplier? Their parts will be unlinked.")) return;
    try {
      await api.delete(`/pos/suppliers/${id}`);
      await fetchSuppliers();
    } catch (e) { setError(e.message || "Failed to delete."); }
  };

  const toggleActive = async (s) => {
    try {
      await api.patch(`/pos/suppliers/${s._id}`, { isActive: !s.isActive });
      await fetchSuppliers();
    } catch (e) { setError(e.message || "Failed to update."); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FaTruck className="text-amber-400" size={17} /> Suppliers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
          >
            <FaPlus size={11} /> Add Supplier
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && isSuperAdmin && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p className="text-sm font-semibold text-white mb-4">New Supplier</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Supplier Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Accra Mobile Parts Ltd" required />
              </div>
              <div>
                <label className={labelCls}>Contact Person</label>
                <input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} className={inputCls} placeholder="Name of rep" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="024 000 0000" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="supplier@example.com" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Address</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} placeholder="Physical address" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} placeholder="Lead time, payment terms, etc." />
              </div>
            </div>
            {formError && <p className="text-red-400 text-xs">{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition disabled:opacity-50">
                <FaCheck size={11} /> {saving ? "Saving…" : "Save Supplier"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <FaSearch size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search suppliers…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* List */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />)}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-16 text-center">
            <FaTruck size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No suppliers yet</p>
            {isSuperAdmin && <p className="text-gray-600 text-sm mt-1">Add your first supplier to get started.</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {suppliers.map(s => (
              <div key={s._id}>
                {editId === s._id ? (
                  /* Inline edit */
                  <div className="p-5 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Name</label>
                        <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Contact Person</label>
                        <input value={editForm.contactPerson} onChange={e => setEditForm(f => ({ ...f, contactPerson: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Phone</label>
                        <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Email</label>
                        <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Notes</label>
                        <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(s._id)} disabled={editSaving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition disabled:opacity-50">
                        <FaCheck size={11} /> {editSaving ? "Saving…" : "Save"}
                      </button>
                      <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition">
                        <FaTimes size={11} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal row */
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <FaTruck size={13} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                        {!s.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Inactive</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-xs text-gray-500 mt-0.5">
                        {s.contactPerson && <span>{s.contactPerson}</span>}
                        {s.phone  && <a href={`tel:${s.phone}`}  className="hover:text-amber-400 transition">{s.phone}</a>}
                        {s.email  && <a href={`mailto:${s.email}`} className="hover:text-amber-400 transition">{s.email}</a>}
                      </div>
                      {s.notes && <p className="text-xs text-gray-600 truncate mt-0.5">{s.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/pos/suppliers/${s._id}`}
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition"
                      >
                        Parts <FaChevronRight size={9} />
                      </Link>
                      {isSuperAdmin && (
                        <>
                          <button onClick={() => toggleActive(s)} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition text-xs ${s.isActive ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-gray-700 text-gray-500 hover:text-white"}`} title={s.isActive ? "Deactivate" : "Activate"}>
                            {s.isActive ? "✓" : "○"}
                          </button>
                          <button onClick={() => startEdit(s)} className="w-8 h-8 rounded-lg border border-gray-700 text-gray-400 hover:text-amber-400 hover:border-amber-500/50 flex items-center justify-center transition">
                            <FaEdit size={11} />
                          </button>
                          <button onClick={() => handleDelete(s._id)} className="w-8 h-8 rounded-lg border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500/50 flex items-center justify-center transition">
                            <FaTrash size={11} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
