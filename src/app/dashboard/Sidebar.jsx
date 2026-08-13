"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FaTachometerAlt, FaTimes, FaSignOutAlt, FaUserCircle, FaGlobe } from "react-icons/fa";
import { baseNav, adminNav, marketplaceNav, posNav } from "./dashboardNav";

const POS_ROLES = ["superadmin", "admin", "staff", "technician"];

function SidebarLink({ href, icon: Icon, label, active, onClick, badge }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
        active
          ? "bg-brand-500/15 text-brand-600 dark:text-brand-400"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <Icon size={14} className="flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge}
    </Link>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [lowStockCount, setLowStockCount] = useState(0);

  const isAdmin    = ["admin", "superadmin"].includes(user?.role);
  const isPosRole  = POS_ROLES.includes(user?.role);

  const visiblePosNav = posNav.filter(n => !n.roles || n.roles.includes(user?.role));

  useEffect(() => {
    if (user && ["superadmin", "admin"].includes(user.role)) {
      api.get("/pos/inventory?lowStock=true&limit=1")
        .then(r => setLowStockCount(r.total || 0))
        .catch(() => {});
    }
  }, [user]);

  const isActive = (href) => {
    if (href === "/dashboard" || href === "/dashboard/pos" || href === "/dashboard/pos/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const roleLabel = user?.role === "superadmin"
    ? "Super Admin"
    : user?.role === "admin"
      ? "Admin"
      : user?.role;

  return (
    <aside className={`
      fixed top-0 left-0 h-full w-60 z-40 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-200
      ${open ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0 lg:static lg:z-auto
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <FaTachometerAlt size={13} className="text-gray-900 dark:text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-none">EazWorld</p>
            <p className="text-gray-500 text-xs">Dashboard</p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white p-1" aria-label="Close menu">
            <FaTimes size={14} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Dashboard</p>
        {baseNav.map((item) => (
          <SidebarLink key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
        ))}

        {isPosRole && visiblePosNav.length > 0 && (
          <>
            <p className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Repair Shop POS</p>
            {visiblePosNav.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={onClose}
              />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <p className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Marketplace</p>
            {marketplaceNav.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={onClose}
                badge={item.href === "/dashboard/commerce/inventory" && lowStockCount > 0 ? (
                  <span className="ml-auto text-xs bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {lowStockCount}
                  </span>
                ) : undefined}
              />
            ))}
          </>
        )}

        {["staff"].includes(user?.role) && (
          <>
            <p className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Marketplace</p>
            {marketplaceNav.filter((n) => n.href !== "/dashboard/commerce/inventory").map((item) => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <p className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Admin</p>
            {adminNav.map((item) => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate capitalize">{roleLabel}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <FaGlobe size={13} />
          View Website
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <FaUserCircle size={13} />
          Settings
        </Link>
        <button
          onClick={() => { logout(); router.push("/auth/login"); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <FaSignOutAlt size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
