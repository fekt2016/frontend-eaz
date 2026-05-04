"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FaDownload, FaUpload, FaCheckCircle } from "react-icons/fa";
import { api } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const statusColors = {
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  paid: "bg-blue-50 text-blue-700 border-blue-100",
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-red-50 text-red-700 border-red-100",
  failed: "bg-red-50 text-red-700 border-red-100",
};

export default function HostingOrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    api.get(`/hosting/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleInvoiceDownload = () => {
    window.open(`${BASE_URL}/hosting/orders/${orderId}/invoice`, "_blank");
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("proof", file);
      const res = await fetch(`${BASE_URL}/hosting/orders/${orderId}/proof`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setOrder((prev) => ({ ...prev, proofUploadUrl: data.data.proofUploadUrl }));
      setUploadSuccess(true);
    } catch (err) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white px-4 pt-24 pb-24 text-center">
        <p className="text-gray-400">Order not found.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-amber-500 hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const isBankTransfer = order.paymentMethod === "bank_transfer";
  const canUploadProof = isBankTransfer && order.status === "pending" && !order.proofUploadUrl;

  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to Dashboard
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 capitalize">
              {order.planType} — {order.tier}
            </h1>
            <p className="text-gray-400 text-sm mt-1 capitalize">{order.billingCycle} plan</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${statusColors[order.status] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
            {order.status}
          </span>
        </div>

        {/* Order details */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-400">Amount</dt>
              <dd className="font-medium text-gray-900">GH₵{order.amount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400">Payment method</dt>
              <dd className="font-medium text-gray-900 capitalize">{order.paymentMethod.replace("_", " ")}</dd>
            </div>
            {order.domain && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Domain</dt>
                <dd className="font-medium text-gray-900">{order.domain}</dd>
              </div>
            )}
            {order.cpanelUsername && (
              <div className="flex justify-between">
                <dt className="text-gray-400">cPanel username</dt>
                <dd className="font-medium text-gray-900">{order.cpanelUsername}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-400">Order date</dt>
              <dd className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
            </div>
            {order.paidAt && (
              <div className="flex justify-between">
                <dt className="text-gray-400">Paid on</dt>
                <dd className="font-medium text-gray-900">{new Date(order.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Invoice download — only for paid/active orders */}
          {(order.status === "paid" || order.status === "active") && (
            <button
              onClick={handleInvoiceDownload}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-gray-200 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition"
            >
              <FaDownload size={13} />
              Download Invoice
            </button>
          )}

          {/* Bank transfer proof upload */}
          {canUploadProof && (
            <div>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-60"
              >
                <FaUpload size={13} />
                {uploading ? "Uploading..." : "Upload Payment Proof"}
              </button>
              {uploadError && <p className="text-red-500 text-xs mt-2 text-center">{uploadError}</p>}
            </div>
          )}

          {/* Proof already uploaded */}
          {isBankTransfer && (order.proofUploadUrl || uploadSuccess) && order.status === "pending" && (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <FaCheckCircle className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700">Payment proof uploaded. We&apos;ll verify and activate your account within 24 hours.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
