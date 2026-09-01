"use client";

/**
 * /pos/sell — Production cashier screen
 *
 * Keyboard shortcuts:
 *   F2          Focus scan input
 *   F4 / Enter  Checkout (when cart non-empty, scan empty)
 *   Escape      Clear search / close payment panel
 *   Delete      Remove last cart item
 *   + / -       Adjust last item qty
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "@/lib/api";
import { formatGhs } from "@/lib/shop";
import { qk } from "@/lib/queryKeys";
import { useCreateSale } from "@/hooks/queries/usePosSales";
import { useInventorySearch, fetchScanLookup, fetchRetailSearch } from "@/hooks/queries/useInventory";
import { useDebounce } from "@/hooks/useDebounce";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Receipt } from "@/components/pos/Receipt";
import ProductImage from "@/components/shop/ProductImage";
import {
  Barcode, Trash2, Plus, Minus,
  CheckCircle2, Loader2, TriangleAlert,
  Printer, X,
} from "lucide-react";
import SalesTracker from "@/components/pos/SalesTracker";

// ─────────────────────────────────────────────────────────────────────────────

/*
 * The selected method's fill. The old set was white text on bg-yellow-500
 * (1.94:1) and bg-green-600 (3.9:1) — both fail AA at this size. Gold takes ink
 * (8.47:1), the other two take white on the measured 700-weight tokens.
 */
const METHODS = [
  { key: "cash",  label: "Cash",  color: "bg-success text-white hover:bg-success/90" },
  { key: "momo",  label: "MoMo",  color: "bg-brand-500 text-gray-900 hover:bg-brand-400" },
  { key: "card",  label: "Card",  color: "bg-info text-white hover:bg-info/90" },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function SellPage() {
  // Scan / search
  const scanRef           = useRef(null);
  const [scanInput, setScanInput] = useState("");
  const [results,   setResults]   = useState([]);
  const [scanning,  setScanning]  = useState(false);
  const [scanError, setScanError] = useState("");

  // Cart
  const [cart, setCart] = useState([]); // [{ key, partId?, productId?, name, barcode, unitPrice, quantity, stock }]

  // Payment panel
  const [showPay,    setShowPay]    = useState(false);
  const [payMethod,  setPayMethod]  = useState("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [momoRef,    setMomoRef]    = useState("");
  const [discount,   setDiscount]   = useState("");
  const qc = useQueryClient();
  const createSale = useCreateSale();
  const completing = createSale.isPending;
  const [payError,   setPayError]   = useState("");

  // Completed sale
  const [completedSale, setCompletedSale] = useState(null);

  const amountPaidRef = useRef(null);

  // ── Totals ──────────────────────────────────────────────────────────────────
  // Integer pesewas throughout (T43), matching Sale/Part/Product and the rest of
  // the app. `discount` and `amountPaid` stay cedis STRINGS because a cashier
  // types them — they are converted here, once, at that input edge.
  const subtotal   = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const disc       = Math.round((Number(discount) || 0) * 100);
  const total      = Math.max(0, subtotal - disc);
  const paid       = Math.round((Number(amountPaid) || 0) * 100);
  const changeDue  = Math.max(0, paid - total);
  const canCheckout = cart.length > 0 && !completing;

  // ── Auto-focus scan input ────────────────────────────────────────────────────
  const focusScan = useCallback(() => scanRef.current?.focus(), []);

  useEffect(() => {
    focusScan();
  }, [focusScan]);

  // Re-focus scan after cart change (scanner keeps going)
  useEffect(() => {
    if (!showPay && !completedSale) {
      const t = setTimeout(focusScan, 50);
      return () => clearTimeout(t);
    }
  }, [cart, showPay, completedSale, focusScan]);

  // ── Cart operations ──────────────────────────────────────────────────────────
  const addToCart = (part) => {
    setScanError("");
    setResults([]);
    setCart(prev => {
      // Shop products are flagged `_kind: 'product'` by the API; parts are not.
      const isProduct = part._kind === "product";
      const key       = isProduct ? `p:${part._id}` : `r:${part._id}`;
      const exists    = prev.find(i => i.key === key);
      const stock     = Number(part.quantity) || 0;
      const allowNeg  = Boolean(part.allowNegativeStock);

      if (exists) {
        if (exists.quantity >= stock && !allowNeg) {
          setScanError(`Max stock for "${part.name}" reached (${stock})`);
          return prev;
        }
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      if (stock < 1 && !allowNeg) {
        setScanError(`"${part.name}" is out of stock.`);
        return prev;
      }
      return [...prev, {
        key,
        partId:     isProduct ? undefined : part._id,
        productId:  isProduct ? part._id : undefined,
        name:       part.name,
        barcode:    part.barcode || part.sku,
        image:      part.images?.[0] || null,
        unitPrice:  Math.round(Number(part.sellingPrice) || Number(part.price) || 0),
        quantity:   1,
        stock,
        allowNegativeStock: allowNeg,
      }];
    });
  };

  const removeFromCart = (key) => setCart(prev => prev.filter(i => i.key !== key));

  const changeQty = (key, delta) => {
    setCart(prev => prev.map(i => {
      if (i.key !== key) return i;
      const next = i.quantity + delta;
      if (next <= 0) return null;
      if (next > i.stock && !i.allowNegativeStock) return i;
      return { ...i, quantity: next };
    }).filter(Boolean));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount("");
    setScanError("");
    setResults([]);
    focusScan();
  };

  // ── Payment ──────────────────────────────────────────────────────────────────
  const openPayment = useCallback(() => {
    setPayError("");
    setAmountPaid(payMethod === "momo" || payMethod === "card" ? (total / 100).toFixed(2) : "");
    setShowPay(true);
    setTimeout(() => amountPaidRef.current?.focus(), 100);
  }, [payMethod, total]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (completedSale) return;

      if (e.key === "F2") { e.preventDefault(); focusScan(); }

      if (e.key === "Escape") {
        setScanInput(""); setResults([]); setScanError("");
        if (showPay) setShowPay(false);
        focusScan();
      }

      if ((e.key === "F4" || (e.key === "Enter" && !scanInput.trim())) && canCheckout && !showPay) {
        e.preventDefault();
        openPayment();
      }

      // + / - adjust last cart item
      if (!showPay && document.activeElement === scanRef.current) {
        const last = cart.length - 1;
        if (e.key === "+" && last >= 0) { e.preventDefault(); changeQty(cart[last].key, 1); }
        if (e.key === "-" && last >= 0) { e.preventDefault(); changeQty(cart[last].key, -1); }
        if (e.key === "Delete" && last >= 0) { e.preventDefault(); removeFromCart(cart[last].key); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, showPay, completedSale, canCheckout, scanInput, focusScan, openPayment]);

  // ── Barcode scanner hook (hardware scanner via keyboard wedge) ──────────────
  useBarcodeScanner(async (code) => {
    if (showPay || completedSale) return;
    await handleScanOrSearch(code);
  }, { active: !showPay && !completedSale, minLength: 3 });

  // ── Scan / search logic ──────────────────────────────────────────────────────
  const handleScanOrSearch = useCallback(async (code) => {
    if (!code?.trim()) return;
    setScanning(true);
    setScanError("");
    setResults([]);

    try {
      // Route through React Query's cache (fresh each scan) while keeping the
      // imperative, scanner-driven flow.
      const res = await qc.fetchQuery({
        queryKey: ["scan", code.trim()],
        queryFn: () => fetchScanLookup(code.trim()),
        staleTime: 0,
      });
      if (res.type === "product") {
        addToCart(res.data);
        setScanInput("");
      } else {
        // repair job found — show info, don't add to cart
        setScanError(`Repair job found: ${res.data.jobNumber} — ${res.data.status}`);
      }
    } catch {
      // Not an exact scan match — fall back to search
      try {
        const search = await qc.fetchQuery({
          queryKey: qk.inventory.search(`${code.trim()}|retail`),
          queryFn: () => fetchRetailSearch(code.trim()),
          staleTime: 10_000,
        });
        if (search.data.length === 1) {
          addToCart(search.data[0]);
          setScanInput("");
        } else if (search.data.length > 1) {
          setResults(search.data);
        } else {
          setScanError("No product found for: " + code);
        }
      } catch {
        setScanError("Scan error. Try again.");
      }
    } finally {
      setScanning(false);
    }
  }, [qc]);

  // ── Search as user types (debounced via the shared hooks) ───────────────────
  const debouncedScanInput = useDebounce(scanInput, 200);
  const typeSearch = useInventorySearch(debouncedScanInput, {
    includeProducts: true,
    limit: 10, // the dropdown scrolls, so show a full 10 rather than the default 8
    enabled: debouncedScanInput.trim().length >= 2,
  });

  // Clear results immediately when the input drops below the search threshold
  // (don't wait for the debounce) — same UX as before the migration.
  useEffect(() => {
    if (!scanInput.trim() || scanInput.length < 2) setResults([]);
  }, [scanInput]);

  useEffect(() => {
    if (debouncedScanInput.trim().length >= 2) setResults(typeSearch.data ?? []);
  }, [debouncedScanInput, typeSearch.data]);

  const completeSale = async () => {
    if (!amountPaid || paid < total) {
      setPayError(`Enter amount paid. Need at least ${formatGhs(total)}`);
      return;
    }
    setPayError("");
    try {
      // `paid` and `disc` are already integer pesewas — converted once where the
      // cashier's typed cedis are read, not again here.
      const sale = await createSale.mutateAsync({
        items: cart.map(i => ({ partId: i.partId, productId: i.productId, quantity: i.quantity })),
        paymentMethod: payMethod,
        amountPaid: paid,
        discount: disc || undefined,
        momoReference: momoRef || undefined,
      });
      setCompletedSale(sale);
      setShowPay(false);
    } catch (err) {
      setPayError(errorMessage(err, "Sale failed. Try again."));
    }
  };

  const newSale = () => {
    setCompletedSale(null);
    setCart([]);
    setDiscount("");
    setScanInput("");
    setResults([]);
    setScanError("");
    setPayMethod("cash");
    setAmountPaid("");
    setMomoRef("");
    setTimeout(focusScan, 50);
  };

  // ─── COMPLETED SALE VIEW ────────────────────────────────────────────────────
  if (completedSale) {
    return (
      <div className="max-w-sm mx-auto space-y-4 pt-4">
        <div className="rounded-2xl border border-success/20 bg-success-surface p-5 text-center dark:border-success-dark/30 dark:bg-success-surface-dark">
          <CheckCircle2 size={32} className="text-success dark:text-success-dark mx-auto mb-2" />
          <p className="text-gray-900 dark:text-white font-bold text-lg">Sale Complete</p>
          <p className="text-gray-600 dark:text-slate-400 text-sm">{completedSale.saleNumber}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatGhs(completedSale.total || 0)}</p>
          {completedSale.changeDue > 0 && (
            <p className="text-success dark:text-success-dark font-semibold mt-1">Change: {formatGhs(completedSale.changeDue || 0)}</p>
          )}
        </div>

        {/* Receipt preview */}
        <div className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white">
          <Receipt sale={completedSale} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-600 transition text-sm font-medium"
          >
            <Printer size={13} /> Print Receipt
          </button>
          <button
            onClick={newSale}
            className="py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-gray-900 text-sm font-bold transition"
          >
            New Sale →
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN POS VIEW ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      {/* The till fills the screen, so the heading is for assistive tech only —
          the shell topbar already shows "Sell" visually. */}
      <h1 className="sr-only-text">Sell</h1>
    {/* Bounded rather than full-viewport (was `h-full min-h-[calc(100vh-120px)]`), so
        the sales section below is on screen instead of a whole page-scroll away. The
        cart list inside is `flex-1 overflow-y-auto`, so it just scrolls within its
        panel when the cart is long. */}
    <div className="flex flex-col lg:flex-row gap-4 min-h-[26rem] lg:h-[58vh]">

      {/* ── LEFT: Scan + Cart ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3">

        {/* Scan bar — always focused */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-600">
            {scanning
              ? <Loader2 size={14} className="animate-spin text-brand-ink dark:text-brand-400" />
              : <Barcode size={14} />}
          </div>
          <label htmlFor="pos-scan" className="sr-only-text">Scan barcode or search product</label>
          <input
            id="pos-scan"
            ref={scanRef}
            value={scanInput}
            onChange={e => { setScanInput(e.target.value); setScanError(""); }}
            onKeyDown={e => {
              if (e.key === "Enter" && scanInput.trim()) {
                e.preventDefault();
                handleScanOrSearch(scanInput);
              }
            }}
            placeholder="Scan barcode or search product… (F2 to focus)"
            className="w-full pl-10 pr-10 py-3.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-brand-500/50 focus:border-brand-500 text-gray-900 dark:text-white text-sm placeholder-gray-500 focus:outline-none transition"
            autoComplete="off"
            spellCheck={false}
          />
          {scanInput && (
            <button aria-label="Clear search" onClick={() => { setScanInput(""); setResults([]); focusScan(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 dark:hover:text-white">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Scan error / info */}
        {scanError && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error-surface border border-error/20 dark:bg-error-surface-dark dark:border-error-dark/30 text-error dark:text-error-dark text-sm">
            <TriangleAlert size={12} className="flex-shrink-0" />
            {scanError}
          </div>
        )}

        {/* Search results dropdown */}
        {results.length > 0 && (
          <div className="rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 overflow-hidden shadow-xl">
            <p className="px-4 py-2 text-xs text-gray-600 border-b border-gray-300 dark:border-slate-700">
              {results.length} result{results.length === 1 ? "" : "s"} — click to add
            </p>
            {/* Scrolls at ~5 rows so a full 10 results never push the cart off screen. */}
            <div className="max-h-80 overflow-y-auto overscroll-contain">
            {results.map(p => (
              <button
                key={p._id}
                type="button"
                onClick={() => { addToCart(p); setScanInput(""); setResults([]); focusScan(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-slate-700 transition text-left"
              >
                <ProductImage src={p.images?.[0]} alt={p.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-400">{p.category} · Stock: <span className={p.quantity <= p.lowStockThreshold ? "text-error dark:text-error-dark" : "text-gray-600 dark:text-slate-400"}>{p.quantity}</span></p>
                </div>
                <p className="text-sm font-bold text-brand-ink dark:text-brand-400 ml-4 flex-shrink-0">{formatGhs(Number(p.sellingPrice))}</p>
              </button>
            ))}
            </div>
          </div>
        )}

        {/* Cart */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex flex-col">
          {/* Cart header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide">Cart ({cart.length} item{cart.length !== 1 ? "s" : ""})</p>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-error dark:text-error-dark hover:underline flex items-center gap-1">
                <X size={10} /> Clear
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-600">
                <Barcode size={28} className="mb-2 opacity-30" />
                <p className="text-sm">Scan or search a product to begin</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={item.key}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-800 last:border-0 ${idx === cart.length - 1 ? "bg-brand-500/5" : ""}`}
                >
                  {/* Item image + info */}
                  <ProductImage src={item.image} alt={item.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover bg-gray-100 dark:bg-slate-800 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-gray-600">{formatGhs(item.unitPrice)} each</p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1.5">
                    <button aria-label={`Decrease quantity of ${item.name}`} onClick={() => changeQty(item.key, -1)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white flex items-center justify-center transition">
                      <Minus size={9} />
                    </button>
                    <span className="text-sm font-bold text-gray-900 dark:text-white w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => changeQty(item.key, 1)}
                      aria-label={`Increase quantity of ${item.name}`}
                      disabled={item.quantity >= item.stock && !item.allowNegativeStock}
                      className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white flex items-center justify-center transition disabled:opacity-30"
                    >
                      <Plus size={9} />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <p className="text-sm font-bold text-gray-900 dark:text-white w-20 text-right">{formatGhs(item.unitPrice * item.quantity)}</p>

                  {/* Remove */}
                  <button aria-label={`Remove ${item.name} from cart`} onClick={() => removeFromCart(item.key)} className="text-gray-600 hover:text-error dark:hover:text-error-dark transition ml-1">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Keyboard hint */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-800">
            <p className="text-caption text-gray-600 dark:text-slate-400">F2 focus · F4 checkout · Del remove last · +/- qty · Esc clear</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Summary + Payment ─────────────────────────────────────── */}
      <div className="w-full lg:w-72 flex flex-col gap-3">

        {/* Totals */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 space-y-2.5">
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-3">Summary</p>

          <div className="flex justify-between text-sm text-gray-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="text-gray-900 dark:text-white">{formatGhs(subtotal)}</span>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between">
            <label htmlFor="pos-discount" className="text-body-sm text-gray-600 dark:text-slate-400">Discount</label>
            <div className="relative w-28">
              <span aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-caption text-gray-600 dark:text-slate-400">GH₵</span>
              <input
                id="pos-discount"
                type="number" min="0" value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition text-right"
              />
            </div>
          </div>

          <div className="flex justify-between text-base font-bold border-t border-gray-200 dark:border-slate-800 pt-2.5">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-brand-ink dark:text-brand-400">{formatGhs(total)}</span>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map(m => (
            <button
              key={m.key}
              onClick={() => {
                setPayMethod(m.key);
                if (m.key !== "cash") setAmountPaid((total / 100).toFixed(2));
              }}
              aria-pressed={payMethod === m.key}
              className={`py-2.5 rounded-xl text-sm font-bold transition ${
                payMethod === m.key
                  ? m.color
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Payment panel (inline when open) */}
        {showPay && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-brand-500/30 p-5 space-y-3">
            <p className="text-xs font-semibold text-brand-ink dark:text-brand-400 uppercase tracking-wide">Collect Payment</p>

            <div>
              <label htmlFor="pos-amount-paid" className="mb-1.5 block text-caption text-gray-600 dark:text-slate-400">
                Amount received (GH₵) <span aria-hidden="true">*</span>
              </label>
              <input
                id="pos-amount-paid"
                ref={amountPaidRef}
                aria-required="true"
                type="number" min="0"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") completeSale(); }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-base font-bold focus:outline-none focus:border-brand-500 transition"
                placeholder="0.00"
              />
            </div>

            {payMethod === "momo" && (
              <div>
                <label htmlFor="pos-momo-ref" className="mb-1.5 block text-caption text-gray-600 dark:text-slate-400">MoMo reference</label>
                <input
                  id="pos-momo-ref"
                  value={momoRef}
                  onChange={e => setMomoRef(e.target.value)}
                  placeholder="Transaction ref…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            )}

            {paid > 0 && paid >= total && (
              <div className="flex justify-between rounded-xl border border-success/20 bg-success-surface px-3 py-2 text-body-sm dark:border-success-dark/30 dark:bg-success-surface-dark">
                <span className="text-success dark:text-success-dark font-medium">Change due</span>
                <span className="text-success dark:text-success-dark font-bold">{formatGhs(changeDue)}</span>
              </div>
            )}

            {payError && <p className="text-error dark:text-error-dark text-sm">{payError}</p>}

            <button
              onClick={completeSale}
              disabled={completing || paid < total}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-base font-bold text-white transition hover:bg-success/90 disabled:opacity-40"
            >
              {completing
                ? <><Loader2 className="animate-spin" size={14} /> Processing…</>
                : <><CheckCircle2 size={14} /> Complete Sale (Enter)</>}
            </button>

            <button onClick={() => { setShowPay(false); focusScan(); }} className="w-full py-2 text-gray-600 hover:text-gray-900 dark:hover:text-white text-sm transition">
              ← Back (Esc)
            </button>
          </div>
        )}

        {/* Checkout button */}
        {!showPay && (
          <button
            onClick={openPayment}
            disabled={!canCheckout}
            className="w-full py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-gray-900 font-bold text-base transition disabled:opacity-30 flex items-center justify-center gap-2"
          >
            Checkout →  {formatGhs(total)}
          </button>
        )}

        {/* Quick stats */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 px-4 py-3 space-y-1">
          <p className="text-xs text-gray-600">{cart.length} item(s) · {cart.reduce((s, i) => s + i.quantity, 0)} unit(s)</p>
          <p className="text-xs text-gray-600">Press F4 or Enter to checkout</p>
        </div>
      </div>

    </div>

      {/* Sales tracking — staff see their own, admin sees every cashier's. */}
      <SalesTracker />
    </div>
  );
}
