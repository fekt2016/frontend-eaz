"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FaTachometerAlt, FaUserCircle, FaTools, FaStore, FaCalendarAlt, FaComments,
  FaStar, FaFileAlt, FaServer, FaGlobe, FaUsers, FaEnvelope,
  FaBars, FaTimes, FaChevronRight,
} from "react-icons/fa";

// Shared for every /dashboard route.
const baseNav = [
  { href: "/dashboard", icon: FaTachometerAlt, label: "Overview" },
  { href: "/dashboard/settings", icon: FaUserCircle, label: "Settings" },
];

// Admin/staff only.
const adminNav = [
  { href: "/pos", icon: FaTools, label: "Repair Shop POS" },
  { href: "/commerce", icon: FaStore, label: "Commerce" },
  { href: "/dashboard/admin/consultations", icon: FaCalendarAlt, label: "Consultations" },
  { href: "/dashboard/admin/chats", icon: FaComments, label: "Chat Sessions" },
  { href: "/dashboard/admin/reviews", icon: FaStar, label: "Reviews" },
  { href: "/dashboard/admin/blog", icon: FaFileAlt, label: "Blog Posts" },
  { href: "/dashboard/admin/hosting", icon: FaServer, label: "Hosting Orders" },
  { href: "/dashboard/admin/domains", icon: FaGlobe, label: "Domain Orders" },
  { href: "/dashboard/admin/users", icon: FaUsers, label: "Users" },
  { href: "/dashboard/admin/emails", icon: FaEnvelope, label: "Email Logs" },
];

function SidebarLink({ href, icon: Icon, label, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <Icon size={15} className={active ? "text-amber-500" : ""} />
      {label}
      {active && <FaChevronRight size={9} className="ml-auto text-amber-400" />}
    </Link>
  );
}

export default function DashboardShell({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  // Close the mobile sidebar on navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center px-4 gap-3 mt-16">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <FaBars size={16} />
        </button>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Dashboard</p>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-60 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 pt-20 pb-6 px-3
        flex flex-col transition-transform duration-300
        lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}>
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-4 right-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          aria-label="Close menu"
        >
          <FaTimes size={14} />
        </button>

        <div className="mb-4 px-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Dashboard</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {baseNav.map((item) => (
            <SidebarLink key={item.href} {...item} active={isActive(item.href)} onClick={() => setOpen(false)} />
          ))}

          {isAdmin && (
            <>
              <p className="mt-5 mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Admin</p>
              {adminNav.map((item) => (
                <SidebarLink key={item.href} {...item} active={isActive(item.href)} onClick={() => setOpen(false)} />
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Main content — offset by the sidebar on desktop */}
      <div className="lg:pl-60 pt-16 lg:pt-0">
        <div className="lg:hidden h-14" />
        {children}
      </div>
    </div>
  );
}
