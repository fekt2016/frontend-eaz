"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaTools, FaHome, FaWrench, FaUsers, FaBoxes,
  FaChartBar, FaUsersCog, FaBars, FaTimes, FaSignOutAlt, FaBarcode, FaExternalLinkAlt, FaShieldAlt, FaReceipt, FaTruck,
} from "react-icons/fa";
import { adminNav } from "../dashboard/dashboardNav";

// roles: if undefined, visible to all POS roles
// superadmin = full access; admin = repair steps only; staff = full except staff mgmt; cashier = sales; technician = repairs
const NAV = [
  { label: "Sell",       href: "/pos/sell",        icon: FaBarcode,  roles: ["superadmin","cashier","staff"] },
  { label: "Dashboard",  href: "/pos/dashboard",   icon: FaHome,     roles: ["superadmin","admin","staff"] },
  { label: "My Jobs",    href: "/pos",             icon: FaWrench,   roles: ["technician"] },
  { label: "Jobs",       href: "/pos/jobs",        icon: FaWrench,   roles: ["superadmin","staff"] },
  { label: "Customers",  href: "/pos/customers",   icon: FaUsers,    roles: ["superadmin","staff","cashier"] },
  { label: "Inventory",  href: "/pos/inventory",   icon: FaBoxes,    roles: ["superadmin","staff"] },
  { label: "Suppliers",  href: "/pos/suppliers",   icon: FaTruck,     roles: ["superadmin","staff"] },
  { label: "Expenses",   href: "/pos/expenses",    icon: FaReceipt,   roles: ["superadmin","staff"] },
  { label: "Warranty",   href: "/pos/warranty",    icon: FaShieldAlt, roles: ["superadmin","staff"] },
  { label: "Reports",    href: "/pos/reports",     icon: FaChartBar,  roles: ["superadmin","staff"] },
  { label: "Staff",      href: "/pos/staff",       icon: FaUsersCog,  roles: ["superadmin"] },
];

const Spinner = () => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
  </div>
);

export default function PosShell({ children }) {
  const { user, loading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [redirecting,    setRedirecting]    = useState(false);
  const [lowStockCount,  setLowStockCount]  = useState(0);

  useEffect(() => {
    if (user && ["superadmin","staff"].includes(user.role)) {
      api.get("/pos/inventory?lowStock=true&limit=1")
        .then(r => setLowStockCount(r.total || 0))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      const POS_ROLES = ["superadmin", "admin", "staff", "cashier", "technician"];
      if (!user) {
        setRedirecting(true);
        router.replace("/auth/login?redirect=/pos/sell");
      } else if (!POS_ROLES.includes(user.role)) {
        setRedirecting(true);
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  const POS_ROLES = ["superadmin", "admin", "staff", "cashier", "technician"];
  if (loading || redirecting || !user) return <Spinner />;
  if (!POS_ROLES.includes(user.role)) return <Spinner />;

  const visibleNav = NAV.filter(n => !n.roles || n.roles.includes(user.role));

  // Technicians get a horizontal top navigation bar instead of the left sidebar.
  if (user.role === "technician") {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <header className="sticky top-0 z-40 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
            <Link href="/pos" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <FaTools size={13} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-white text-sm leading-none">EazRepair</p>
                <p className="text-gray-500 text-xs">POS System</p>
              </div>
            </Link>

            <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
              {visibleNav.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || (!["/pos", "/pos/dashboard"].includes(href) && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                      active
                        ? "bg-amber-500/15 text-amber-400"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={() => { logout(); router.push("/auth/login"); }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
              >
                <FaSignOutAlt size={13} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
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
    <div className="min-h-screen bg-gray-950 flex">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-60 z-40 flex flex-col bg-gray-900 border-r border-gray-800 transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <Link href={user.role === "technician" ? "/pos" : "/pos/dashboard"} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <FaTools size={13} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">EazRepair</p>
              <p className="text-gray-500 text-xs">POS System</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white p-1">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (!["/pos", "/pos/dashboard"].includes(href) && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-amber-500/15 text-amber-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon size={14} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {href === "/pos/inventory" && lowStockCount > 0 && (
                  <span className="ml-auto text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {lowStockCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Shared admin dashboard nav — jump back to the admin dashboard */}
          {["admin", "superadmin"].includes(user.role) && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Admin Dashboard</p>
              {adminNav.filter((i) => i.href !== "/pos").map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active ? "bg-amber-500/15 text-amber-400" : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-2">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {user.role === "superadmin" ? "Super Admin" : user.role === "admin" ? "Admin" : user.role}
            </p>
          </div>
          {user.role === "superadmin" && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <FaExternalLinkAlt size={11} />
              Main Dashboard
            </Link>
          )}
          <button
            onClick={() => { logout(); router.push("/auth/login"); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <FaSignOutAlt size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Topbar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-1">
            <FaBars size={18} />
          </button>
          <span className="font-bold text-white text-sm">EazRepair POS</span>
          <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
