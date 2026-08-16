"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { FaBars } from "react-icons/fa";
import Sidebar from "./Sidebar";

const roleLabel = (role) =>
  role === "superadmin" ? "Super Admin" : role === "admin" ? "Admin" : role;

export default function DashboardShell({ children, title = "Dashboard" }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile sidebar on navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 flex">

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <button onClick={() => setOpen(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1" aria-label="Open menu">
            <FaBars size={18} />
          </button>
          <span className="font-bold text-gray-900 dark:text-white text-sm">{title}</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Topbar (desktop) */}
        <header className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">{title}</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right hidden xl:block">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{roleLabel(user?.role)}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
