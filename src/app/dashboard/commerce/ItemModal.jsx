"use client";

/*
 * The Marketplace "Add" modal: ONE form and ONE endpoint for both kinds of
 * stock — shop products and bench parts.
 *
 * It previously rendered its own part-shaped form that always posted to
 * /pos/inventory, so adding a shop product from the Marketplace was not
 * possible. The form was unified 2026-08-30 (ProductForm's `allowPart`); the
 * endpoint followed 2026-09-04 (owner request).
 *
 * Everything now goes to /products and declares itself with `itemType`. A part
 * payload is handed on by productController to the POS handler that owns the
 * bench defaults — sellOnline:false, isActive:false, useInRepairs:true — plus
 * the quantity→stock / sellingPrice→price mapping and the INVENTORY_* audit
 * action. So a bench part is still built exactly as before and is still not
 * published to the storefront; only the URL it arrives at has changed.
 *
 * /pos/inventory stays for the POS screens that call it directly.
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
      // One destination for both kinds of stock (owner request, 2026-09-04).
      // `itemType` rides along in the body: /products hands a part to the POS
      // handler that owns the bench defaults, so nothing about how a part is
      // built has changed — only the URL it arrives at.
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
