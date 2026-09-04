"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { canHandleChats } from "@/lib/roles";
import { useInventory } from "@/hooks/queries/useInventory";
import { usePreorderCount } from "@/hooks/queries/useOrders";
import { LogOut, X } from "lucide-react";
import { baseNav, chatNav, adminNav, marketplaceNav, posNav } from "./dashboardNav";

const POS_ROLES = ["superadmin", "admin", "staff", "technician"];

function SidebarLink({ href, icon: Icon, label, active, onClick, badge }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
        active
          ? "bg-brand-500/15 text-brand-ink dark:text-brand-400"
          : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
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

  const isAdmin    = ["admin", "superadmin"].includes(user?.role);
  const isPosRole  = POS_ROLES.includes(user?.role);
  const canSeeStock = ["superadmin", "admin", "staff"].includes(user?.role);

  const visiblePosNav = posNav.filter(n => !n.roles || n.roles.includes(user?.role));
  const visibleBaseNav = baseNav.filter(n => !n.hideRoles || !n.hideRoles.includes(user?.role));

  // Low-stock badge count (React Query — shared cache with the inventory page).
  const lowStockQ = useInventory({ lowStock: true, limit: 1 }, { enabled: canSeeStock });
  const lowStockCount = lowStockQ.data?.total ?? 0;

  /*
   * Pre-orders waiting on stock. The release queue used to be its own nav entry,
   * which made it hard to forget — but a nav item looks identical whether nobody
   * or twelve people are waiting. A count says which, and an unreleased
   * pre-order is a customer who paid and has heard nothing.
   */
  const preorderQ = usePreorderCount({ enabled: canSeeStock });
  const preorderCount = preorderQ.data ?? 0;

  const isActive = (href) => {
    if (href === "/dashboard" || href === "/dashboard/pos") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={`
      fixed top-0 left-0 h-screen w-60 z-40 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-transform duration-200
      ${open ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0 lg:static lg:z-auto
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5" aria-label="EazWorld home">
          <Image
            src="/logo.png"
            alt=""
            width={512}
            height={440}
            className="h-8 w-auto"
            priority
          />
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-none">EazWorld</p>
            <p className="text-gray-500 text-xs">Dashboard</p>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-900 dark:hover:text-white p-1" aria-label="Close menu">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Overview</p>
        {visibleBaseNav.map((item) => (
          <SidebarLink key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
        ))}

        {isPosRole && visiblePosNav.length > 0 && (
          <>
            <p className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Repair Shop POS</p>
            {visiblePosNav.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={onClose}
                badge={item.href === "/dashboard/pos/orders" && preorderCount > 0 ? (
                  <span
                    title={`${preorderCount} pre-order${preorderCount === 1 ? "" : "s"} waiting on stock`}
                    className="ml-auto text-xs bg-warning text-white dark:bg-warning-dark dark:text-gray-900 font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                  >
                    {preorderCount}
                  </span>
                ) : undefined}
              />
            ))}
          </>
        )}

        {["admin", "superadmin", "staff"].includes(user?.role) && (
          <>
            <p className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Marketplace</p>
            {marketplaceNav.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={onClose}
                badge={item.href === "/dashboard/commerce" && lowStockCount > 0 ? (
                  <span className="ml-auto text-xs bg-error text-white dark:bg-error-dark dark:text-gray-900 font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {lowStockCount}
                  </span>
                ) : undefined}
              />
            ))}
          </>
        )}

        {canHandleChats(user?.role) && (
          <>
            <p className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Support</p>
            {chatNav.map((item) => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <p className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-800 px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">Admin</p>
            {adminNav.map((item) => (
              <SidebarLink key={item.href} {...item} active={isActive(item.href)} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-slate-800">
        <button
          onClick={() => { logout(); router.push("/auth/login"); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
