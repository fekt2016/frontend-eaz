// Single source of truth for the shared app sidebar. Every page that uses a
// sidenav (dashboard, commerce, POS) renders the same sections, role-gated.
import {
  FaTachometerAlt, FaStore, FaCalendarAlt, FaComments,
  FaStar, FaFileAlt, FaServer, FaGlobe, FaUsers, FaEnvelope,
  FaBarcode, FaWrench, FaBoxes, FaChartBar, FaReceipt, FaTruck, FaShieldAlt,
  FaShoppingBag, FaHistory,
} from "react-icons/fa";

// Shown to every logged-in dashboard user.
export const baseNav = [
  { href: "/dashboard", icon: FaTachometerAlt, label: "Overview" },
  { href: "/dashboard/orders", icon: FaShoppingBag, label: "Shop Orders" },
  { href: "/dashboard/repairs", icon: FaWrench, label: "My Repairs" },
  { href: "/dashboard/hosting", icon: FaServer, label: "Hosting" },
  { href: "/dashboard/domains", icon: FaGlobe, label: "Domains" },
];

// Admin/superadmin only.
export const adminNav = [
  { href: "/dashboard/consultations", icon: FaCalendarAlt, label: "Consultations" },
  { href: "/dashboard/chats", icon: FaComments, label: "Chat Sessions" },
  { href: "/dashboard/reviews", icon: FaStar, label: "Reviews" },
  { href: "/dashboard/blog", icon: FaFileAlt, label: "Blog Posts" },
  { href: "/dashboard/hosting-orders", icon: FaServer, label: "Hosting Orders" },
  { href: "/dashboard/domain-orders", icon: FaGlobe, label: "Domain Orders" },
  { href: "/dashboard/users", icon: FaUsers, label: "Users" },
  { href: "/dashboard/emails", icon: FaEnvelope, label: "Email Logs" },
  { href: "/dashboard/activity-logs", icon: FaHistory, label: "Activity Log" },
];

// Admin/superadmin only — sits below the Repair Shop POS section.
export const marketplaceNav = [
  { href: "/dashboard/commerce", icon: FaStore, label: "Marketplace" },
  { href: "/dashboard/commerce/inventory", icon: FaBoxes, label: "Inventory" },
];

// roles: if undefined, visible to all POS roles.
// superadmin = full access; admin = repair steps only; staff = full except staff mgmt (also handles sales); technician = repairs
export const posNav = [
  { label: "Sell",       href: "/dashboard/pos/sell",      icon: FaBarcode,  roles: ["superadmin","staff"] },
  { label: "My Jobs",    href: "/dashboard/pos",           icon: FaWrench,   roles: ["technician"] },
  { label: "Jobs",       href: "/dashboard/pos/jobs",      icon: FaWrench,   roles: ["superadmin","staff"] },
  { label: "Orders",     href: "/dashboard/pos/orders",    icon: FaShoppingBag, roles: ["superadmin","admin","staff"] },
  { label: "Suppliers",  href: "/dashboard/pos/suppliers", icon: FaTruck,    roles: ["superadmin","staff"] },
  { label: "Expenses",   href: "/dashboard/pos/expenses",  icon: FaReceipt,  roles: ["superadmin","staff"] },
  { label: "Warranty",   href: "/dashboard/pos/warranty",  icon: FaShieldAlt, roles: ["superadmin","staff"] },
  { label: "Reports",    href: "/dashboard/pos/reports",   icon: FaChartBar, roles: ["superadmin","admin","staff"] },
];
