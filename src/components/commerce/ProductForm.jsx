"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import UploadButton from "@/components/common/UploadButton";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700";

// Mirrors the `shortDescription` maxlength on the backend Product model (T39).
const SHORT_DESCRIPTION_MAX = 200;

const btnGhostClass =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-slate-600 px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:border-gray-900 dark:hover:border-slate-400 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-50";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-gray-500 dark:text-slate-500">
          {hint}
        </span>
      )}
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

/*
 * `allowPart` (owner request, 2026-08-30): the Marketplace "Add" modal now uses
 * THIS form rather than its own part-shaped one, so the form has to cover bench
 * parts as well as shop products.
 *
 * The two are one collection already, but they are NOT the same thing to
 * create. The POS path sets deliberate bench defaults — sellOnline:false,
 * isActive:false, useInRepairs:true — so a new part is not silently listed in
 * the public shop. POST /products sets none of those. So the form is unified
 * while the ENDPOINT still differs, and `itemType` is what the caller routes on.
 * Collapsing both onto /products would quietly put every new bench part on the
 * storefront.
 *
 * Existing callers (new + edit product pages) pass no `allowPart` and are
 * unchanged: the toggle and the bench fields simply do not render.
 */
export default function ProductForm({ initial, submitLabel, submitting, onSubmit, allowPart = false, suppliers = [] }) {
  const [itemType, setItemType] = useState(initial?.itemType || "product");
  const isPart = allowPart && itemType === "part";

  // Bench-part fields. Absent from the shop product shape entirely, so they are
  // only collected — and only sent — when the part type is selected.
  const [barcode, setBarcode] = useState(initial?.barcode || "");
  const [costGhs, setCostGhs] = useState(
    initial?.costPrice ? String(initial.costPrice / 100) : ""
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(initial?.lowStockThreshold ?? 3);
  const [supplier, setSupplier] = useState(initial?.supplier?._id || initial?.supplier || "");
  const [compatibleWith, setCompatibleWith] = useState(
    Array.isArray(initial?.compatibleWith) ? initial.compatibleWith.join(", ") : ""
  );
  const [notes, setNotes] = useState(initial?.notes || "");

  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [priceGhs, setPriceGhs] = useState(
    initial ? (Number(initial.price || 0) / 100).toFixed(2) : ""
  );
  const [stock, setStock] = useState(initial?.stock ?? "");
  const [sku, setSku] = useState(initial?.sku || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription || "");
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
    setShortDescription(initial.shortDescription || "");
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

    // A bench part is created through POST /pos/inventory, which speaks a
    // different vocabulary to the Product model: quantity→stock,
    // sellingPrice→price, and category doubles as partCategory. Send its shape,
    // not the product one, or every bench field is silently dropped by the
    // controller's whitelist.
    if (isPart) {
      const costPesewas = Math.round((parseFloat(costGhs) || 0) * 100);
      if (costPesewas <= 0) {
        setError("A bench part needs a cost price above GH₵ 0.00.");
        return;
      }
      onSubmit({
        itemType: "part",
        name: name.trim(),
        category: category.trim(),
        quantity: stock === "" || stock == null ? 0 : parseInt(stock, 10) || 0,
        sellingPrice: pesewas,
        costPrice: costPesewas,
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 0,
        sku: sku.trim(),
        barcode: barcode.trim(),
        supplier: supplier || undefined,
        compatibleWith: compatibleWith
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        description: description.trim(),
        images: images.filter(Boolean),
        notes: notes.trim(),
      });
      return;
    }

    onSubmit({
      itemType: "product",
      name: name.trim(),
      slug: slug.trim() || undefined,
      category: category.trim(),
      price: pesewas,
      stock: stock === "" || stock == null ? 0 : parseInt(stock, 10) || 0,
      sku: sku.trim(),
      description: description.trim(),
      shortDescription: shortDescription.trim(),
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
        {allowPart && (
          // Deliberately NOT wrapped in <Field>: that renders a <label>, and a
          // label around two buttons is both invalid and actively harmful —
          // every button inherits the label's text as part of its accessible
          // name, so a screen reader (and any name-based query) cannot tell
          // "Shop product" from "Bench part". A fieldset/legend is the correct
          // grouping for a choice between controls.
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              What is this?
            </legend>
            <div className="flex gap-2">
              {[
                { value: "product", label: "Shop product" },
                { value: "part", label: "Bench part" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setItemType(opt.value)}
                  aria-pressed={itemType === opt.value}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    itemType === opt.value
                      ? "border-brand-300 bg-brand-50 text-brand-ink dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-400"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
              {isPart
                ? "Bench stock: used in repairs, not listed in the shop until you opt it in."
                : "Shop product: listed online once active."}
            </p>
          </fieldset>
        )}

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

        {isPart && (
          <>
            <Field label="Cost price (GH₵) *" hint="What you pay the supplier.">
              <input
                className={inputClass}
                type="number" step="0.01" min="0"
                value={costGhs}
                onChange={(e) => setCostGhs(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Barcode">
              <input
                className={inputClass}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or type"
              />
            </Field>
            <Field label="Low-stock threshold" hint="Warn when stock drops to this.">
              <input
                className={inputClass}
                type="number" min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
            </Field>
            <Field label="Supplier">
              <select
                className={inputClass}
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              >
                <option value="">— None —</option>
                {suppliers.map((sup) => (
                  <option key={sup._id} value={sup._id}>{sup.name}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Compatible with" hint="Comma separated, e.g. iPhone 13, iPhone 13 Pro.">
                <input
                  className={inputClass}
                  value={compatibleWith}
                  onChange={(e) => setCompatibleWith(e.target.value)}
                  placeholder="iPhone 13, iPhone 13 Pro"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Bench notes">
                <input
                  className={inputClass}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything the counter should know"
                />
              </Field>
            </div>
          </>
        )}
      </div>

      {/* T39: shown in the buy column on the product page; the full description
          sits behind the Description tab. Left empty, the storefront summarises
          the full description instead. */}
      <Field label="Short description">
        <textarea
          className={`${inputClass} min-h-16 resize-y`}
          value={shortDescription}
          maxLength={SHORT_DESCRIPTION_MAX}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="One or two lines shown next to the price"
        />
        <p className="mt-1 text-xs text-gray-600 dark:text-slate-500">
          {shortDescription.length}/{SHORT_DESCRIPTION_MAX} — optional; falls back to a
          trimmed version of the description below.
        </p>
      </Field>

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
          <span className="text-xs text-gray-600 dark:text-slate-500">Optional — each has its own SKU, attributes, and stock</span>
        </div>

        {variants.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-300 dark:border-slate-600 px-4 py-3 text-xs text-gray-600 dark:text-slate-500">
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