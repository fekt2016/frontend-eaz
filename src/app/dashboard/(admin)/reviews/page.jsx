"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaSpinner, FaRedo, FaCheck, FaTimes, FaTrash,
  FaStar, FaSearch,
} from "react-icons/fa";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <FaStar
          key={s}
          size={11}
          className={s <= rating ? "text-brand-400" : "text-gray-200 dark:text-slate-700"}
        />
      ))}
    </div>
  );
}

const SERVICE_COLORS = {
  "Web Design":       "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "SEO":              "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Paid Advertising": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Branding":         "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Social Media":     "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "Email Marketing":  "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "Phone Repair":     "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function AdminReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");   // all | pending | approved
  const [search, setSearch]     = useState("");
  const [acting, setActing]     = useState({});       // { [id]: true } — per-row loading

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const json = await api.get("/reviews/all");
      setReviews(json.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") fetchReviews();
  }, [authLoading, user?.role, fetchReviews]);

  const setApproval = async (id, approved) => {
    setActing((a) => ({ ...a, [id]: true }));
    try {
      await api.patch(`/reviews/${id}/approve`, { approved });
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, approved } : r)));
    } catch {} finally {
      setActing((a) => ({ ...a, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this review permanently?")) return;
    setActing((a) => ({ ...a, [id]: true }));
    try {
      await api.delete(`/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch {} finally {
      setActing((a) => ({ ...a, [id]: false }));
    }
  };

  if (authLoading) return null;

  const pending  = reviews.filter((r) => !r.approved).length;
  const approved = reviews.filter((r) =>  r.approved).length;

  const filtered = reviews
    .filter((r) => {
      if (filter === "pending")  return !r.approved;
      if (filter === "approved") return  r.approved;
      return true;
    })
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        r.name?.toLowerCase().includes(q) ||
        r.service?.toLowerCase().includes(q) ||
        r.review?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-6 pb-24">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
              {reviews.length} total · {approved} approved · {pending} pending
            </p>
          </div>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50"
          >
            <FaRedo size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total",    value: reviews.length, color: "text-gray-900 dark:text-white" },
            { label: "Approved", value: approved,        color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Pending",  value: pending,         color: pending > 0 ? "text-brand-500" : "text-gray-900 dark:text-white" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-full p-1">
            {[["all", "All"], ["pending", `Pending${pending > 0 ? ` (${pending})` : ""}`], ["approved", "Approved"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                  filter === val
                    ? "bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <FaSearch size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, service or content…"
              className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-400 transition"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <FaSpinner className="animate-spin text-2xl text-brand-500" />
            <span className="text-sm">Loading reviews…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400 dark:text-slate-500">
            <p className="text-4xl mb-4">⭐</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">No reviews found</p>
            <p className="text-xs">Reviews submitted by clients will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div
                key={r._id}
                className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 transition ${
                  !r.approved
                    ? "border-brand-200 dark:border-brand-800/40"
                    : "border-gray-100 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: reviewer info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm flex-shrink-0">
                      {r.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SERVICE_COLORS[r.service] || "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300"}`}>
                          {r.service}
                        </span>
                        {!r.approved && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 border border-brand-200 dark:border-brand-800/40">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={r.rating} />
                        <span className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(r.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed mt-2">{r.review}</p>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {acting[r._id] ? (
                      <FaSpinner className="animate-spin text-gray-400" size={14} />
                    ) : (
                      <>
                        {!r.approved ? (
                          <button
                            onClick={() => setApproval(r._id, true)}
                            title="Approve"
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition"
                          >
                            <FaCheck size={10} /> Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => setApproval(r._id, false)}
                            title="Unapprove"
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 transition"
                          >
                            <FaTimes size={10} /> Unapprove
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(r._id)}
                          title="Delete"
                          className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                          <FaTrash size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
