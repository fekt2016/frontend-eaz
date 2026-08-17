"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FaDownload, FaUpload, FaCheckCircle, FaExternalLinkAlt, FaTrash, FaRedo, FaKey } from "react-icons/fa";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const NS1 = process.env.NEXT_PUBLIC_NAMESERVER_1 || "ns1.eazworld.com";
const NS2 = process.env.NEXT_PUBLIC_NAMESERVER_2 || "ns2.eazworld.com";

const statusColors = {
  pending: "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:border-brand-900/30",
  paid: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/30",
  active: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/30",
  cancelled: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30",
  failed: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30",
  suspended: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900/30",
  terminated: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/30",
};

export default function HostingOrderDetailPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [newCreds, setNewCreds] = useState(null);
  const fileRef = useRef(null);

  const fetchOrder = async () => {
    const res = await api.get(`/hosting/orders/${orderId}`);
    setOrder(res.data);
  };

  useEffect(() => {
    api.get(`/hosting/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await fetchOrder();
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const handleInvoiceDownload = () => {
    window.open(`${BASE_URL}/hosting/orders/${orderId}/invoice`, "_blank");
  };

  const handleCpanelLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await api.get(`/hosting/orders/${orderId}/cpanel-login`);
      if (res.data?.url) {
        const openInNewTab = process.env.NEXT_PUBLIC_CPANEL_OPEN_IN_NEW_TAB === "true";
        if (openInNewTab) {
          window.open(res.data.url, "_blank", "noopener,noreferrer");
        } else {
          window.location.href = res.data.url;
        }
      }
    } catch (err) {
      alert(err?.message || "Failed to generate login session. Please try again later.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRenew = async () => {
    setRenewLoading(true);
    try {
      const res = await api.post(`/hosting/orders/${orderId}/renew`, {
        paymentMethod: "paystack_card",
      });
      const { authorizationUrl, orderId: renewalOrderId } = res.data;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      } else {
        // bank transfer fallback
        router.push(`/hosting/bank-transfer/${renewalOrderId}`);
      }
    } catch (err) {
      alert(err?.message || "Failed to start renewal. Please try again.");
    } finally {
      setRenewLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm("Generate a new cPanel password? Your current password will stop working immediately.")) return;
    setPwLoading(true);
    try {
      const res = await api.post(`/hosting/orders/${orderId}/password`, {});
      setNewCreds(res.data); // { username, password } — shown once
    } catch (err) {
      alert(err?.message || "Failed to reset the hosting password. Please try again later.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!confirm("Are you sure you want to delete this order from the system? This action cannot be undone.")) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/hosting/orders/${orderId}`);
      router.push("/dashboard");
    } catch (err) {
      alert(err?.message || "Failed to delete order.");
    } finally {
      setDeleteLoading(false);
    }
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
      <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 dark:border-slate-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24 text-center">
        <p className="text-gray-400 dark:text-slate-500">Order not found.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm text-brand-500 hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const isBankTransfer = order.paymentMethod === "bank_transfer";
  const canUploadProof = isBankTransfer && order.status === "pending" && !order.proofUploadUrl;
  const isAdmin = user?.role === "admin";
  const isTempDomain = !order.domain || (order.domain.endsWith(".eazworld.com") && order.domain.split(".").length === 3);
  const showNameservers = order.domain && !isTempDomain;

  const expiresAt = order.expiresAt ? new Date(order.expiresAt) : null;
  const now = new Date();
  const daysLeft = expiresAt ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
  const canRenew = order.status === "active" || (["cancelled", "suspended"].includes(order.status) && order.cpanelUsername);

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition">
          ← Back to Dashboard
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {order.planType} — {order.tier}
            </h1>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1 capitalize">{order.billingCycle} plan</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${statusColors[order.status] || "bg-paper text-gray-600 border-gray-100"}`}>
            {order.status}
          </span>
        </div>

        {/* Order details */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4">Order Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-400 dark:text-slate-500">Amount</dt>
              <dd className="font-medium text-gray-900 dark:text-white">GH₵{order.amount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-400 dark:text-slate-500">Payment method</dt>
              <dd className="font-medium text-gray-900 dark:text-white capitalize">{order.paymentMethod.replace("_", " ")}</dd>
            </div>
            {order.domain && (
              <div className="flex justify-between">
                <dt className="text-gray-400 dark:text-slate-500">Domain</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{order.domain}</dd>
              </div>
            )}
            {order.cpanelUsername && (
              <div className="flex justify-between">
                <dt className="text-gray-400 dark:text-slate-500">cPanel username</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{order.cpanelUsername}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-400 dark:text-slate-500">Order date</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
            </div>
            {order.paidAt && (
              <div className="flex justify-between">
                <dt className="text-gray-400 dark:text-slate-500">Paid on</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{new Date(order.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
              </div>
            )}
            {expiresAt && (
              <div className="flex justify-between">
                <dt className="text-gray-400 dark:text-slate-500">Expires</dt>
                <dd className={`font-medium ${isExpired ? "text-red-600 dark:text-red-400" : isExpiringSoon ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-white"}`}>
                  {expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {isExpired && " — Expired"}
                  {isExpiringSoon && !isExpired && ` — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                </dd>
              </div>
            )}
            {order.renewedAt && (
              <div className="flex justify-between">
                <dt className="text-gray-400 dark:text-slate-500">Last renewed</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{new Date(order.renewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Nameserver instructions — own domain orders only */}
        {showNameservers && (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-6 mb-5">
            <h2 className="text-sm font-semibold text-brand-900 mb-1">📡 Point your domain</h2>
            <p className="text-xs text-brand-700 mb-3">
              Update the nameservers for <strong className="font-mono">{order.domain}</strong> at your registrar to:
            </p>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between bg-white rounded-xl px-4 py-2.5 border border-brand-100">
                <span className="text-gray-400 font-sans text-xs">NS1</span>
                <span className="font-semibold text-gray-900">{NS1}</span>
              </div>
              <div className="flex justify-between bg-white rounded-xl px-4 py-2.5 border border-brand-100">
                <span className="text-gray-400 font-sans text-xs">NS2</span>
                <span className="font-semibold text-gray-900">{NS2}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-brand-700">DNS propagation takes 24–48 hours. Your cPanel is accessible immediately via the button below once your account is active.</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">

          {/* Expired warning */}
          {isExpired && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Your hosting has expired</p>
              <p className="text-xs text-red-600 dark:text-red-500">Your account has been suspended. Renew now to restore it instantly — your data is safe for 30 days.</p>
            </div>
          )}

          {/* Expiring soon warning */}
          {isExpiringSoon && !isExpired && (
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/30">
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-400 mb-1">Expiring in {daysLeft} day{daysLeft === 1 ? "" : "s"}</p>
              <p className="text-xs text-brand-600 dark:text-brand-500">Renew now to avoid any interruption to your website.</p>
            </div>
          )}

          {/* Renew button */}
          {canRenew && (
            <button
              onClick={handleRenew}
              disabled={renewLoading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold transition disabled:opacity-60 ${
                isExpired
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100"
                  : isExpiringSoon
                    ? "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-100"
                    : "border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500"
              }`}
            >
              {renewLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FaRedo size={12} />
              )}
              {isExpired ? "Renew & Restore Hosting" : "Renew Subscription"}
            </button>
          )}

          {/* Manage Hosting — only for active hosting */}
          {order.status === "active" && order.cpanelUsername && (
            <button
              onClick={handleCpanelLogin}
              disabled={loginLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition disabled:opacity-60 shadow-lg shadow-brand-100"
            >
              {loginLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FaExternalLinkAlt size={12} />
              )}
              Manage Hosting (cPanel)
            </button>
          )}

          {/* Reset cPanel password — active hosting only */}
          {order.status === "active" && order.cpanelUsername && (
            <button
              onClick={handleResetPassword}
              disabled={pwLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-60"
            >
              {pwLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <FaKey size={12} />
              )}
              Reset cPanel Password
            </button>
          )}

          {/* Newly generated credentials — shown once */}
          {newCreds && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">New cPanel credentials</p>
              <div className="space-y-1 text-sm font-mono">
                <div className="flex justify-between"><span className="text-gray-500 font-sans text-xs">Username</span><span className="font-semibold text-gray-900 dark:text-white">{newCreds.username}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-sans text-xs">Password</span><span className="font-semibold text-gray-900 dark:text-white break-all">{newCreds.password}</span></div>
              </div>
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">Save these now — for your security this password won&apos;t be shown again.</p>
            </div>
          )}

          {/* Provisioning status — paid but not active yet */}
          {order.status === "paid" && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {order.provisioningStatus === "failed"
                  ? "Provisioning failed. Please contact support or try again later."
                  : "Your payment is confirmed. We’re provisioning your hosting account now."}
              </p>
              <button
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-blue-200 dark:border-blue-900/40 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:border-blue-300 transition disabled:opacity-60"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
                ) : null}
                Refresh status
              </button>
            </div>
          )}

          {/* Invoice download — only for paid/active orders */}
          {(order.status === "paid" || order.status === "active") && (
            <button
              onClick={handleInvoiceDownload}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition"
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
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
              <FaCheckCircle className="text-emerald-500 dark:text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">Payment proof uploaded. We&apos;ll verify and activate your account within 24 hours.</p>
            </div>
          )}

          {/* Admin Delete Button */}
          {isAdmin && (
            <button
              onClick={handleDeleteOrder}
              disabled={deleteLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-red-100 text-red-500 text-sm font-medium hover:bg-red-50 transition mt-8"
            >
              <FaTrash size={12} />
              {deleteLoading ? "Deleting..." : "Delete Order from System"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
