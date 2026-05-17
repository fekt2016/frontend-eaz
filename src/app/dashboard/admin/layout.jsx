"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FaTachometerAlt, FaFileAlt, FaCalendarAlt, FaServer,
  FaGlobe, FaUsers, FaEnvelope, FaBars, FaTimes, FaChevronRight, FaStar, FaComments,
} from "react-icons/fa";

const navItems = [
  { href: "/dashboard/admin",               icon: FaTachometerAlt, label: "Overview" },
  { href: "/dashboard/admin/consultations", icon: FaCalendarAlt,   label: "Consultations" },
  { href: "/dashboard/admin/chats",         icon: FaComments,      label: "Chat Sessions" },
  { href: "/dashboard/admin/reviews",       icon: FaStar,          label: "Reviews" },
  { href: "/dashboard/admin/blog",          icon: FaFileAlt,       label: "Blog Posts" },
  { href: "/dashboard/admin/hosting",       icon: FaServer,        label: "Hosting Orders" },
  { href: "/dashboard/admin/domains",       icon: FaGlobe,         label: "Domain Orders" },
  { href: "/dashboard/admin/users",         icon: FaUsers,         label: "Users" },
  { href: "/dashboard/admin/emails",        icon: FaEnvelope,      label: "Email Logs" },
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

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [pathname]);

  if (loading || user?.role !== "admin") return null;

  const isActive = (href) =>
    href === "/dashboard/admin"
      ? pathname === "/dashboard/admin"
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center px-4 gap-3 mt-16">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <FaBars size={16} />
        </button>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin Panel</p>
      </div>

      {/* Sidebar */}
      <>
        {/* Overlay */}
        {open && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}

        <aside className={`
          fixed top-0 left-0 z-50 h-full w-60 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 pt-20 pb-6 px-3
          flex flex-col
          transition-transform duration-300
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}>
          {/* Close button (mobile) */}
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden absolute top-4 right-3 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <FaTimes size={14} />
          </button>

          <div className="mb-6 px-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Admin Panel</p>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                {...item}
                active={isActive(item.href)}
                onClick={() => setOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 px-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition"
            >
              ← Back to My Dashboard
            </Link>
          </div>
        </aside>
      </>

      {/* Main content — offset by sidebar on desktop */}
      <div className="lg:pl-60 pt-16 lg:pt-0">
        {/* Extra top offset on mobile for the admin top bar */}
        <div className="lg:hidden h-14" />
        {children}
      </div>
    </div>
  );
}
