"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/queries/useNotifications";

function fmtDateTime(value) {
  return new Date(value).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  // Owner decision (2026-08-30): 10 per page everywhere.
  const limit = 10;

  const { data, isLoading } = useNotifications({ page, limit, unreadOnly });
  const notifications = data?.data ?? [];
  const total = data?.total ?? 0;

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleClick = (n) => {
    if (!n.read) markRead.mutate(n._id);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-600 dark:text-slate-500 mt-0.5">Alerts relevant to you.</p>
        </div>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          className="text-xs font-semibold px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition"
        >
          Mark all read
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setUnreadOnly(false); setPage(1); }}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
            !unreadOnly
              ? "bg-brand-500/15 border-brand-500/30 text-brand-ink dark:text-brand-400"
              : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => { setUnreadOnly(true); setPage(1); }}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
            unreadOnly
              ? "bg-brand-500/15 border-brand-500/30 text-brand-ink dark:text-brand-400"
              : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400"
          }`}
        >
          Unread
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={24} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {unreadOnly ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n._id}
              type="button"
              onClick={() => handleClick(n)}
              className={`w-full text-left flex items-start gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition ${
                !n.read ? "bg-brand-500/5" : ""
              }`}
            >
              {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
              <div className={`min-w-0 flex-1 ${n.read ? "ml-5" : ""}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                {n.body && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>}
                <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">{fmtDateTime(n.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {total > limit && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              ← Prev
            </button>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
