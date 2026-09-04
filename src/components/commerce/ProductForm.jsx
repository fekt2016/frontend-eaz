"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import UploadButton from "@/components/common/UploadButton";
import { api } from "@/lib/api";
import { productSkuBase, variantSkuSuffix } from "@/lib/sku";
import { useDebounce } from "@/hooks/useDebounce";
import { variantAttributeGroups } from "@/lib/shop";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-700";

// Attribute rows ({key,value}[]) as the plain object the SKU suffix builder
// and the API both expect. Rows missing either half are not yet meaningful.
const attrRowsToObject = (rows = []) =>
  Object.fromEntries(
    rows
      .filter((a) => a.key.trim() && a.value.trim())
      .map((a) => [a.key.trim(), a.value.trim()])
  );

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
 * One item type (owner request, 2026-09-04).
 *
 * There is no longer a "shop product" vs "bench part" choice. The Product model
 * had already called that split the wrong question — "Behaviour, not type. The
 * old split forced 'is it a Product or a Part?' when the real questions are
 * where it can be sold and whether it can go on a repair job" — and the owner's
 * answer is that everything is sold in both channels.
 *
 * So every item created here is listed online, offered in store, AND selectable
 * on a repair job. The fields that used to be bench-only (cost price, barcode,
 * supplier, low-stock threshold, compatible-with, notes) now show for every
 * item; the model always had somewhere to put them.
 */
export default function ProductForm({ initial, submitLabel, submitting, onSubmit, suppliers = [] }) {

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
  // Defaults on: an item nobody can put on a job is the exception, not the rule.
  const [useInRepairs, setUseInRepairs] = useState(initial?.useInRepairs ?? true);

  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [priceGhs, setPriceGhs] = useState(
    initial ? (Number(initial.price || 0) / 100).toFixed(2) : ""
  );
  const [stock, setStock] = useState(initial?.stock ?? "");
  const [sku, setSku] = useState(initial?.sku || "");
  // A SKU the user typed themselves is never overwritten by the auto-fill. A
  // product that arrives with one already saved counts as user-owned too.
  const [skuTouched, setSkuTouched] = useState(Boolean(initial?.sku));
  const [description, setDescription] = useState(initial?.description || "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription || "");
  const [images, setImages] = useState(initial?.images || []);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [variants, setVariants] = useState(() =>
    (Array.isArray(initial?.variants) ? initial.variants : []).map((v) => ({
      sku: v.sku || "",
      skuTouched: Boolean(v.sku),
      attributes: attributesToRows(v.attributes),
      stock: v.stock ?? "",
      images: Array.isArray(v.images) ? v.images : [],
      // Blank = unset (falls back to base price at checkout), not "free".
      priceGhs: v.price != null ? (Number(v.price) / 100).toFixed(2) : "",
      // Per-variant pre-order, independent of the product-level flag — a
      // single 0-stock size can be pre-ordered while its siblings stay in stock.
      preorder: {
        enabled: v.preorder?.enabled ?? false,
        availableFrom: v.preorder?.availableFrom ? new Date(v.preorder.availableFrom).toISOString().slice(0, 10) : "",
        note: v.preorder?.note || "",
        maxQty: v.preorder?.maxQty ?? "",
      },
    }))
  );
  const [galleryImages, setGalleryImages] = useState(initial?.gallery?.images || []);
  const [galleryVideos, setGalleryVideos] = useState(initial?.gallery?.videos || []);
  const [preorderEnabled, setPreorderEnabled] = useState(initial?.preorder?.enabled ?? false);
  const [preorderAvailableFrom, setPreorderAvailableFrom] = useState(
    initial?.preorder?.availableFrom ? new Date(initial.preorder.availableFrom).toISOString().slice(0, 10) : ""
  );
  const [preorderNote, setPreorderNote] = useState(initial?.preorder?.note || "");
  const [preorderMaxQty, setPreorderMaxQty] = useState(initial?.preorder?.maxQty ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initial) return;
    setName(initial.name || "");
    setSlug(initial.slug || "");
    setCategory(initial.category || "");
    setPriceGhs((Number(initial.price || 0) / 100).toFixed(2));
    setStock(initial.stock ?? "");
    setSku(initial.sku || "");
    setSkuTouched(Boolean(initial.sku));
    setDescription(initial.description || "");
    setShortDescription(initial.shortDescription || "");
    setImages(initial.images || []);
    setIsActive(initial.isActive ?? true);
    setVariants(
      (Array.isArray(initial.variants) ? initial.variants : []).map((v) => ({
        sku: v.sku || "",
        skuTouched: Boolean(v.sku),
        attributes: attributesToRows(v.attributes),
        stock: v.stock ?? "",
        images: Array.isArray(v.images) ? v.images : [],
        priceGhs: v.price != null ? (Number(v.price) / 100).toFixed(2) : "",
        preorder: {
          enabled: v.preorder?.enabled ?? false,
          availableFrom: v.preorder?.availableFrom ? new Date(v.preorder.availableFrom).toISOString().slice(0, 10) : "",
          note: v.preorder?.note || "",
          maxQty: v.preorder?.maxQty ?? "",
        },
      }))
    );
    setGalleryImages(initial.gallery?.images || []);
    setGalleryVideos(initial.gallery?.videos || []);
    setPreorderEnabled(initial.preorder?.enabled ?? false);
    setPreorderAvailableFrom(
      initial.preorder?.availableFrom ? new Date(initial.preorder.availableFrom).toISOString().slice(0, 10) : ""
    );
    setPreorderNote(initial.preorder?.note || "");
    setPreorderMaxQty(initial.preorder?.maxQty ?? "");
    setUseInRepairs(initial.useInRepairs ?? true);
  }, [initial]);

  const updateVariant = (vi, key, value) =>
    setVariants((prev) => prev.map((v, i) => (i === vi ? { ...v, [key]: value } : v)));

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      {
        sku: "", skuTouched: false, attributes: [{ key: "color", value: "" }], stock: "", images: [], priceGhs,
        preorder: { enabled: false, availableFrom: "", note: "", maxQty: "" },
      },
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

  /*
   * Attribute-key consistency.
   *
   * The storefront only splits colour and size into separate rows when EVERY
   * variant declares the SAME attribute keys (lib/shop.js variantAttributeGroups).
   * Keys here are free text, so "color" on one variant and "Color" on the next
   * silently drops the shopper back to one row of combined labels — with nothing
   * on this form to say why. The check below is the storefront's own function, so
   * the warning cannot drift from the behaviour it predicts.
   */
  const attributeKeysInUse = [
    ...new Set(
      variants.flatMap((v) => v.attributes.map((a) => a.key.trim()).filter(Boolean))
    ),
  ];
  const pickerGroups = variantAttributeGroups(
    variants.map((v) => ({ attributes: attrRowsToObject(v.attributes) }))
  );
  // Only worth flagging once there is a picker to lose.
  const keysAreInconsistent = variants.length > 1 && !pickerGroups;

  /** Give every variant a row for each key any variant uses, so the shapes match. */
  const alignAttributeKeys = () =>
    setVariants((prev) => {
      const keys = [
        ...new Set(prev.flatMap((v) => v.attributes.map((a) => a.key.trim()).filter(Boolean))),
      ];
      return prev.map((v) => {
        const have = v.attributes.map((a) => a.key.trim());
        const missing = keys.filter((k) => !have.includes(k)).map((key) => ({ key, value: "" }));
        // Existing rows keep their order and values; only the gaps are filled.
        return missing.length ? { ...v, attributes: [...v.attributes, ...missing] } : v;
      });
    });

  // --- Automatic SKU fill -------------------------------------------------
  // The SKU writes itself from the product's own details: the name gives the
  // EZW-<BRAND> base, a variant's attributes give its suffix, and the API picks
  // the number so the result is unique (services/skuGenerator.js). Generation
  // is debounced because it costs a query, and it never runs against a SKU the
  // user typed themselves. Errors leave the field as it is.
  const debouncedName = useDebounce(name, 500);
  const productSkuSeq = useRef(0);

  useEffect(() => {
    if (skuTouched) return;
    const base = debouncedName.trim();
    if (!base) return;
    const seq = ++productSkuSeq.current;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.post("/products/generate-sku", {
          mode: "product",
          prefix: productSkuBase(base),
        });
        // Ignore a slow reply the user has already typed past.
        if (!cancelled && seq === productSkuSeq.current && res?.data?.sku) {
          setSku(res.data.sku);
        }
      } catch { /* keep current sku */ }
    })();
    return () => { cancelled = true; };
  }, [debouncedName, skuTouched]);

  // A variant's SKU hangs off the parent's, so it refills whenever the parent
  // SKU or the variant's own attributes change. The signature keeps the effect
  // from re-firing on unrelated variant edits (stock, price, images).
  const variantSkuSig = variants
    .map((v) => (v.skuTouched ? "" : variantSkuSuffix(attrRowsToObject(v.attributes))))
    .join("|");
  const debouncedVariantSig = useDebounce(variantSkuSig, 500);
  const variantSkuSeq = useRef(0);

  useEffect(() => {
    const parent = sku.trim();
    if (!parent) return;
    const pending = variants
      .map((v, vi) => ({ vi, suffix: v.skuTouched ? "" : variantSkuSuffix(attrRowsToObject(v.attributes)) }))
      .filter((x) => x.suffix);
    if (!pending.length) return;

    const seq = ++variantSkuSeq.current;
    let cancelled = false;
    (async () => {
      // Sequential, not parallel: the API only knows about saved SKUs, so two
      // unsaved siblings can be handed the same string. Tracking what this form
      // has already claimed lets us step past a clash the way the server does.
      const claimed = new Set(variants.map((v) => v.sku.trim()).filter(Boolean));
      for (const { vi, suffix } of pending) {
        if (cancelled || seq !== variantSkuSeq.current) return;
        try {
          const res = await api.post("/products/generate-sku", {
            mode: "variant",
            parentSku: parent,
            suffix,
          });
          let next = res?.data?.sku;
          if (!next) continue;
          if (claimed.has(next)) {
            let i = 2;
            while (claimed.has(`${next}-${i}`)) i += 1;
            next = `${next}-${i}`;
          }
          claimed.add(next);
          if (!cancelled && seq === variantSkuSeq.current) {
            setVariants((prev) =>
              prev.map((v, i) => (i === vi && !v.skuTouched ? { ...v, sku: next } : v))
            );
          }
        } catch { /* keep current sku */ }
      }
    })();
    return () => { cancelled = true; };
    // `variants` is intentionally absent — the signature stands in for the parts
    // of it that matter, so editing stock or price does not regenerate SKUs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedVariantSig, sku]);

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
      // Formerly bench-only. Sent for every item now — createProduct reads them.
      costPrice: Math.round((parseFloat(costGhs) || 0) * 100),
      barcode: barcode.trim(),
      lowStockThreshold: parseInt(lowStockThreshold, 10) || 0,
      supplier: supplier || undefined,
      compatibleWith: compatibleWith.split(",").map((v) => v.trim()).filter(Boolean),
      notes: notes.trim(),
      useInRepairs,
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
          attributes: attrRowsToObject(v.attributes),
          stock: v.stock === "" || v.stock == null ? 0 : parseInt(v.stock, 10) || 0,
          images: v.images.filter(Boolean),
          price:
            v.priceGhs === "" || v.priceGhs == null
              ? null
              : Math.round((parseFloat(v.priceGhs) || 0) * 100),
          preorder: {
            enabled: v.preorder?.enabled ?? false,
            availableFrom: v.preorder?.availableFrom || null,
            note: (v.preorder?.note || "").trim(),
            maxQty:
              v.preorder?.maxQty === "" || v.preorder?.maxQty == null
                ? null
                : parseInt(v.preorder?.maxQty, 10) || null,
          },
        }))
        .filter((v) => v.sku),
      gallery: {
        images: galleryImages.filter(Boolean),
        videos: galleryVideos.filter(Boolean),
      },
      isActive,
      preorder: {
        enabled: preorderEnabled,
        availableFrom: preorderAvailableFrom || null,
        note: preorderNote.trim(),
        maxQty: preorderMaxQty === "" || preorderMaxQty == null ? null : parseInt(preorderMaxQty, 10) || null,
      },
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
        <Field label="SKU" hint="Fills itself from the name — type to override.">
          <input
            className={inputClass}
            value={sku}
            onChange={(e) => { setSku(e.target.value); setSkuTouched(true); }}
            placeholder="e.g. EZW-WOO-001"
          />
        </Field>

        {/* Shown for every item — see the header note. */}
        <>
            <Field label="Cost price (GH₵)" hint="What you pay the supplier. Leave blank if unknown.">
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
              <Field label="Internal notes" hint="Never shown to customers.">
                <input
                  className={inputClass}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything the counter should know"
                />
              </Field>
            </div>

            {/* Channels. Everything is sold online and in store (owner request,
                2026-09-04); whether an item can also go on a repair job is the
                one genuine per-item choice left, so it stays a control rather
                than a hardcoded default. */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                  checked={useInRepairs}
                  onChange={(e) => setUseInRepairs(e.target.checked)}
                />
                <span className="text-sm text-gray-900 dark:text-white">Use in repairs</span>
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                Selectable as a part on a repair job. Sold online and in store either way.
              </p>
            </div>
          </>
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

        {/* Keys already used on this product, offered on every key input so the
            second variant reuses "color" rather than inviting "Color". */}
        <datalist id="variant-attribute-keys">
          {attributeKeysInUse.map((k) => <option key={k} value={k} />)}
        </datalist>

        {/* The storefront can only show separate colour/size rows when every
            variant declares the same keys. Silently losing that is the failure
            this warns about — it is the storefront's own check, not a guess. */}
        {keysAreInconsistent && (
          <div className="rounded-xl border border-warning/30 bg-warning-surface dark:bg-warning-surface-dark px-4 py-3">
            <p className="text-xs font-semibold text-warning dark:text-warning-dark">
              Variants don&apos;t share the same attributes
            </p>
            <p className="mt-1 text-xs text-gray-600 dark:text-slate-400">
              The shop will show one button per variant with every value in the label
              (&ldquo;Black 128GB&rdquo;) instead of separate Colour and Size rows. Give every
              variant the same attribute keys to get the picker.
            </p>
            <button type="button" onClick={alignAttributeKeys} className={`${btnGhostClass} mt-2`}>
              <Plus size={12} /> Give every variant the same attributes
            </button>
          </div>
        )}

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
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((x, i) =>
                        i === vi ? { ...x, sku: e.target.value, skuTouched: true } : x
                      )
                    )
                  }
                  placeholder="auto-generated from attributes"
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
                      list="variant-attribute-keys"
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

            {/* Per-variant pre-order — independent of the product-level flag. */}
            <div className="rounded-lg border border-gray-100 dark:border-slate-800 p-3 space-y-3">
              <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={v.preorder?.enabled ?? false}
                  onChange={(e) => updateVariant(vi, "preorder", { ...v.preorder, enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 dark:border-slate-600"
                />
                Pre-order this variant
              </label>
              <p className="text-xs text-gray-500 dark:text-slate-500 -mt-1">
                Lets this single size be bought when its stock is zero, even if sibling variants are in stock.
              </p>
              {v.preorder?.enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <Field label="Expected availability">
                    <input
                      type="date"
                      className={inputClass}
                      value={v.preorder?.availableFrom || ""}
                      onChange={(e) => updateVariant(vi, "preorder", { ...v.preorder, availableFrom: e.target.value })}
                    />
                  </Field>
                  <Field label="Max per order" hint="Leave empty for no limit.">
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={v.preorder?.maxQty ?? ""}
                      onChange={(e) => updateVariant(vi, "preorder", { ...v.preorder, maxQty: e.target.value })}
                      placeholder="e.g. 5"
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Note" hint="Shown to customers, e.g. ships from abroad.">
                      <input
                        className={inputClass}
                        value={v.preorder?.note || ""}
                        onChange={(e) => updateVariant(vi, "preorder", { ...v.preorder, note: e.target.value })}
                        placeholder="e.g. Ships from abroad, ~3 weeks"
                        maxLength={200}
                      />
                    </Field>
                  </div>
                </div>
              )}
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

      {/* Pre-order — only when stock is zero or empty */}
      {Number(stock) <= 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
          <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={preorderEnabled}
              onChange={(e) => setPreorderEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-slate-600"
            />
            Enable pre-order
          </label>
          <p className="text-xs text-gray-500 dark:text-slate-500 -mt-2">
            Customers can buy this product even when stock is zero. They pay in full upfront.
          </p>
          {preorderEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-slate-800">
              <Field label="Expected availability">
                <input
                  type="date"
                  className={inputClass}
                  value={preorderAvailableFrom}
                  onChange={(e) => setPreorderAvailableFrom(e.target.value)}
                />
              </Field>
              <Field label="Max per order" hint="Leave empty for no limit.">
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={preorderMaxQty}
                  onChange={(e) => setPreorderMaxQty(e.target.value)}
                  placeholder="e.g. 5"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Note" hint="Shown to customers, e.g. ships from abroad.">
                  <input
                    className={inputClass}
                    value={preorderNote}
                    onChange={(e) => setPreorderNote(e.target.value)}
                    placeholder="e.g. Ships from abroad, ~3 weeks"
                    maxLength={200}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>
      )}

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