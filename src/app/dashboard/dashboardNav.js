// Single source of truth for the shared app sidebar. Every page that uses a
// sidenav (dashboard, commerce, POS) renders the same sections, role-gated.
import {
  Barcode, BarChart3, CalendarDays, FileText, Gauge, Globe,
  History, Mail, MessagesSquare, Receipt, Server, ShieldCheck,
  ShoppingBag, Star, Store, Truck, Users, Wrench,
} from "lucide-react";

// Shown to every logged-in dashboard user.
export const baseNav = [
  { href: "/dashboard", icon: Gauge, label: "Overview" },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Shop Orders" },
  { href: "/dashboard/repairs", icon: Wrench, label: "My Repairs" },
  { href: "/dashboard/hosting", icon: Server, label: "Hosting" },
  { href: "/dashboard/domains", icon: Globe, label: "Domains" },
];

// Admin/superadmin only.
export const adminNav = [
  { href: "/dashboard/consultations", icon: CalendarDays, label: "Consultations" },
  { href: "/dashboard/chats", icon: MessagesSquare, label: "Chat Sessions" },
  { href: "/dashboard/reviews", icon: Star, label: "Reviews" },
  { href: "/dashboard/blog", icon: FileText, label: "Blog Posts" },
  { href: "/dashboard/hosting-orders", icon: Server, label: "Hosting Orders" },
  { href: "/dashboard/domain-orders", icon: Globe, label: "Domain Orders" },
  { href: "/dashboard/users", icon: Users, label: "Users" },
  { href: "/dashboard/emails", icon: Mail, label: "Email Logs" },
  { href: "/dashboard/activity-logs", icon: History, label: "Activity Log" },
];

// Admin/superadmin/staff — sits below the Repair Shop POS section. T24:
// Marketplace and Inventory merged into one page/one nav entry.
export const marketplaceNav = [
  { href: "/dashboard/commerce", icon: Store, label: "Marketplace" },
];

// roles: if undefined, visible to all POS roles.
// superadmin = full access; admin = repair steps only; staff = full except staff mgmt (also handles sales); technician = repairs
export const posNav = [
  { label: "Sell",       href: "/dashboard/pos/sell",      icon: Barcode,  roles: ["superadmin","staff"] },
  { label: "My Jobs",    href: "/dashboard/pos",           icon: Wrench,   roles: ["technician"] },
  { label: "Jobs",       href: "/dashboard/pos/jobs",      icon: Wrench,   roles: ["superadmin","staff"] },
  { label: "Orders",     href: "/dashboard/pos/orders",    icon: ShoppingBag, roles: ["superadmin","admin","staff"] },
  { label: "Suppliers",  href: "/dashboard/pos/suppliers", icon: Truck,    roles: ["superadmin","staff"] },
  { label: "Expenses",   href: "/dashboard/pos/expenses",  icon: Receipt,  roles: ["superadmin","staff"] },
  { label: "Warranty",   href: "/dashboard/pos/warranty",  icon: ShieldCheck, roles: ["superadmin","staff"] },
  { label: "Reports",    href: "/dashboard/pos/reports",   icon: BarChart3, roles: ["superadmin","admin","staff"] },
];
