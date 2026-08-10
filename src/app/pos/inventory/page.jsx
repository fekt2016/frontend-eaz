"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import {
  FaPlus, FaSearch, FaEdit, FaTrash, FaExclamationTriangle, FaBarcode, FaBoxOpen,
} from "react-icons/fa";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

const CATEGORIES = ["Screen", "Battery", "Charging Port", "Speaker", "Camera", "Button", "Housing", "Board", "Accessory", "Cable", "IC / Chip", "Other"];

const inputCls  = "w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition";
const selectCls = `${inputCls} cursor-pointer`;
const labelCls  = "block text-xs font-medium text-gray-400 mb-1.5";

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
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">{editing ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Barcode — first field, auto-focused for scanner */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5">
                <FaBarcode size={11} className="text-amber-400" />
                Barcode
                {!editing && <span className="text-amber-500 font-normal normal-case tracking-normal ml-1">— scan now or type</span>}
              </span>
            </label>
            <input
              ref={barcodeRef}
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Scan product barcode…"
              className={`${inputCls} ${!barcode && !editing ? "border-amber-500/50 focus:border-amber-500" : ""}`}
            />
          </div>

          <div>
            <label className={labelCls}>Product name *</label>
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
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={isRetail} onChange={e => setIsRetail(e.target.checked)} className="rounded border-gray-600" />
              Sellable over counter
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={allowNeg} onChange={e => setAllowNeg(e.target.checked)} className="rounded border-gray-600" />
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

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {saving ? "Saving…" : editing ? "Update Product" : "Add Product"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
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
      // Try to find an existing product by barcode/SKU
      const res = await api.get(`/pos/scan/${encodeURIComponent(code)}`);
      if (res.type === "product") {
        // Open edit modal for the matched product
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
    if (!confirm("Delete this product?")) return;
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
          <h1 className="text-xl font-bold text-white">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} products</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Scan-ready indicator */}
          {modal === null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
              scanFlash
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-gray-900 border-gray-800 text-gray-500"
            }`}>
              <FaBarcode size={11} className={scanFlash ? "text-amber-400" : ""} />
              {scanFlash ? "Scanned!" : "Scan ready"}
            </div>
          )}
          <button
            onClick={() => openNew()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
          >
            <FaPlus size={11} /> Add Product
          </button>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaExclamationTriangle size={13} className="text-red-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-400">
              {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} low on stock
            </p>
            <button
              onClick={() => { setLowStock(true); setPage(1); }}
              className="ml-auto text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition"
            >
              View all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.slice(0, 6).map(p => (
              <div
                key={p._id}
                onClick={() => setModal(p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 border border-red-500/20 cursor-pointer hover:border-red-500/40 transition"
              >
                <FaBoxOpen size={10} className="text-red-400 flex-shrink-0" />
                <span className="text-xs text-white truncate max-w-[120px]">{p.name}</span>
                <span className={`text-xs font-bold ml-1 ${p.quantity === 0 ? "text-red-500" : "text-orange-400"}`}>
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
            placeholder="Search products, barcodes, SKUs…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer transition"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={() => { setLowStock(v => !v); setPage(1); }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition ${
            lowStock ? "bg-red-500/15 border-red-500/30 text-red-400" : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          <FaExclamationTriangle size={11} /> Low stock
        </button>
      </div>

      {/* Scan hint */}
      {modal === null && parts.length === 0 && !loading && !q && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <FaBarcode size={18} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Scanner ready</p>
            <p className="text-xs text-gray-500 mt-0.5">Point your barcode scanner at any product to add it to inventory &mdash; or click &ldquo;Add Product&rdquo; to enter manually.</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-gray-800 animate-pulse" />)}</div>
        ) : parts.length === 0 ? (
          <div className="py-14 text-center">
            <FaBarcode size={24} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No products found</p>
            <p className="text-gray-600 text-sm mt-1">Scan a barcode or click &ldquo;Add Product&rdquo; to get started.</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-800 text-xs text-gray-500 font-medium uppercase tracking-wide">
              <span>Product</span>
              <span>Barcode</span>
              <span>Category</span>
              <span>Stock</span>
              <span>Cost</span>
              <span>Price</span>
              <span />
            </div>
            <div className="divide-y divide-gray-800">
              {parts.map(p => {
                const lowStockFlag = p.quantity <= p.lowStockThreshold;
                return (
                  <div key={p._id} className="flex sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-800/30 transition">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        {lowStockFlag && <FaExclamationTriangle size={10} className="text-red-400 flex-shrink-0" />}
                        {p.isRetail && <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 flex-shrink-0">Retail</span>}
                      </div>
                      {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                      {p.compatibleWith?.length > 0 && (
                        <p className="text-xs text-gray-600 truncate">{p.compatibleWith.slice(0, 3).join(", ")}</p>
                      )}
                    </div>
                    <span className="text-xs font-mono text-gray-500 hidden sm:block">{p.barcode || "—"}</span>
                    <span className="text-xs text-gray-400 hidden sm:block">{p.category}</span>
                    <span className={`text-sm font-semibold hidden sm:block ${lowStockFlag ? "text-red-400" : "text-white"}`}>{p.quantity}</span>
                    <span className="text-sm text-gray-400 hidden sm:block">GH₵{p.costPrice.toLocaleString()}</span>
                    <span className="text-sm text-amber-400 font-medium hidden sm:block">GH₵{p.sellingPrice.toLocaleString()}</span>
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
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 disabled:opacity-40 hover:bg-gray-800 transition"
            >
              ← Prev
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 disabled:opacity-40 hover:bg-gray-800 transition"
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
