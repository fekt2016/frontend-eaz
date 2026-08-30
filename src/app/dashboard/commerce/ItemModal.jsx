"use client";

/*
 * The Marketplace "Add" modal (owner request, 2026-08-30): use the PRODUCT
 * form, and let it accept parts too.
 *
 * It previously rendered its own part-shaped form that always posted to
 * /pos/inventory, so adding a shop product from the Marketplace was not
 * possible — you had to leave for /commerce/products/new. Now one form covers
 * both, via ProductForm's `allowPart`.
 *
 * THE ENDPOINT STILL DIFFERS, deliberately. Bench parts and shop products are
 * one collection, but they are not the same thing to CREATE:
 *
 *   POST /pos/inventory  sets sellOnline:false, isActive:false, useInRepairs:true
 *   POST /products       sets none of those
 *
 * Those bench defaults exist so a new part is not silently published to the
 * public storefront. Routing both through /products for the sake of a single
 * endpoint would do exactly that — and it would fail quietly, because
 * createProduct destructures a whitelist and would drop costPrice, supplier,
 * barcode, compatibleWith and lowStockThreshold without complaint.
 */

import { useState } from "react";
import { X } from "lucide-react";
import ProductForm from "@/components/commerce/ProductForm";
import { api, errorMessage } from "@/lib/api";

export default function ItemModal({ item, suppliers = [], onClose, onSave }) {
  const editing = Boolean(item?._id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // An existing row is edited as whatever it already is. Only a NEW item offers
  // the choice — changing a saved part into a shop product is a different
  // operation (it has to publish it), not a form toggle.
  const initialType = editing ? (item.isPart || item.partCategory ? "part" : "product") : "product";

  async function handleSubmit(data) {
    setSaving(true);
    setError("");
    try {
      const { itemType, ...payload } = data;
      if (itemType === "part") {
        if (editing) await api.patch(`/pos/inventory/${item._id}`, payload);
        else await api.post("/pos/inventory", payload);
      } else if (editing) {
        await api.patch(`/products/${item._id}`, payload);
      } else {
        await api.post("/products", payload);
      }
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
            allowPart={!editing || initialType === "part"}
            suppliers={suppliers}
            initial={editing ? { ...item, itemType: initialType } : { itemType: initialType }}
            submitLabel={editing ? "Save changes" : "Add item"}
            submitting={saving}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
