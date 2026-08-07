"use client";

import { useEffect, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function ProductForm({ initial, submitLabel, submitting, onSubmit }) {
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [priceGhs, setPriceGhs] = useState(
    initial ? (Number(initial.price || 0) / 100).toFixed(2) : ""
  );
  const [stock, setStock] = useState(initial?.stock ?? "");
  const [sku, setSku] = useState(initial?.sku || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [images, setImages] = useState((initial?.images || []).join("\n"));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initial) return;
    setName(initial.name || "");
    setSlug(initial.slug || "");
    setCategory(initial.category || "");
    setPriceGhs((Number(initial.price || 0) / 100).toFixed(2));
    setStock(initial.stock ?? "");
    setSku(initial.sku || "");
    setDescription(initial.description || "");
    setImages((initial.images || []).join("\n"));
    setIsActive(initial.isActive ?? true);
  }, [initial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const pesewas = Math.round((parseFloat(priceGhs) || 0) * 100);
    if (!name.trim() || !category.trim() || pesewas <= 0) {
      setError("Name, category, and a price above GH₵ 0.00 are required.");
      return;
    }

    onSubmit({
      name: name.trim(),
      slug: slug.trim() || undefined,
      category: category.trim(),
      price: pesewas,
      stock: stock === "" || stock == null ? 0 : parseInt(stock, 10) || 0,
      sku: sku.trim(),
      description: description.trim(),
      images: images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Name *">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wooden Dining Table"
            required
          />
        </Field>
        <Field label="Slug">
          <input
            className={inputClass}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated from name"
          />
        </Field>
        <Field label="Category *">
          <input
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Furniture"
            required
          />
        </Field>
        <Field label="Price (GH₵) *">
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            value={priceGhs}
            onChange={(e) => setPriceGhs(e.target.value)}
            placeholder="e.g. 250.00"
            required
          />
        </Field>
        <Field label="Stock">
          <input
            type="number"
            min="0"
            className={inputClass}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="SKU">
          <input
            className={inputClass}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="optional"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description"
        />
      </Field>

      <Field label="Image URLs (one per line)">
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          value={images}
          onChange={(e) => setImages(e.target.value)}
          placeholder="https://...jpg"
        />
      </Field>

      <label className="flex items-center gap-2.5 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        Active (visible in the shop)
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
