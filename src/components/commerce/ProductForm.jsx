"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import UploadButton from "@/components/common/UploadButton";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700";

const btnGhostClass =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-slate-600 px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:border-gray-900 dark:hover:border-slate-400 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-50";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      {children}
    </label>
  );
}

// A list of URLs that can be grown via Cloudinary upload and/or a manual URL.
function StringListEditor({ values, onChange, accept, uploadLabel, placeholder }) {
  const [draft, setDraft] = useState("");

  const addUrl = () => {
    const url = draft.trim();
    if (!url) return;
    onChange([...values, url]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <UploadButton accept={accept} onUploaded={(url) => onChange([...values, url])} label={uploadLabel} />
        <input
          className={`${inputClass} flex-1 min-w-40`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" onClick={addUrl} className={btnGhostClass}>
          <Plus size={12} /> Add URL
        </button>
      </div>
      {values.length > 0 && (
        <ul className="space-y-1.5">
          {values.map((url, i) => (
            <li key={url + i} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
              <span className="flex-1 truncate text-xs text-gray-600 dark:text-slate-300" title={url}>{url}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                aria-label="Remove URL"
                className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// { color: "Black" } → [{ key: "color", value: "Black" }] for the form editors.
const attributesToRows = (attributes) =>
  Object.entries(attributes || {}).map(([key, value]) => ({ key, value }));

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
  const [images, setImages] = useState(initial?.images || []);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [variants, setVariants] = useState(() =>
    (Array.isArray(initial?.variants) ? initial.variants : []).map((v) => ({
      sku: v.sku || "",
      attributes: attributesToRows(v.attributes),
      stock: v.stock ?? "",
      images: Array.isArray(v.images) ? v.images : [],
      // Blank = unset (falls back to base price at checkout), not "free".
      priceGhs: v.price != null ? (Number(v.price) / 100).toFixed(2) : "",
    }))
  );
  const [galleryImages, setGalleryImages] = useState(initial?.gallery?.images || []);
  const [galleryVideos, setGalleryVideos] = useState(initial?.gallery?.videos || []);
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
    setImages(initial.images || []);
    setIsActive(initial.isActive ?? true);
    setVariants(
      (Array.isArray(initial.variants) ? initial.variants : []).map((v) => ({
        sku: v.sku || "",
        attributes: attributesToRows(v.attributes),
        stock: v.stock ?? "",
        images: Array.isArray(v.images) ? v.images : [],
        priceGhs: v.price != null ? (Number(v.price) / 100).toFixed(2) : "",
      }))
    );
    setGalleryImages(initial.gallery?.images || []);
    setGalleryVideos(initial.gallery?.videos || []);
  }, [initial]);

  const updateVariant = (vi, key, value) =>
    setVariants((prev) => prev.map((v, i) => (i === vi ? { ...v, [key]: value } : v)));

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      { sku: "", attributes: [{ key: "color", value: "" }], stock: "", images: [], priceGhs },
    ]);

  const removeVariant = (vi) => setVariants((prev) => prev.filter((_, i) => i !== vi));

  const addAttribute = (vi) =>
    setVariants((prev) =>
      prev.map((v, i) => (i === vi ? { ...v, attributes: [...v.attributes, { key: "", value: "" }] } : v))
    );

  const updateAttribute = (vi, ai, key, value) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vi
          ? { ...v, attributes: v.attributes.map((a, j) => (j === ai ? { ...a, [key]: value } : a)) }
          : v
      )
    );

  const removeAttribute = (vi, ai) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === vi ? { ...v, attributes: v.attributes.filter((_, j) => j !== ai) } : v
      )
    );

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
      images: images.filter(Boolean),
      // Structured variants — { sku, attributes (object), stock, images, price }.
      // Variants without a SKU are dropped; attributes without both a key and
      // value are dropped. Sending [] clears variants (non-variant product).
      // A blank price is sent as `null` — "unset", falls back to base price —
      // never coerced to 0, which would mean "free".
      variants: variants
        .map((v) => ({
          sku: v.sku.trim(),
          attributes: Object.fromEntries(
            v.attributes
              .filter((a) => a.key.trim() && a.value.trim())
              .map((a) => [a.key.trim(), a.value.trim()])
          ),
          stock: v.stock === "" || v.stock == null ? 0 : parseInt(v.stock, 10) || 0,
          images: v.images.filter(Boolean),
          price:
            v.priceGhs === "" || v.priceGhs == null
              ? null
              : Math.round((parseFloat(v.priceGhs) || 0) * 100),
        }))
        .filter((v) => v.sku),
      gallery: {
        images: galleryImages.filter(Boolean),
        videos: galleryVideos.filter(Boolean),
      },
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

      <Field label="Images">
        <StringListEditor
          values={images}
          onChange={setImages}
          accept="image/*"
          uploadLabel="Upload image"
          placeholder="https://res.cloudinary.com/..."
        />
      </Field>

      {/* Variants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            Variants
          </span>
          <span className="text-xs text-gray-400 dark:text-slate-500">Optional — each has its own SKU, attributes, and stock</span>
        </div>

        {variants.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 dark:border-slate-600 px-4 py-3 text-xs text-gray-400 dark:text-slate-500">
            No variants — the product is sold as a single SKU using the stock above.
          </p>
        )}

        {variants.map((v, vi) => (
          <div key={vi} className="space-y-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Variant {vi + 1}
              </p>
              <button
                type="button"
                onClick={() => removeVariant(vi)}
                aria-label="Remove variant"
                className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="SKU">
                <input
                  className={inputClass}
                  value={v.sku}
                  onChange={(e) => updateVariant(vi, "sku", e.target.value)}
                  placeholder="e.g. EZW-SPG-001-BLK"
                />
              </Field>
              <Field label="Stock">
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={v.stock}
                  onChange={(e) => updateVariant(vi, "stock", e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Price (GH₵)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  value={v.priceGhs}
                  onChange={(e) => updateVariant(vi, "priceGhs", e.target.value)}
                  placeholder="Same as base price"
                />
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Attributes
              </p>
              <div className="space-y-2">
                {v.attributes.map((a, ai) => (
                  <div key={ai} className="flex items-center gap-2">
                    <input
                      className={`${inputClass} flex-1`}
                      value={a.key}
                      onChange={(e) => updateAttribute(vi, ai, "key", e.target.value)}
                      placeholder="Key (e.g. color)"
                    />
                    <input
                      className={`${inputClass} flex-1`}
                      value={a.value}
                      onChange={(e) => updateAttribute(vi, ai, "value", e.target.value)}
                      placeholder="Value (e.g. Black)"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(vi, ai)}
                      aria-label="Remove attribute"
                      className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addAttribute(vi)} className={`${btnGhostClass} mt-2`}>
                <Plus size={12} /> Add attribute
              </button>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                Images (optional)
              </p>
              <StringListEditor
                values={v.images}
                onChange={(urls) => updateVariant(vi, "images", urls)}
                accept="image/*"
                uploadLabel="Upload image"
                placeholder="https://res.cloudinary.com/..."
              />
            </div>
          </div>
        ))}

        <button type="button" onClick={addVariant} className={btnGhostClass}>
          <Plus size={12} /> Add variant
        </button>
      </div>

      {/* Gallery */}
      <div className="space-y-4">
        <span className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
          Gallery
        </span>

        <Field label="Gallery Images">
          <StringListEditor
            values={galleryImages}
            onChange={setGalleryImages}
            accept="image/*"
            uploadLabel="Upload image"
            placeholder="https://res.cloudinary.com/..."
          />
        </Field>

        <Field label="Gallery Videos">
          <StringListEditor
            values={galleryVideos}
            onChange={setGalleryVideos}
            accept="video/*"
            uploadLabel="Upload video"
            placeholder="https://res.cloudinary.com/...mp4"
          />
        </Field>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 dark:border-slate-600"
        />
        Active (visible in the shop)
      </label>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gray-900 dark:bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}