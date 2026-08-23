"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  useUnreadNotificationCount,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/queries/useNotifications";

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Bell + unread badge + recent-notifications dropdown (T12). Rendered in
// every dashboard topbar (DashboardShell, PosShell) so it's visible app-wide.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const panelRef = useRef(null);

  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: listData, isLoading } = useNotifications({ limit: 8 }, { enabled: open });
  const items = listData?.data ?? [];
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleItemClick = (n) => {
    if (!n.read) markRead.mutate(n._id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); markAllRead.mutate(); }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-gray-500 px-4 py-6 text-center">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500 px-4 py-6 text-center">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleItemClick(n); }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                    !n.read ? "bg-brand-500/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <Link
            href="/dashboard/notifications"
            onMouseDown={() => setOpen(false)}
            className="block text-center text-xs font-semibold text-brand-600 dark:text-brand-400 px-4 py-3 border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
