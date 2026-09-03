"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { Menu } from "lucide-react";
import Sidebar from "../Sidebar";

const PAGE_TITLES = {
  "/dashboard/pos": "My Jobs",
  "/dashboard/pos/sell": "Sell",
  "/dashboard/pos/jobs": "Jobs",
  "/dashboard/pos/jobs/new": "New Job",
  "/dashboard/pos/orders": "Orders",
  "/dashboard/pos/suppliers": "Suppliers",
  "/dashboard/pos/expenses": "Expenses",
  "/dashboard/pos/warranty": "Warranty",
  "/dashboard/pos/reports": "Reports",
};

const Spinner = () => (
  <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-slate-700 border-t-brand-400 rounded-full animate-spin" />
  </div>
);

export default function PosShell({ children }) {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [redirecting,    setRedirecting]    = useState(false);

  useEffect(() => {
    if (!loading) {
      const POS_ROLES = ["superadmin", "admin", "staff", "technician"];
      if (!user) {
        setRedirecting(true);
        router.replace("/auth/login?redirect=/dashboard/pos/sell");
      } else if (!POS_ROLES.includes(user.role)) {
        setRedirecting(true);
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  const POS_ROLES = ["superadmin", "admin", "staff", "technician"];
  if (loading || redirecting || !user) return <Spinner />;
  if (!POS_ROLES.includes(user.role)) return <Spinner />;

  const pageTitle = Object.keys(PAGE_TITLES)
    .filter(p => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0] || "POS";

  return (
    <div className="h-screen overflow-hidden bg-paper dark:bg-ink flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="p-1 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="text-body-sm font-bold text-gray-900 dark:text-white">{pageTitle}</span>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-ink dark:text-brand-400 font-bold text-xs">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Topbar (desktop) */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
          {/* Wayfinding, not the page heading: every POS page renders its own
              <h1>, so this must not be a second one. */}
          <p className="text-base font-bold text-gray-900 dark:text-white">{pageTitle}</p>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <div className="text-right hidden xl:block">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{user.name}</p>
              <p className="truncate text-caption capitalize text-gray-600 dark:text-slate-400">
                {user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : user.role}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
