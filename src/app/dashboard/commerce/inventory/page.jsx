"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatGhs, stockBadge } from "@/lib/shop";
import {
  FaPlus, FaSearch, FaEdit, FaTrash, FaExclamationTriangle, FaBarcode, FaBoxOpen,
  FaWrench,
} from "react-icons/fa";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

const CATEGORIES = ["Screen", "Battery", "Charging Port", "Speaker", "Camera", "Button", "Housing", "Board", "Accessory", "Cable", "IC / Chip", "Other"];

const inputCls  = "w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition";
const selectCls = `${inputCls} cursor-pointer`;
const labelCls  = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5";

function PartModal({ part, onClose, onSave, suppliers = [] }) {
  const editing    = Boolean(part?._id);
  const barcodeRef = useRef(null);

  const [name,       setName]      = useState(part?.name       || "");
  const [sku,        setSku]       = useState(part?.sku        || "");
  const [barcode,    setBarcode]   = useState(part?.barcode    || "");
  const [isRetail,   setIsRetail]  = useState(part?.isRetail   ?? false);
  const [allowNeg,   setAllowNeg]  = useState(part?.allowNegativeStock ?? false);
  const [category,   setCategory]  = useState(part?.category   || "Other");
  const [qty,        setQty]       = useState(part?.quantity   ?? 0);
  const [threshold,  setThreshold] = useState(part?.lowStockThreshold ?? 3);
  const [costPrice,  setCostPrice] = useState(part?.costPrice  ?? "");
  const [sellPrice,  setSellPrice] = useState(part?.sellingPrice ?? "");
  const [supplierId, setSupplierId]= useState(part?.supplier?._id || part?.supplier || "");
  const [compat,     setCompat]    = useState(part?.compatibleWith?.join(", ") || "");
  const [notes,      setNotes]     = useState(part?.notes      || "");
  const [saving,     setSaving]    = useState(false);
  const [error,      setError]     = useState("");

  // Auto-focus barcode field when adding a new product so scanner can type into it
  useEffect(() => {
    if (!editing) {
      setTimeout(() => barcodeRef.current?.focus(), 120);
    }
  }, [editing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || costPrice === "" || sellPrice === "") {
      setError("Name, cost price, and selling price are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        sku: sku || undefined,
        barcode: barcode.trim() || undefined,
        isRetail,
        allowNegativeStock: allowNeg,
        category,
        quantity: Number(qty),
        lowStockThreshold: Number(threshold),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellPrice),
        supplier: supplierId || undefined,
        compatibleWith: compat ? compat.split(",").map(s => s.trim()).filter(Boolean) : [],
        notes: notes || undefined,
      };
      if (editing) {
        await api.patch(`/pos/inventory/${part._id}`, payload);
      } else {
        await api.post("/pos/inventory", payload);
      }
      onSave();
    } catch (err) {
      setError(err.message || "Failed to save part.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{editing ? "Edit Part" : "Add New Part"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Barcode — first field, auto-focused for scanner */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5">
                <FaBarcode size={11} className="text-amber-600 dark:text-amber-400" />
                Barcode
                {!editing && <span className="text-amber-500 font-normal normal-case tracking-normal ml-1">— scan now or type</span>}
              </span>
            </label>
            <input
              ref={barcodeRef}
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Scan part barcode…"
              className={`${inputCls} ${!barcode && !editing ? "border-amber-500/50 focus:border-amber-500" : ""}`}
            />
          </div>

          <div>
            <label className={labelCls}>Part name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tecno Spark 20 Case, USB-C Cable 1m" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>SKU <span className="text-gray-600">(optional)</span></label>
              <input value={sku} onChange={e => setSku(e.target.value)} placeholder="Internal code" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={isRetail} onChange={e => setIsRetail(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" />
              Sell in online shop
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={allowNeg} onChange={e => setAllowNeg(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" />
              Allow negative stock
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Cost price (GH₵) *</label>
              <input type="number" min="0" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Selling price (GH₵) *</label>
              <input type="number" min="0" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Stock quantity</label>
              <input type="number" min="0" value={qty} onChange={e => setQty(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Low stock alert at</label>
              <input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} className={inputCls} />
            </div>
          </div>

          {suppliers.length > 0 && (
            <div>
              <label className={labelCls}>Supplier</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={selectCls}>
                <option value="">— No supplier —</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>Compatible with <span className="text-gray-600">(comma separated)</span></label>
            <input value={compat} onChange={e => setCompat(e.target.value)} placeholder="e.g. iPhone 14, Samsung A54" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>

          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update Part" : "Add Part"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PartsTab() {
  const [parts,       setParts]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [q,           setQ]           = useState("");
  const [category,    setCategory]    = useState("");
  const [lowStock,    setLowStock]    = useState(false);
  const [modal,       setModal]       = useState(null);
  const [page,        setPage]        = useState(1);
  const [scanFlash,   setScanFlash]   = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const limit = 50;

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (q.trim())  params.set("q", q.trim());
      if (category)  params.set("category", category);
      if (lowStock)  params.set("lowStock", "true");
      const [res, lowRes] = await Promise.all([
        api.get(`/pos/inventory?${params}`),
        api.get(`/pos/inventory?lowStock=true&limit=100`),
      ]);
      setParts(res.data || []);
      setTotal(res.total);
      setLowStockItems(lowRes.data || []);
    } catch (err) { setLowStockItems([]); console.warn("Inventory load error:", err.message); }
    finally { setLoading(false); }
  }, [q, category, lowStock, page]);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  // Fetch suppliers once for the modal dropdown
  useEffect(() => {
    api.get("/pos/suppliers?active=true")
      .then(r => setSuppliers(r.data || []))
      .catch(() => {});
  }, []);

  // Barcode scanner — active only when modal is closed
  const handleScan = useCallback(async (code) => {
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 600);
    try {
      // Try to find an existing part by barcode/SKU
      const res = await api.get(`/pos/scan/${encodeURIComponent(code)}`);
      if (res.type === "product") {
        // Open edit modal for the matched part
        setModal(res.data);
      } else {
        // Unknown barcode — open Add modal with barcode pre-filled
        setModal({ _barcode: code });
      }
    } catch {
      // Not found — open Add modal with barcode pre-filled
      setModal({ _barcode: code });
    }
  }, []);

  useBarcodeScanner(handleScan, { active: modal === null, minLength: 3 });

  const openNew = useCallback((prefill = null) => {
    if (prefill?._barcode) {
      setModal({ barcode: prefill._barcode });
    } else {
      setModal("new");
    }
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this part?")) return;
    try {
      await api.delete(`/pos/inventory/${id}`);
      fetchParts();
    } catch (err) { alert(err.message); }
  };

  const modalPart = modal === "new" ? null : (modal?._barcode ? { barcode: modal._barcode } : modal);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Repair parts</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} parts · used in the repair shop &amp; sold online</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Scan-ready indicator */}
          {modal === null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
              scanFlash
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500"
            }`}>
              <FaBarcode size={11} className={scanFlash ? "text-amber-600 dark:text-amber-400" : ""} />
              {scanFlash ? "Scanned!" : "Scan ready"}
            </div>
          )}
          <button
            onClick={() => openNew()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
          >
            <FaPlus size={11} /> Add Part
          </button>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaExclamationTriangle size={13} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} low on stock
            </p>
            <button
              onClick={() => { setLowStock(true); setPage(1); }}
              className="ml-auto text-xs text-red-600 dark:text-red-400 hover:text-red-300 underline underline-offset-2 transition"
            >
              View all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.slice(0, 6).map(p => (
              <div
                key={p._id}
                onClick={() => setModal(p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-red-500/20 cursor-pointer hover:border-red-500/40 transition"
              >
                <FaBoxOpen size={10} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-xs text-gray-900 dark:text-white truncate max-w-[120px]">{p.name}</span>
                <span className={`text-xs font-bold ml-1 ${p.quantity === 0 ? "text-red-500" : "text-orange-600 dark:text-orange-400"}`}>
                  {p.quantity === 0 ? "Out" : `${p.quantity} left`}
                </span>
              </div>
            ))}
            {lowStockItems.length > 6 && (
              <div className="flex items-center px-3 py-1.5 text-xs text-gray-500">
                +{lowStockItems.length - 6} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search parts, barcodes, SKUs…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer transition"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={() => { setLowStock(v => !v); setPage(1); }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition ${
            lowStock ? "bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FaExclamationTriangle size={11} /> Low stock
        </button>
      </div>

      {/* Scan hint */}
      {modal === null && parts.length === 0 && !loading && !q && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <FaBarcode size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Scanner ready</p>
            <p className="text-xs text-gray-500 mt-0.5">Point your barcode scanner at any part to add it to inventory &mdash; or click &ldquo;Add Part&rdquo; to enter manually.</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
        ) : parts.length === 0 ? (
          <div className="py-14 text-center">
            <FaWrench size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No parts found</p>
            <p className="text-gray-600 text-sm mt-1">Scan a barcode or click &ldquo;Add Part&rdquo; to get started.</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 font-medium uppercase tracking-wide">
              <span>Part</span>
              <span>Barcode</span>
              <span>Category</span>
              <span>Stock</span>
              <span>Cost</span>
              <span>Price</span>
              <span />
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {parts.map(p => {
                const lowStockFlag = p.quantity <= p.lowStockThreshold;
                return (
                  <div key={p._id} className="flex sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                        {lowStockFlag && <FaExclamationTriangle size={10} className="text-red-600 dark:text-red-400 flex-shrink-0" />}
                        {p.isRetail && <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex-shrink-0">Retail</span>}
                      </div>
                      {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                      {p.compatibleWith?.length > 0 && (
                        <p className="text-xs text-gray-600 truncate">{p.compatibleWith.slice(0, 3).join(", ")}</p>
                      )}
                    </div>
                    <span className="text-xs font-mono text-gray-500 hidden sm:block">{p.barcode || "—"}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{p.category}</span>
                    <span className={`text-sm font-semibold hidden sm:block ${lowStockFlag ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>{p.quantity}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">GH₵{p.costPrice.toLocaleString()}</span>
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium hidden sm:block">GH₵{p.sellingPrice.toLocaleString()}</span>
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      <button onClick={() => setModal(p)} className="text-gray-500 hover:text-amber-400 transition"><FaEdit size={13} /></button>
                      <button onClick={() => handleDelete(p._id)} className="text-gray-500 hover:text-red-400 transition"><FaTrash size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              ← Prev
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {modal && (
        <PartModal
          part={modalPart}
          suppliers={suppliers}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchParts(); }}
        />
      )}
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/products/all")
      .then((res) => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async (product) => {
    setUpdating(product._id);
    try {
      if (product.isActive) {
        await api.delete(`/products/${product._id}`);
      } else {
        await api.patch(`/products/${product._id}`, { isActive: true });
      }
      load();
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Shop products</h2>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} products · sold in the online shop</p>
        </div>
        <Link
          href="/dashboard/commerce/products/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
        >
          <FaPlus size={11} /> Add Product
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="py-14 text-center">
            <FaBoxOpen size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No products yet</p>
            <p className="text-gray-600 text-sm mt-1">Click &ldquo;Add Product&rdquo; to create your first shop product.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {products.map((product) => {
              const badge = stockBadge(product.stock);
              return (
                <div key={product._id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition ${!product.isActive ? "opacity-70" : ""}`}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-10 w-10 rounded-xl object-cover bg-gray-100" />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 text-xs">No img</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                      {!product.isActive && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 flex-shrink-0">Archived</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {product.category}
                      {product.sku ? ` · SKU ${product.sku}` : ""} · /{product.slug}
                    </p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatGhs(product.price)}</p>
                    <p className={`text-xs font-medium mt-0.5 ${badge.classes}`}>{badge.label}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/commerce/products/${product._id}/edit`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleToggle(product)}
                      disabled={updating === product._id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-60 ${
                        product.isActive
                          ? "border border-red-200 text-red-500 hover:bg-red-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {updating === product._id ? "..." : product.isActive ? "Archive" : "Activate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [tab, setTab] = useState("parts");

  const tabs = [
    { id: "parts",    label: "Repair Parts",  icon: FaWrench },
    { id: "products", label: "Shop Products", icon: FaBoxOpen },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage repair parts and shop products from one place. Parts flagged &ldquo;Sell in online shop&rdquo; appear in the marketplace.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === id
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-600"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {tab === "parts" ? <PartsTab /> : <ProductsTab />}
    </div>
  );
}
