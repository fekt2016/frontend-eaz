"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Truck, Boxes, TriangleAlert, Phone, Mail, MapPin, Copy, Check } from "lucide-react";
import { FaWhatsapp, FaWeixin } from "react-icons/fa";
import { useSupplier } from "@/hooks/queries/useSuppliers";
import { formatGhs } from "@/lib/shop";

export default function SupplierDetailPage() {
  const { id } = useParams();
  const { data, isLoading: loading, error: queryError } = useSupplier(id);
  const supplier = data?.supplier ?? null;
  const parts    = data?.parts ?? [];
  const error    = queryError?.message || "";

  const [wechatCopied, setWechatCopied] = useState(false);
  const copyWechat = () => {
    if (!supplier?.wechat) return;
    navigator.clipboard.writeText(supplier.wechat).then(() => {
      setWechatCopied(true);
      setTimeout(() => setWechatCopied(false), 2000);
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-700 border-t-brand-400 rounded-full animate-spin" />
    </div>
  );

  if (error || !supplier) return (
    <div className="text-center py-16 text-gray-500">
      {error || "Supplier not found."}{" "}
      <Link href="/dashboard/pos/suppliers" className="text-brand-ink dark:text-brand-400 hover:underline">Back</Link>
    </div>
  );

  const lowStockParts = parts.filter(p => p.quantity <= p.lowStockThreshold);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pos/suppliers" className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
          <ArrowLeft size={12} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{supplier.name}</h1>
            {!supplier.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">Inactive</span>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{parts.length} part{parts.length !== 1 ? "s" : ""} linked</p>
        </div>
      </div>

      {/* Contact card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Contact Info</p>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {supplier.contactPerson && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Truck size={11} className="text-brand-ink dark:text-brand-400" />
              </div>
              <span>{supplier.contactPerson}</span>
            </div>
          )}
          {supplier.phone && (
            <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-brand-400 transition">
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Phone size={10} className="text-brand-ink dark:text-brand-400" />
              </div>
              <span>{supplier.phone}</span>
            </a>
          )}
          {supplier.email && (
            <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-brand-400 transition">
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Mail size={10} className="text-brand-ink dark:text-brand-400" />
              </div>
              <span>{supplier.email}</span>
            </a>
          )}
          {supplier.whatsapp && (
            <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-emerald-400 transition">
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <FaWhatsapp size={12} className="text-emerald-500" />
              </div>
              <span>{supplier.whatsapp}</span>
            </a>
          )}
          {supplier.wechat && (
            <button onClick={copyWechat} className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-green-400 transition text-left">
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <FaWeixin size={12} className="text-green-500" />
              </div>
              <span className="flex items-center gap-1.5">
                {supplier.wechat}
                {wechatCopied ? <Check size={10} aria-hidden="true" className="text-success dark:text-success-dark" /> : <Copy size={10} className="text-gray-500" />}
              </span>
            </button>
          )}
          {supplier.address && (
            <div className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={10} className="text-brand-ink dark:text-brand-400" />
              </div>
              <span>{supplier.address}</span>
            </div>
          )}
        </div>
        {supplier.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{supplier.notes}</p>
          </div>
        )}
      </div>

      {/* Low stock alert */}
      {lowStockParts.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
          <TriangleAlert size={14} className="text-error dark:text-error-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-error dark:text-error-dark">{lowStockParts.length} part{lowStockParts.length !== 1 ? "s" : ""} need reordering</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {lowStockParts.map(p => (
                <Link key={p._id} href="/dashboard/commerce" className="text-xs px-2.5 py-1 rounded-lg bg-error-surface text-error hover:bg-error/20 dark:bg-error-surface-dark dark:text-error-dark transition">
                  {p.name} · {p.quantity} left
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parts list */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Boxes size={13} className="text-brand-ink dark:text-brand-400" /> Linked Parts
          </h2>
          <Link href="/dashboard/commerce" className="text-xs text-brand-ink dark:text-brand-400 hover:underline">Manage inventory →</Link>
        </div>

        {parts.length === 0 ? (
          <div className="py-12 text-center">
            <Boxes size={22} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No parts linked to this supplier yet.</p>
            <p className="text-gray-600 text-xs mt-1">Edit a part in inventory and select this supplier.</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_100px_80px_80px_80px] gap-3 px-5 py-2.5 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 font-medium uppercase tracking-wide">
              <span>Part</span><span>Category</span><span>Stock</span><span>Cost</span><span>Sell</span>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {parts.map(p => {
                const isLow = p.quantity <= p.lowStockThreshold;
                return (
                  <div key={p._id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_80px_80px_80px] gap-3 items-center px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                      {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{p.category}</span>
                    <div className="flex items-center gap-1.5">
                      {isLow && <TriangleAlert size={9} className="text-error dark:text-error-dark" />}
                      <span className={`text-sm font-semibold ${isLow ? "text-error dark:text-error-dark" : "text-gray-900 dark:text-white"}`}>{p.quantity}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{formatGhs(p.costPrice)}</span>
                    <span className="text-xs text-brand-ink dark:text-brand-400 hidden sm:block">{formatGhs(p.sellingPrice)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
