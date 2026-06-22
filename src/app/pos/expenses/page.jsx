"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaReceipt,
} from "react-icons/fa";

const CATEGORIES = [
  { value: "rent",         label: "Rent",         color: "text-blue-400",   bg: "bg-blue-500/15"   },
  { value: "utilities",    label: "Utilities",    color: "text-cyan-400",   bg: "bg-cyan-500/15"   },
  { value: "tools",        label: "Tools",        color: "text-amber-400",  bg: "bg-amber-500/15"  },
  { value: "parts",        label: "Parts",        color: "text-orange-400", bg: "bg-orange-500/15" },
  { value: "salaries",     label: "Salaries",     color: "text-purple-400", bg: "bg-purple-500/15" },
  { value: "marketing",    label: "Marketing",    color: "text-pink-400",   bg: "bg-pink-500/15"   },
  { value: "transport",    label: "Transport",    color: "text-green-400",  bg: "bg-green-500/15"  },
  { value: "maintenance",  label: "Maintenance",  color: "text-red-400",    bg: "bg-red-500/15"    },
  { value: "other",        label: "Other",        color: "text-gray-400",   bg: "bg-gray-500/15"   },
];

const catMap = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

const inputCls  = "w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition";
const labelCls  = "block text-xs font-medium text-gray-400 mb-1.5";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const [expenses, setExpenses] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [summary,  setSummary]  = useState([]);
  const [totalAmt, setTotalAmt] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // Filters
  const [filterCat,  setFilterCat]  = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo,   setFilterTo]   = useState("");
  const [page,       setPage]       = useState(1);
  const limit = 30;

  // Add form
  const [showForm,    setShowForm]    = useState(false);
  const [formAmount,  setFormAmount]  = useState("");
  const [formCat,     setFormCat]     = useState("other");
  const [formDesc,    setFormDesc]    = useState("");
  const [formDate,    setFormDate]    = useState(today());
  const [formNotes,   setFormNotes]   = useState("");
  const [formSaving,  setFormSaving]  = useState(false);
  const [formError,   setFormError]   = useState("");

  // Edit
  const [editId,      setEditId]      = useState(null);
  const [editAmount,  setEditAmount]  = useState("");
  const [editCat,     setEditCat]     = useState("");
  const [editDesc,    setEditDesc]    = useState("");
  const [editDate,    setEditDate]    = useState("");
  const [editSaving,  setEditSaving]  = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page, limit });
      if (filterCat !== "all") params.set("category", filterCat);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo)   params.set("to",   filterTo);
      const res = await api.get(`/pos/expenses?${params}`);
      setExpenses(res.data || []);
      setTotal(res.total   || 0);
      setSummary(res.summary || []);
      setTotalAmt(res.totalAmount || 0);
    } catch (e) {
      setError(e.message || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, [page, filterCat, filterFrom, filterTo]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formAmount || !formDesc) return;
    setFormSaving(true); setFormError("");
    try {
      await api.post("/pos/expenses", {
        amount: Number(formAmount), category: formCat,
        description: formDesc, date: formDate, notes: formNotes || undefined,
      });
      setFormAmount(""); setFormDesc(""); setFormNotes(""); setFormDate(today()); setFormCat("other");
      setShowForm(false);
      await fetchExpenses();
    } catch (e) {
      setFormError(e.message || "Failed to save.");
    } finally {
      setFormSaving(false);
    }
  };

  const startEdit = (exp) => {
    setEditId(exp._id);
    setEditAmount(String(exp.amount));
    setEditCat(exp.category);
    setEditDesc(exp.description);
    setEditDate(exp.date ? new Date(exp.date).toISOString().slice(0, 10) : today());
  };

  const handleEdit = async (id) => {
    setEditSaving(true);
    try {
      await api.patch(`/pos/expenses/${id}`, {
        amount: Number(editAmount), category: editCat,
        description: editDesc, date: editDate,
      });
      setEditId(null);
      await fetchExpenses();
    } catch (e) {
      setError(e.message || "Failed to update.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.delete(`/pos/expenses/${id}`);
      await fetchExpenses();
    } catch (e) {
      setError(e.message || "Failed to delete.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FaReceipt className="text-amber-400" size={17} /> Expenses
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track shop running costs and see true profit</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
          >
            <FaPlus size={11} /> Add Expense
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && isSuperAdmin && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p className="text-sm font-semibold text-white mb-4">New Expense</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Amount (GH₵) *</label>
                <input type="number" min="0" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} className={inputCls} placeholder="0.00" required />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={formCat} onChange={e => setFormCat(e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description *</label>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)} className={inputCls} placeholder="e.g. Monthly rent for shop…" required />
            </div>
            <div>
              <label className={labelCls}>Notes (optional)</label>
              <input value={formNotes} onChange={e => setFormNotes(e.target.value)} className={inputCls} placeholder="Any additional notes…" />
            </div>
            {formError && <p className="text-red-400 text-xs">{formError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={formSaving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition disabled:opacity-50">
                <FaCheck size={11} /> {formSaving ? "Saving…" : "Save Expense"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Expenses</p>
            <p className="text-2xl font-bold text-red-400">GH₵{totalAmt.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">{total} records</p>
          </div>
          {summary.slice(0, 3).map(s => {
            const cat = catMap[s._id] || catMap.other;
            return (
              <div key={s._id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{cat.label}</p>
                <p className={`text-2xl font-bold ${cat.color}`}>GH₵{s.total.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.count} record{s.count !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Category breakdown bar */}
      {!loading && summary.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">By Category</p>
          <div className="space-y-3">
            {summary.map(s => {
              const cat  = catMap[s._id] || catMap.other;
              const pct  = totalAmt > 0 ? Math.round((s.total / totalAmt) * 100) : 0;
              return (
                <div key={s._id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium ${cat.color}`}>{cat.label}</span>
                    <span className="text-gray-400">GH₵{s.total.toLocaleString()} · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.bg}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterCat}
          onChange={e => { setFilterCat(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 focus:outline-none focus:border-amber-500 transition"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <input
          type="date" value={filterFrom} onChange={e => { setFilterFrom(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 focus:outline-none focus:border-amber-500 transition"
        />
        <span className="text-gray-600 text-sm">to</span>
        <input
          type="date" value={filterTo} onChange={e => { setFilterTo(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-300 focus:outline-none focus:border-amber-500 transition"
        />
        {(filterCat !== "all" || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterCat("all"); setFilterFrom(""); setFilterTo(""); setPage(1); }}
            className="text-xs text-gray-500 hover:text-white px-3 py-2 rounded-xl border border-gray-800 hover:border-gray-700 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-800 animate-pulse" />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <FaReceipt size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No expenses found</p>
            {isSuperAdmin && <p className="text-gray-600 text-sm mt-1">Click &quot;Add Expense&quot; to log your first expense.</p>}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {expenses.map(exp => {
              const cat     = catMap[exp.category] || catMap.other;
              const isEdit  = editId === exp._id;
              return (
                <div key={exp._id} className="px-5 py-4">
                  {isEdit ? (
                    <div className="grid sm:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className={labelCls}>Amount</label>
                        <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Category</label>
                        <select value={editCat} onChange={e => setEditCat(e.target.value)} className={inputCls}>
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className={inputCls} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(exp._id)} disabled={editSaving} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition disabled:opacity-50">
                          {editSaving ? "…" : "Save"}
                        </button>
                        <button onClick={() => setEditId(null)} className="px-3 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-xs transition">
                          <FaTimes size={11} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.bg} ${cat.color}`}>
                            {cat.label}
                          </span>
                          <p className="text-sm text-white truncate">{exp.description}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{new Date(exp.date).toLocaleDateString("en-GH", { dateStyle: "medium" })}</span>
                          {exp.notes && <span className="truncate">· {exp.notes}</span>}
                          <span>· {exp.createdBy?.name}</span>
                        </div>
                      </div>
                      <p className="text-base font-bold text-red-400 flex-shrink-0">
                        GH₵{exp.amount.toLocaleString()}
                      </p>
                      {isSuperAdmin && (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => startEdit(exp)} className="w-8 h-8 rounded-lg border border-gray-700 text-gray-400 hover:text-amber-400 hover:border-amber-500/50 flex items-center justify-center transition">
                            <FaEdit size={11} />
                          </button>
                          <button onClick={() => handleDelete(exp._id)} className="w-8 h-8 rounded-lg border border-gray-700 text-gray-400 hover:text-red-400 hover:border-red-500/50 flex items-center justify-center transition">
                            <FaTrash size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 disabled:opacity-40 hover:bg-gray-800 transition">← Prev</button>
            <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 disabled:opacity-40 hover:bg-gray-800 transition">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
