"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Plus, Truck, Search, Check, X, Pen, Trash2, ChevronRight, Circle } from "lucide-react";
import { FaWhatsapp, FaWeixin } from "react-icons/fa";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from "@/hooks/queries/useSuppliers";
import {
  Alert, Badge, Button, Card, ConfirmDialog, EmptyState,
  Input, PageHeader, Skeleton,
} from "@/components/ui";

const EMPTY_FORM = { name: "", contactPerson: "", phone: "", whatsapp: "", wechat: "", email: "", address: "", notes: "" };

export default function SuppliersPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const [error,     setError]     = useState("");
  const [q,         setQ]         = useState("");

  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [editId,    setEditId]    = useState(null);
  const [editForm,  setEditForm]  = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const suppliersQ = useSuppliers({ q });
  const suppliers  = suppliersQ.data ?? [];
  const loading    = suppliersQ.isLoading;

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const saving     = createSupplier.isPending;
  const editSaving = updateSupplier.isPending;

  const setField    = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setEditField = (key) => (e) => setEditForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setFormError("");
    createSupplier.mutate(form, {
      onSuccess: () => { setForm(EMPTY_FORM); setShowForm(false); },
      onError: (err) => setFormError(err.message || "Failed to save."),
    });
  };

  const startEdit = (s) => {
    setEditId(s._id);
    setEditForm({
      name: s.name || "", contactPerson: s.contactPerson || "",
      phone: s.phone || "", whatsapp: s.whatsapp || "", wechat: s.wechat || "",
      email: s.email || "",
      address: s.address || "", notes: s.notes || "",
    });
  };

  const handleEdit = (id) => {
    updateSupplier.mutate(
      { id, ...editForm },
      { onSuccess: () => setEditId(null), onError: (err) => setError(err.message || "Failed to update.") },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteSupplier.mutate(deleteTarget._id, {
      onSettled: () => setDeleteTarget(null),
      onError: (err) => setError(err.message || "Failed to delete."),
    });
  };

  const toggleActive = (s) => {
    updateSupplier.mutate(
      { id: s._id, isActive: !s.isActive },
      { onError: (err) => setError(err.message || "Failed to update.") },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description={`${suppliers.length} supplier${suppliers.length !== 1 ? "s" : ""}`}
        actions={
          isSuperAdmin ? (
            <Button variant="brand" onClick={() => setShowForm(v => !v)} aria-expanded={showForm}>
              <Plus size={15} aria-hidden="true" /> Add supplier
            </Button>
          ) : null
        }
      />

      {/* Add form */}
      {showForm && isSuperAdmin && (
        <Card>
          <p className="mb-4 text-body-sm font-semibold text-gray-900 dark:text-white">New supplier</p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Supplier name" required value={form.name} onChange={setField("name")} placeholder="e.g. Accra Mobile Parts Ltd" />
              <Input label="Contact person" value={form.contactPerson} onChange={setField("contactPerson")} placeholder="Name of rep" />
              <Input label="Phone" type="tel" value={form.phone} onChange={setField("phone")} placeholder="024 000 0000" />
              <Input label="Email" type="email" value={form.email} onChange={setField("email")} placeholder="supplier@example.com" />
              <Input label="WhatsApp" value={form.whatsapp} onChange={setField("whatsapp")} placeholder="+86 138 0013 8000" />
              <Input label="WeChat ID" value={form.wechat} onChange={setField("wechat")} placeholder="e.g. sz_parts_2024" />
              <Input label="Address" className="sm:col-span-2" value={form.address} onChange={setField("address")} placeholder="Physical address" />
              <div className="sm:col-span-2">
                <Input label="Notes" value={form.notes} onChange={setField("notes")} placeholder="Lead time, payment terms, etc." />
              </div>
            </div>
            <Alert tone="error">{formError}</Alert>
            <div className="flex gap-3">
              <Button type="submit" variant="brand" loading={saving}>
                {!saving && <Check size={15} aria-hidden="true" />} {saving ? "Saving…" : "Save supplier"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-gray-600 dark:text-slate-400"
        />
        <Input
          label="Search suppliers"
          hideLabel
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search suppliers…"
          className="pl-10"
        />
      </div>

      <Alert tone="error">{error}</Alert>

      {/* List */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No suppliers yet"
            description={
              isSuperAdmin
                ? "Add your first supplier so parts can be linked to where they came from."
                : "A superadmin can add suppliers here."
            }
            action={
              isSuperAdmin ? (
                <Button variant="brand" onClick={() => setShowForm(true)}>
                  <Plus size={15} aria-hidden="true" /> Add supplier
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {suppliers.map(s => (
              <div key={s._id}>
                {editId === s._id ? (
                  /* Inline edit */
                  <div className="space-y-4 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Name" value={editForm.name} onChange={setEditField("name")} />
                      <Input label="Contact person" value={editForm.contactPerson} onChange={setEditField("contactPerson")} />
                      <Input label="Phone" type="tel" value={editForm.phone} onChange={setEditField("phone")} />
                      <Input label="Email" type="email" value={editForm.email} onChange={setEditField("email")} />
                      <Input label="WhatsApp" value={editForm.whatsapp} onChange={setEditField("whatsapp")} placeholder="+86 138 0013 8000" />
                      <Input label="WeChat ID" value={editForm.wechat} onChange={setEditField("wechat")} />
                      <div className="sm:col-span-2">
                        <Input label="Notes" value={editForm.notes} onChange={setEditField("notes")} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="brand" onClick={() => handleEdit(s._id)} loading={editSaving}>
                        {!editSaving && <Check size={15} aria-hidden="true" />} {editSaving ? "Saving…" : "Save"}
                      </Button>
                      <Button variant="secondary" onClick={() => setEditId(null)}>
                        <X size={15} aria-hidden="true" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Normal row */
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10">
                      <Truck size={16} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-body-sm font-semibold text-gray-900 dark:text-white">{s.name}</p>
                        {!s.isActive && <Badge tone="neutral">Inactive</Badge>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-caption text-gray-600 dark:text-slate-400">
                        {s.contactPerson && <span>{s.contactPerson}</span>}
                        {s.phone && <a href={`tel:${s.phone}`} className="transition-colors hover:text-brand-ink dark:hover:text-brand-400">{s.phone}</a>}
                        {s.email && <a href={`mailto:${s.email}`} className="transition-colors hover:text-brand-ink dark:hover:text-brand-400">{s.email}</a>}
                        {s.whatsapp && (
                          <a
                            href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 transition-colors hover:text-success dark:hover:text-success-dark"
                          >
                            <FaWhatsapp aria-hidden="true" className="text-success dark:text-success-dark" size={12} /> {s.whatsapp}
                          </a>
                        )}
                        {s.wechat && (
                          <span className="flex items-center gap-1">
                            <FaWeixin aria-hidden="true" className="text-success dark:text-success-dark" size={12} /> {s.wechat}
                          </span>
                        )}
                      </div>
                      {s.notes && <p className="mt-0.5 truncate text-caption text-gray-600 dark:text-slate-400">{s.notes}</p>}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Button size="sm" variant="ghost" href={`/dashboard/pos/suppliers/${s._id}`}>
                        Parts <ChevronRight size={14} aria-hidden="true" />
                      </Button>
                      {isSuperAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`px-2 ${s.isActive ? "text-success dark:text-success-dark" : ""}`}
                            onClick={() => toggleActive(s)}
                            aria-label={s.isActive ? `Deactivate ${s.name}` : `Activate ${s.name}`}
                          >
                            {s.isActive
                              ? <Check size={15} aria-hidden="true" />
                              : <Circle size={15} aria-hidden="true" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2"
                            onClick={() => startEdit(s)}
                            aria-label={`Edit ${s.name}`}
                          >
                            <Pen size={15} aria-hidden="true" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2 text-error dark:text-error-dark"
                            onClick={() => setDeleteTarget(s)}
                            aria-label={`Delete ${s.name}`}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteSupplier.isPending}
        title="Delete this supplier?"
        description={deleteTarget?.name}
        confirmLabel="Delete supplier"
      >
        <p className="text-body-sm text-gray-600 dark:text-slate-400">
          Every part linked to them is unlinked — the parts themselves stay in stock, but you lose
          the record of where they came from. To stop using them without losing that, deactivate instead.
        </p>
      </ConfirmDialog>
    </div>
  );
}
