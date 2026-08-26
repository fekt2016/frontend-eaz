"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatGhs } from "@/lib/shop";
import { Plus, Trash2, Pen, Check, X, Receipt } from "lucide-react";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/queries/useExpenses";
import {
  Alert, Button, Card, ConfirmDialog, EmptyState,
  Input, PageHeader, Select, Skeleton,
} from "@/components/ui";

/*
 * Nine categories, so these keep their own hues rather than collapsing onto six
 * semantic tones. Every pair is now a 700-on-tint in light mode: the old map had
 * text-cyan-400 (2.0:1), text-pink-400 (2.5:1) and text-gray-500 (3.9:1) as
 * *text*, which is unreadable on a pale fill.
 */
const CATEGORIES = [
  { value: "rent",        label: "Rent",        color: "text-blue-700 dark:text-blue-400",     bar: "bg-blue-500"   },
  { value: "utilities",   label: "Utilities",   color: "text-cyan-700 dark:text-cyan-400",     bar: "bg-cyan-500"   },
  { value: "tools",       label: "Tools",       color: "text-brand-ink dark:text-brand-400",   bar: "bg-brand-500"  },
  { value: "parts",       label: "Parts",       color: "text-orange-700 dark:text-orange-400", bar: "bg-orange-500" },
  { value: "salaries",    label: "Salaries",    color: "text-purple-700 dark:text-purple-400", bar: "bg-purple-500" },
  { value: "marketing",   label: "Marketing",   color: "text-pink-700 dark:text-pink-400",     bar: "bg-pink-500"   },
  { value: "transport",   label: "Transport",   color: "text-success dark:text-success-dark",  bar: "bg-success"    },
  { value: "maintenance", label: "Maintenance", color: "text-error dark:text-error-dark",      bar: "bg-error"      },
  { value: "other",       label: "Other",       color: "text-gray-700 dark:text-slate-300",    bar: "bg-gray-500"   },
];

const CATEGORY_CHIPS = {
  rent:        "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  utilities:   "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  tools:       "bg-brand-50 text-brand-ink dark:bg-brand-900/30 dark:text-brand-400",
  parts:       "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  salaries:    "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  marketing:   "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  transport:   "bg-success-surface text-success dark:bg-success-surface-dark dark:text-success-dark",
  maintenance: "bg-error-surface text-error dark:bg-error-surface-dark dark:text-error-dark",
  other:       "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
};

const catMap = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const [error, setError] = useState("");

  // Filters
  const [filterCat,  setFilterCat]  = useState("all");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo,   setFilterTo]   = useState("");
  const [page,       setPage]       = useState(1);
  const limit = 30;

  // Add form
  const [showForm,   setShowForm]   = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formCat,    setFormCat]    = useState("other");
  const [formDesc,   setFormDesc]   = useState("");
  const [formDate,   setFormDate]   = useState(today());
  const [formNotes,  setFormNotes]  = useState("");
  const [formError,  setFormError]  = useState("");

  // Edit
  const [editId,     setEditId]     = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCat,    setEditCat]    = useState("");
  const [editDesc,   setEditDesc]   = useState("");
  const [editDate,   setEditDate]   = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);

  const expensesQ = useExpenses({ page, limit, category: filterCat, from: filterFrom, to: filterTo });
  const expenses  = expensesQ.data?.data ?? [];
  const total     = expensesQ.data?.total ?? 0;
  const summary   = expensesQ.data?.summary ?? [];
  const totalAmt  = expensesQ.data?.totalAmount ?? 0;
  const loading   = expensesQ.isLoading;

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const formSaving = createExpense.isPending;
  const editSaving = updateExpense.isPending;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formAmount || !formDesc) return;
    setFormError("");
    // Money entered in cedis → sent as integer pesewas (×100). Invalidation refetches.
    createExpense.mutate(
      {
        amount: Math.round(Number(formAmount) * 100), category: formCat,
        description: formDesc, date: formDate, notes: formNotes || undefined,
      },
      {
        onSuccess: () => {
          setFormAmount(""); setFormDesc(""); setFormNotes(""); setFormDate(today()); setFormCat("other");
          setShowForm(false);
        },
        onError: (err) => setFormError(err.message || "Failed to save."),
      },
    );
  };

  const startEdit = (exp) => {
    setEditId(exp._id);
    setEditAmount(String((exp.amount || 0) / 100)); // pesewas → cedis
    setEditCat(exp.category);
    setEditDesc(exp.description);
    setEditDate(exp.date ? new Date(exp.date).toISOString().slice(0, 10) : today());
  };

  const handleEdit = (id) => {
    updateExpense.mutate(
      {
        id, amount: Math.round(Number(editAmount) * 100), category: editCat, // cedis → pesewas
        description: editDesc, date: editDate,
      },
      { onSuccess: () => setEditId(null), onError: (err) => setError(err.message || "Failed to update.") },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteExpense.mutate(deleteTarget._id, {
      onSettled: () => setDeleteTarget(null),
      onError: (err) => setError(err.message || "Failed to delete."),
    });
  };

  const hasFilters = filterCat !== "all" || filterFrom || filterTo;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track shop running costs and see true profit."
        actions={
          isSuperAdmin ? (
            <Button variant="brand" onClick={() => setShowForm(v => !v)} aria-expanded={showForm}>
              <Plus size={15} aria-hidden="true" /> Add expense
            </Button>
          ) : null
        }
      />

      {/* Add form */}
      {showForm && isSuperAdmin && (
        <Card>
          <p className="mb-4 text-body-sm font-semibold text-gray-900 dark:text-white">New expense</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Amount (GH₵)"
                required
                type="number"
                min="0"
                step="0.01"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                placeholder="0.00"
              />
              <Select label="Category" value={formCat} onChange={e => setFormCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Input label="Date" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
            <Input
              label="Description"
              required
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="e.g. Monthly rent for shop…"
            />
            <Input
              label="Notes"
              hint="Optional."
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="Any additional notes…"
            />
            <Alert tone="error">{formError}</Alert>
            <div className="flex gap-3">
              <Button type="submit" variant="brand" loading={formSaving}>
                {!formSaving && <Check size={15} aria-hidden="true" />} {formSaving ? "Saving…" : "Save expense"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card padding="sm">
            <p className="mb-2 font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">Total expenses</p>
            <p className="text-2xl font-bold tabular-nums text-error dark:text-error-dark">{formatGhs(totalAmt)}</p>
            <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">{total} records</p>
          </Card>
          {summary.slice(0, 3).map(s => {
            const cat = catMap[s._id] || catMap.other;
            return (
              <Card key={s._id} padding="sm">
                <p className="mb-2 font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">{cat.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${cat.color}`}>{formatGhs(s.total)}</p>
                <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
                  {s.count} record{s.count !== 1 ? "s" : ""}
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Category breakdown bar */}
      {!loading && summary.length > 0 && (
        <Card>
          <p className="mb-4 font-mono text-eyebrow font-bold uppercase text-gray-600 dark:text-slate-400">By category</p>
          <div className="space-y-3">
            {summary.map(s => {
              const cat = catMap[s._id] || catMap.other;
              const pct = totalAmt > 0 ? Math.round((s.total / totalAmt) * 100) : 0;
              return (
                <div key={s._id}>
                  <div className="mb-1 flex justify-between text-caption">
                    <span className={`font-medium ${cat.color}`}>{cat.label}</span>
                    <span className="text-gray-600 dark:text-slate-400">{formatGhs(s.total)} · {pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${cat.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-48">
          <Select
            label="Category"
            size="sm"
            value={filterCat}
            onChange={e => { setFilterCat(e.target.value); setPage(1); }}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </div>
        <div className="w-44">
          <Input
            label="From"
            size="sm"
            type="date"
            value={filterFrom}
            onChange={e => { setFilterFrom(e.target.value); setPage(1); }}
          />
        </div>
        <div className="w-44">
          <Input
            label="To"
            size="sm"
            type="date"
            value={filterTo}
            onChange={e => { setFilterTo(e.target.value); setPage(1); }}
          />
        </div>
        {hasFilters && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setFilterCat("all"); setFilterFrom(""); setFilterTo(""); setPage(1); }}
          >
            Clear
          </Button>
        )}
      </div>

      <Alert tone="error">{error}</Alert>

      {/* List */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses found"
            description={
              hasFilters
                ? "Nothing matches these filters."
                : isSuperAdmin
                  ? "Log the shop's running costs here so profit reflects what it really costs to trade."
                  : "A superadmin logs the shop's running costs here."
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={() => { setFilterCat("all"); setFilterFrom(""); setFilterTo(""); setPage(1); }}>
                  Clear filters
                </Button>
              ) : isSuperAdmin ? (
                <Button variant="brand" onClick={() => setShowForm(true)}>
                  <Plus size={15} aria-hidden="true" /> Add expense
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {expenses.map(exp => {
              const cat    = catMap[exp.category] || catMap.other;
              const isEdit = editId === exp._id;
              return (
                <div key={exp._id} className="px-5 py-4">
                  {isEdit ? (
                    <div className="grid items-end gap-3 sm:grid-cols-4">
                      <Input
                        label="Amount"
                        size="sm"
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                      />
                      <Select label="Category" size="sm" value={editCat} onChange={e => setEditCat(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </Select>
                      <Input label="Description" size="sm" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="brand" fullWidth onClick={() => handleEdit(exp._id)} loading={editSaving}>
                          {editSaving ? "Saving…" : "Save"}
                        </Button>
                        <Button size="sm" variant="secondary" className="px-2" onClick={() => setEditId(null)} aria-label="Cancel edit">
                          <X size={15} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-caption font-semibold ${CATEGORY_CHIPS[exp.category] || CATEGORY_CHIPS.other}`}>
                            {cat.label}
                          </span>
                          <p className="truncate text-body-sm text-gray-900 dark:text-white">{exp.description}</p>
                        </div>
                        <div className="flex items-center gap-3 text-caption text-gray-600 dark:text-slate-400">
                          <span>{new Date(exp.date).toLocaleDateString("en-GH", { dateStyle: "medium" })}</span>
                          {exp.notes && <span className="truncate">· {exp.notes}</span>}
                          <span>· {exp.createdBy?.name}</span>
                        </div>
                      </div>
                      <p className="flex-shrink-0 text-base font-bold tabular-nums text-error dark:text-error-dark">
                        {formatGhs(exp.amount)}
                      </p>
                      {isSuperAdmin && (
                        <div className="flex flex-shrink-0 gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2"
                            onClick={() => startEdit(exp)}
                            aria-label={`Edit expense: ${exp.description}`}
                          >
                            <Pen size={15} aria-hidden="true" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2 text-error dark:text-error-dark"
                            onClick={() => setDeleteTarget(exp)}
                            aria-label={`Delete expense: ${exp.description}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-body-sm text-gray-600 dark:text-slate-400">
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
            <Button size="sm" variant="secondary" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next →</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteExpense.isPending}
        title="Delete this expense?"
        description={deleteTarget ? `${formatGhs(deleteTarget.amount)} · ${deleteTarget.description}` : undefined}
        confirmLabel="Delete expense"
      >
        <p className="text-body-sm text-gray-600 dark:text-slate-400">
          It is removed permanently and the profit figures on the reports page change to match.
        </p>
      </ConfirmDialog>
    </div>
  );
}
