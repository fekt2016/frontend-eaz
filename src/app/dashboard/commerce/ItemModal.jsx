"use client";

/*
 * The Marketplace "Add" modal.
 *
 * There is no longer a product/part distinction (owner request, 2026-09-04):
 * every item is created through POST /products, is listed online and offered
 * in store, and carries the fields that used to be bench-only. Whether it can
 * also go on a repair job is a checkbox on the form.
 *
 * /pos/inventory is still what this screen READS and deletes through; it just
 * no longer creates.
 */import { useState } from "react";
import { X } from "lucide-react";
import ProductForm from "@/components/commerce/ProductForm";
import { api, errorMessage } from "@/lib/api";

export default function ItemModal({ item, suppliers = [], onClose, onSave }) {
  const editing = Boolean(item?._id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  async function handleSubmit(data) {
    setSaving(true);
    setError("");
    try {
      if (editing) await api.patch(`/products/${item._id}`, data);
      else await api.post("/products", data);
      onSave();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">
            {editing ? `Edit ${item.name}` : "Add to inventory"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <p className="mb-4 text-sm text-error dark:text-error-dark" role="alert">{error}</p>
          )}
          <ProductForm
            suppliers={suppliers}
            initial={editing ? item : undefined}
            submitLabel={editing ? "Save changes" : "Add item"}
            submitting={saving}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
