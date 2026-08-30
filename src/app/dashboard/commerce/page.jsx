"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { formatGhs } from "@/lib/shop";
import ProductImage from "@/components/shop/ProductImage";
import {
  Plus, Search, Pen, Trash2, TriangleAlert, Barcode, PackageOpen,
  Wrench, Truck,
} from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Badge } from "@/components/ui";
import ItemModal from "./ItemModal";

const CATEGORIES = ["Screen", "Battery", "Charging Port", "Speaker", "Camera", "Button", "Housing", "Board", "Accessory", "Cable", "IC / Chip", "Other"];

// T110 — mirrors INVENTORY_KINDS in the backend's controllers/pos/common.js.
// "" means no filter; the server treats an unknown value as no filter too.
const KINDS = [
  { value: "",            label: "All" },
  { value: "parts",       label: "Parts" },
  { value: "accessories", label: "Accessories" },
  { value: "other",       label: "Other" },
];


function ProductsList() {
  const [parts,       setParts]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [q,           setQ]           = useState("");
  const [category,    setCategory]    = useState("");
  // T110 — parts / accessories / other. "" is all stock.
  const [kind,        setKind]        = useState("");
  const [lowStock,    setLowStock]    = useState(false);
  const [modal,       setModal]       = useState(null);
  const [page,        setPage]        = useState(1);
  const [scanFlash,   setScanFlash]   = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [archiving,   setArchiving]   = useState(null);
  // Owner decision (2026-08-30): 10 per page everywhere. The list was already
  // server-paged with search and filters — only the page size changed. The
  // separate lowStock fetch below stays at 100: it feeds the "low stock" banner
  // count, which is a bounded summary, not a page.
  const limit = 10;

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (q.trim())  params.set("q", q.trim());
      if (category)  params.set("category", category);
      if (kind)      params.set("kind", kind);
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
  }, [q, category, kind, lowStock, page]);

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

  // Carried over from the removed Shop Products tab: archive hides an item from
  // the storefront (soft delete), activate brings it back. `asInventoryItem`
  // spreads the whole document, so `isActive` is already on these rows.
  const handleArchiveToggle = async (item) => {
    setArchiving(item._id);
    try {
      if (item.isActive) await api.delete(`/products/${item._id}`);
      else               await api.patch(`/products/${item._id}`, { isActive: true });
      fetchParts();
    } catch (err) {
      alert(errorMessage(err, "Could not update this product. Please try again."));
    } finally {
      setArchiving(null);
    }
  };

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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">All stock</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} item{total === 1 ? "" : "s"} · bench stock and shop stock</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Scan-ready indicator */}
          {modal === null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 ${
              scanFlash
                ? "bg-brand-500/20 border-brand-500/50 text-brand-ink dark:text-brand-400"
                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500"
            }`}>
              <Barcode size={11} className={scanFlash ? "text-brand-ink dark:text-brand-400" : ""} />
              {scanFlash ? "Scanned!" : "Scan ready"}
            </div>
          )}
          <button
            onClick={() => openNew()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-gray-900 text-sm font-semibold transition"
          >
            <Plus size={11} /> Add Product
          </button>
        </div>
      </div>

      {/* Low stock alert banner — warning-level, not alarm-red: items can
          still be sold, they just need reordering soon. */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning-surface dark:bg-warning-surface-dark p-4">
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert size={13} className="text-warning dark:text-warning-dark flex-shrink-0" />
            <p className="text-sm font-semibold text-warning dark:text-warning-dark">
              {lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} low on stock
            </p>
            <button
              onClick={() => { setLowStock(true); setPage(1); }}
              className="ml-auto text-xs text-warning dark:text-warning-dark hover:text-warning-dark dark:hover:text-warning underline underline-offset-2 transition"
            >
              View all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.slice(0, 6).map(p => (
              <div
                key={p._id}
                onClick={() => setModal(p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-warning/20 cursor-pointer hover:border-warning/40 transition"
              >
                <PackageOpen size={10} className="text-warning dark:text-warning-dark flex-shrink-0" />
                <span className="text-xs text-gray-900 dark:text-white truncate max-w-[120px]">{p.name}</span>
                <span className={`text-xs font-bold ml-1 ${p.quantity === 0 ? "text-error dark:text-error-dark" : "text-warning dark:text-warning-dark"}`}>
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
          <Search size={11} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Search stock, barcodes, SKUs…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>
        {/* T110: bench vs shop is a property of the item now, not a separate
            table, so it belongs here rather than in the tabs this page used to have. */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900" role="group" aria-label="Stock kind">
          {KINDS.map(({ value, label }) => (
            <button
              key={value || "all"}
              type="button"
              aria-pressed={kind === value}
              onClick={() => { setKind(value); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                kind === value
                  ? "bg-gray-900 text-white dark:bg-brand-500 dark:text-gray-900"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 cursor-pointer transition"
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={() => { setLowStock(v => !v); setPage(1); }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition ${
            lowStock ? "bg-warning-surface border-warning/30 text-warning dark:bg-warning-surface-dark dark:text-warning-dark" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <TriangleAlert size={11} /> Low stock
        </button>
      </div>

      {/* Scan hint */}
      {modal === null && parts.length === 0 && !loading && !q && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
          <Barcode size={18} className="text-brand-ink dark:text-brand-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-ink dark:text-brand-400">Scanner ready</p>
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
            <Wrench size={24} className="text-gray-700 mx-auto mb-3" />
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
                    <div className="min-w-0 flex items-center gap-3">
                      <ProductImage src={p.images?.[0]} alt={p.name} width={36} height={36} className="h-9 w-9 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                          {lowStockFlag && <TriangleAlert size={10} aria-hidden="true" className="text-warning dark:text-warning-dark flex-shrink-0" />}
                          {p.isRetail && <span className="text-xs px-1.5 py-0.5 rounded-md bg-brand-500/15 text-brand-ink dark:text-brand-400 flex-shrink-0">Retail</span>}
                          {p.isActive === false && <Badge tone="neutral">Archived</Badge>}
                        </div>
                        {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                        {p.compatibleWith?.length > 0 && (
                          <p className="text-xs text-gray-600 truncate">{p.compatibleWith.slice(0, 3).join(", ")}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gray-500 hidden sm:block">{p.barcode || "—"}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{p.category}</span>
                    <span className={`text-sm font-semibold hidden sm:block ${lowStockFlag ? (p.quantity === 0 ? "text-error dark:text-error-dark" : "text-warning dark:text-warning-dark") : "text-gray-900 dark:text-white"}`}>{p.quantity}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{formatGhs(p.costPrice)}</span>
                    <span className="text-sm text-brand-ink dark:text-brand-400 font-medium hidden sm:block">{formatGhs(p.sellingPrice)}</span>
                    <div className="flex items-center gap-2 ml-auto sm:ml-0">
                      {/* Inline modal covers the counter fields; the full page covers
                          the shop ones (images, description, slug) — both reach the
                          same document, so keep a route to each. */}
                      <button onClick={() => setModal(p)} title="Quick edit" className="text-gray-500 hover:text-brand-400 transition"><Pen size={13} /></button>
                      <Link
                        href={`/dashboard/commerce/products/${p._id}/edit`}
                        title="Edit shop details"
                        className="text-gray-500 hover:text-brand-400 transition"
                      >
                        <PackageOpen size={13} />
                      </Link>
                      <button
                        onClick={() => handleArchiveToggle(p)}
                        disabled={archiving === p._id}
                        title={p.isActive === false ? "Activate" : "Archive"}
                        className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-40"
                      >
                        {p.isActive === false ? "Activate" : "Archive"}
                      </button>
                      <button onClick={() => handleDelete(p._id)} title="Delete" className="text-gray-500 hover:text-error dark:hover:text-error-dark transition"><Trash2 size={12} /></button>
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
        <ItemModal
          item={modalPart}
          suppliers={suppliers}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchParts(); }}
        />
      )}
    </div>
  );
}

// T24: merged from the old thin /dashboard/commerce landing page (3 cards:
// Inventory, Delivery Zones, Orders) — Inventory is now the page itself,
// with Delivery Zones (admin-only, matching the old card's own gate) and
// Orders as secondary links instead of a separate destination.
export default function CommercePage() {
  const { user } = useAuth();
  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  return (
    // Padding lives here, not in DashboardShell: that shell renders a bare
    // `<main className="flex-1 overflow-auto">`, so its pages each bring their own
    // gutters — and the sibling commerce pages (orders, delivery-zones) already do,
    // which is why only this page sat flush against the viewport edges. The values
    // match PosShell's `p-5 lg:p-7`, so the marketplace lines up with every other
    // POS screen.
    <div className="space-y-5 p-5 lg:p-7">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Every item you stock — bench and shop alike. Items flagged &ldquo;Sell in online shop&rdquo; appear in the storefront.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/dashboard/commerce/delivery-zones"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-600 transition"
            >
              <Truck size={13} /> Delivery Zones
            </Link>
          )}
        </div>
      </div>

      <ProductsList />
    </div>
  );
}
