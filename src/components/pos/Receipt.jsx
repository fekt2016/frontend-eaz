"use client";

import { useEffect } from "react";

/**
 * Receipt component — renders a thermal-printer-compatible receipt.
 * Call with autoPrint=true to trigger window.print() immediately.
 *
 * CSS targets 58mm (220px) and 80mm (302px) paper widths.
 * Set your browser's default paper to "thermal" for best results.
 */
export function Receipt({ sale, shopName = "EazWorld Repair Shop", shopPhone = "", autoPrint = false }) {
  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  if (!sale) return null;

  // Sale money fields are integer pesewas; the receipt shows cedis.
  const c = (n) => ((Number(n) || 0) / 100).toFixed(2);

  const date = new Date(sale.createdAt).toLocaleString("en-GH", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      {/* Thermal print styles — only active during print */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #thermal-receipt, #thermal-receipt * { visibility: visible !important; }
          #thermal-receipt {
            position: fixed !important;
            top: 0; left: 0;
            width: 58mm;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 9pt !important;
            line-height: 1.4 !important;
            color: #000 !important;
            background: #fff !important;
          }
          @page { size: 58mm auto; margin: 2mm; }
        }
      `}</style>

      <div
        id="thermal-receipt"
        className="font-mono text-xs text-black bg-white p-4 w-full max-w-[220px] mx-auto leading-snug"
      >
        {/* Header */}
        <div className="text-center mb-2">
          <p className="font-bold text-sm uppercase tracking-wider">{shopName}</p>
          {shopPhone && <p>{shopPhone}</p>}
          <p className="text-[10px] text-gray-500">eazworld.co</p>
        </div>

        <Divider />

        <div className="text-[10px] mb-1">
          <p>Receipt: <strong>{sale.saleNumber}</strong></p>
          <p>Date: {date}</p>
          <p>Cashier: {sale.cashier?.name || "—"}</p>
          {(sale.customerName || sale.customer?.name) && (
            <p>Customer: {sale.customerName || sale.customer?.name}</p>
          )}
        </div>

        <Divider />

        {/* Items */}
        <table className="w-full text-[10px] mb-1">
          <thead>
            <tr>
              <th className="text-left font-normal">Item</th>
              <th className="text-right font-normal">Qty</th>
              <th className="text-right font-normal">GH₵</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, i) => (
              <tr key={i}>
                <td className="pr-1 max-w-[120px] truncate">{item.name}</td>
                <td className="text-right px-1">{item.quantity}</td>
                <td className="text-right">{c(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Divider char="─" />

        {/* Totals */}
        <div className="text-[10px] space-y-0.5">
          {sale.discount > 0 && (
            <Row label="Subtotal" value={`GH₵${c(sale.subtotal)}`} />
          )}
          {sale.discount > 0 && (
            <Row label="Discount" value={`-GH₵${c(sale.discount)}`} />
          )}
          <Row label="TOTAL" value={`GH₵${c(sale.total)}`} bold />
          <Row label={`Paid (${sale.paymentMethod.toUpperCase()})`} value={`GH₵${c(sale.amountPaid)}`} />
          {sale.changeDue > 0 && (
            <Row label="Change" value={`GH₵${c(sale.changeDue)}`} />
          )}
        </div>

        <Divider />

        {/* Footer */}
        <div className="text-center text-[9px] mt-1">
          <p className="font-bold">Thank you!</p>
          <p>Goods sold are not returnable</p>
          <p>unless defective within 7 days</p>
        </div>
      </div>
    </>
  );
}

function Divider({ char = "─" }) {
  return <div className="text-[10px] my-1 overflow-hidden whitespace-nowrap">{char.repeat(32)}</div>;
}

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
