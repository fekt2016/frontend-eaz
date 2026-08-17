"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { Menu, Settings, Wrench } from "lucide-react";
import { posNav } from "../dashboardNav";
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
  <div className="min-h-screen bg-paper dark:bg-gray-950 flex items-center justify-center">
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

  const visibleNav = posNav.filter(n => !n.roles || n.roles.includes(user.role));

  const pageTitle = Object.keys(PAGE_TITLES)
    .filter(p => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0] || "POS";

  // Technicians get a horizontal top navigation bar instead of the left sidebar.
  if (user.role === "technician") {
    return (
      <div className="h-screen overflow-hidden bg-paper dark:bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
            <Link href="/dashboard/pos" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <Wrench size={13} className="text-gray-900 dark:text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-gray-900 dark:text-white text-sm leading-none">EazWorld</p>
                <p className="text-gray-500 text-xs">Dashboard</p>
              </div>
            </Link>

            <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
              {visibleNav.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (!["/dashboard", "/dashboard/pos"].includes(href) && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                      active
                        ? "bg-brand-500/15 text-brand-600 dark:text-brand-400"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 flex-shrink-0">
              <ThemeToggle />
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Settings"
              >
                <Settings size={13} />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-7">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-paper dark:bg-gray-950 flex">

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
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1">
            <Menu size={18} />
          </button>
          <span className="font-bold text-gray-900 dark:text-white text-sm">EazWorld</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Topbar (desktop) */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right hidden xl:block">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{user.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">
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
