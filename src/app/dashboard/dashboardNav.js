// Single source of truth for the shared app sidebar. Every page that uses a
// sidenav (dashboard, commerce, POS) renders the same sections, role-gated.
import {
  Barcode, BarChart3, CalendarDays, FileText, Gauge, Globe,
  History, Mail, MapPin, MessagesSquare, PackageCheck, Receipt, Server, ServerCog, Settings, ShieldCheck,
  Ship, ShoppingBag, Star, Store, Truck, Users, Wrench,
} from "lucide-react";

// Shown to every logged-in dashboard user except where `hideRoles` excludes them.
// T21: technicians get zero hosting/domain access, so Hosting/Domains are hidden for them.
export const baseNav = [
  { href: "/dashboard", icon: Gauge, label: "Overview" },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Shop Orders" },
  { href: "/dashboard/repairs", icon: Wrench, label: "My Repairs" },
  // Owner decision (2026-08-30): the address book is a CUSTOMER surface —
  // only role "user" sees it. A delivery address book on a staff account has
  // no purpose. Hiding the link is presentation only; the real gate is
  // denyRoles on backend routes/addressRoutes.js, with the Next middleware
  // stopping the page in between.
  { href: "/dashboard/addresses", icon: MapPin, label: "My Addresses",
    hideRoles: ["superadmin", "admin", "staff", "technician"] },
  { href: "/dashboard/hosting", icon: Server, label: "Hosting", hideRoles: ["technician"] },
  { href: "/dashboard/domains", icon: Globe, label: "Domains", hideRoles: ["technician"] },
];

// Live-chat console — admins plus front-desk staff. Kept out of adminNav so
// staff get this without the rest of the admin toolset (backend mirrors via
// restrictTo('admin', 'staff')).
export const chatNav = [
  { href: "/dashboard/chats", icon: MessagesSquare, label: "Chat Sessions" },
];

// Admin/superadmin only.
export const adminNav = [
  { href: "/dashboard/consultations", icon: CalendarDays, label: "Consultations" },
  { href: "/dashboard/reviews", icon: Star, label: "Reviews" },
  { href: "/dashboard/blog", icon: FileText, label: "Blog Posts" },
  { href: "/dashboard/hosting-orders", icon: Server, label: "Hosting Orders" },
  { href: "/dashboard/domain-orders", icon: Globe, label: "Domain Orders" },
  { href: "/dashboard/users", icon: Users, label: "Users" },
  { href: "/dashboard/emails", icon: Mail, label: "Email Logs" },
  { href: "/dashboard/activity-logs", icon: History, label: "Activity Log" },
  { href: "/dashboard/business-settings", icon: Settings, label: "Business Settings" },
];

// Admin/superadmin/staff — sits below the Repair Shop POS section. T24:
// Marketplace and Inventory merged into one page/one nav entry.
export const marketplaceNav = [
  { href: "/dashboard/commerce", icon: Store, label: "Marketplace" },
  // T45 — the pre-order release queue. Its own entry because releasing is a
  // recurring job someone has to go looking for, not a detail of one order.
  { href: "/dashboard/commerce/preorders", icon: PackageCheck, label: "Pre-orders" },
  { href: "/dashboard/commerce/shipments", icon: Ship, label: "Shipments" },
  // T68 — same class of recurring job for hosting: paid VPS/Cloud/Email orders
  // nobody has built yet. Backend mirrors via restrictTo('admin', 'staff').
  { href: "/dashboard/hosting/awaiting-provisioning", icon: ServerCog, label: "Awaiting Provisioning" },
];

// roles: if undefined, visible to all POS roles.
// superadmin = full access; admin = management and reporting; staff = the counter
// (sales, jobs, payments); technician = repairs.
// T83 (owner, 2026-08-29): Reports, Suppliers and Warranty moved to superadmin +
// admin. The server enforces the same in routes/posRoutes.js — this only hides
// the entries, and hiding is never the guard.
export const posNav = [
  { label: "Sell",       href: "/dashboard/pos/sell",      icon: Barcode,  roles: ["superadmin","staff"] },
  { label: "My Jobs",    href: "/dashboard/pos",           icon: Wrench,   roles: ["technician"] },
  { label: "Orders",     href: "/dashboard/pos/orders",    icon: ShoppingBag, roles: ["superadmin","admin","staff"] },
  { label: "Suppliers",  href: "/dashboard/pos/suppliers", icon: Truck,    roles: ["superadmin","admin"] },
  { label: "Expenses",   href: "/dashboard/pos/expenses",  icon: Receipt,  roles: ["superadmin","admin","staff"] },
  { label: "Warranty",   href: "/dashboard/pos/warranty",  icon: ShieldCheck, roles: ["superadmin","admin"] },
  { label: "Reports",    href: "/dashboard/pos/reports",   icon: BarChart3, roles: ["superadmin","admin"] },
];

// ── Page titles ──────────────────────────────────────────────────────────────
// DashboardShell renders its `title` prop as the desktop topbar <h1>, defaulting
// to "Dashboard". AppShellDecision never passed one, so every route except the
// Marketplace announced itself as "Dashboard" — and pages that also rendered
// their own heading produced two <h1>s. This resolves a real name from the nav
// entries already defined above, so the sidebar label and the page title can
// never drift apart.

// Routes that have a title but deliberately no sidebar entry.
const extraTitles = {
  "/dashboard/settings": "Settings",
  "/dashboard/notifications": "Notifications",
  "/dashboard/pos/jobs": "Repair Jobs",
  "/dashboard/pos/jobs/new": "New Repair Job",
  "/dashboard/pos/sell": "Sell",
  "/dashboard/commerce/inventory": "Inventory",
  "/dashboard/commerce/products": "Products",
  "/dashboard/commerce/products/new": "New Product",
  "/dashboard/commerce/delivery-zones": "Delivery Zones",
  "/dashboard/hosting/new-account": "New Hosting Account",
  "/dashboard/hosting/awaiting-provisioning": "Awaiting Provisioning",
};

/**
 * Resolve a page title for a dashboard pathname.
 *
 * Longest-prefix match, so detail routes inherit their section's name
 * (`/dashboard/orders/653…` → "Shop Orders") instead of falling back to the
 * generic default.
 */
export function titleForPath(pathname) {
  if (!pathname) return "Dashboard";
  const candidates = [
    ...extraTitles ? Object.entries(extraTitles).map(([href, label]) => ({ href, label })) : [],
    ...baseNav,
    ...chatNav,
    ...adminNav,
    ...marketplaceNav,
    ...posNav,
  ];

  let best = null;
  for (const entry of candidates) {
    if (pathname === entry.href || pathname.startsWith(entry.href + "/")) {
      if (!best || entry.href.length > best.href.length) best = entry;
    }
  }
  return best ? best.label : "Dashboard";
}
