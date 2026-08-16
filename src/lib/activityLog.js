// Activity Log display helpers — labels, colors, and pure formatters for the
// admin Activity Log page. Mirrors the backend vocabulary in
// `backend-eaz/services/activityLogService.js` (ACTIONS / RESOURCES). The API
// returns the raw action/resource strings, so every mapping lives here.
//
// IMPORTANT: never render raw user-agent strings, IPs, or request ids without
// escaping — the log record reflects untrusted request metadata.

// ─── Action labels ───────────────────────────────────────────────────────────

export const ACTIVITY_ACTION_LABELS = {
  AUTH_LOGIN:                "Login",
  AUTH_LOGIN_FAILED:         "Failed Login",
  AUTH_LOGOUT:               "Logout",
  USER_REGISTERED:           "New Registration",
  USER_CREATED:              "User Created",
  USER_UPDATED:              "User Updated",
  USER_ROLE_CHANGED:         "Role Changed",
  USER_BLOCKED:              "User Blocked",
  USER_UNBLOCKED:            "User Unblocked",
  USER_PASSWORD_CHANGED:     "Password Changed",
  CUSTOMER_CREATED:          "Customer Created",
  CUSTOMER_UPDATED:          "Customer Updated",
  ORDER_CREATED:             "Order Placed",
  ORDER_PAID:                "Payment Received",
  ORDER_UPDATED:             "Order Updated",
  ORDER_STATUS_CHANGED:      "Order Status Changed",
  ORDER_CANCELLED:           "Order Cancelled",
  ORDER_TRACKING_UPDATED:    "Tracking Updated",
  PAYMENT_VERIFIED:          "Payment Verified",
  PAYMENT_FAILED:            "Payment Failed",
  PRODUCT_CREATED:           "Product Created",
  PRODUCT_UPDATED:           "Product Updated",
  PRODUCT_DELETED:           "Product Deleted",
  INVENTORY_CREATED:         "Part Added",
  INVENTORY_UPDATED:         "Part Updated",
  INVENTORY_DELETED:         "Part Deleted",
  INVENTORY_STOCK_ADJUSTED:  "Stock Adjusted",
  REPAIR_CREATED:            "Repair Job Created",
  REPAIR_UPDATED:            "Repair Job Updated",
  REPAIR_STATUS_CHANGED:     "Repair Status Changed",
  REPAIR_PAYMENT_ADDED:      "Repair Payment Added",
  SALE_CREATED:              "POS Sale",
  SALE_VOIDED:               "POS Sale Voided",
  PART_ORDER_STATUS_CHANGED: "Part Order Status",
  REPAIR_ORDER_STATUS_CHANGED: "Repair Order Status",
  STAFF_CREATED:             "Staff Created",
  SETTINGS_UPDATED:          "Settings Updated",
};

export const ACTIVITY_ACTION_OPTIONS = Object.entries(ACTIVITY_ACTION_LABELS).map(
  ([value, label]) => ({ value, label }),
);

// Grouped for the action filter dropdown.
export const ACTIVITY_ACTION_GROUPS = [
  { label: "Authentication & Users", actions: [
    "AUTH_LOGIN", "AUTH_LOGIN_FAILED", "AUTH_LOGOUT", "USER_REGISTERED",
    "USER_CREATED", "USER_UPDATED", "USER_ROLE_CHANGED", "USER_BLOCKED",
    "USER_UNBLOCKED", "USER_PASSWORD_CHANGED", "STAFF_CREATED",
  ] },
  { label: "Shop Orders & Payments", actions: [
    "ORDER_CREATED", "ORDER_PAID", "ORDER_UPDATED", "ORDER_STATUS_CHANGED",
    "ORDER_CANCELLED", "ORDER_TRACKING_UPDATED", "PAYMENT_VERIFIED", "PAYMENT_FAILED",
  ] },
  { label: "Products & Inventory", actions: [
    "PRODUCT_CREATED", "PRODUCT_UPDATED", "PRODUCT_DELETED",
    "INVENTORY_CREATED", "INVENTORY_UPDATED", "INVENTORY_DELETED", "INVENTORY_STOCK_ADJUSTED",
  ] },
  { label: "Repair Shop (POS)", actions: [
    "REPAIR_CREATED", "REPAIR_UPDATED", "REPAIR_STATUS_CHANGED", "REPAIR_PAYMENT_ADDED",
    "SALE_CREATED", "SALE_VOIDED", "PART_ORDER_STATUS_CHANGED", "REPAIR_ORDER_STATUS_CHANGED",
  ] },
  { label: "Customers & Settings", actions: [
    "CUSTOMER_CREATED", "CUSTOMER_UPDATED", "SETTINGS_UPDATED",
  ] },
];

// Badge colors keyed by action (falls back to a neutral slate badge).
export const ACTIVITY_ACTION_STYLES = {
  // Auth / security
  AUTH_LOGIN:               "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  AUTH_LOGIN_FAILED:        "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  AUTH_LOGOUT:              "bg-gray-50 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
  USER_REGISTERED:          "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  USER_CREATED:             "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  USER_UPDATED:             "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  USER_ROLE_CHANGED:        "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  USER_BLOCKED:             "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  USER_UNBLOCKED:           "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  USER_PASSWORD_CHANGED:    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  STAFF_CREATED:            "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  // Orders & payments
  ORDER_CREATED:            "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  ORDER_PAID:               "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ORDER_UPDATED:            "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  ORDER_STATUS_CHANGED:     "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  ORDER_CANCELLED:          "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ORDER_TRACKING_UPDATED:   "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  PAYMENT_VERIFIED:         "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PAYMENT_FAILED:           "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  // Products & inventory
  PRODUCT_CREATED:          "bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  PRODUCT_UPDATED:          "bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  PRODUCT_DELETED:          "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  INVENTORY_CREATED:        "bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  INVENTORY_UPDATED:        "bg-lime-50 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  INVENTORY_DELETED:        "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  INVENTORY_STOCK_ADJUSTED: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  // Repair shop
  REPAIR_CREATED:           "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  REPAIR_UPDATED:           "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  REPAIR_STATUS_CHANGED:    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  REPAIR_PAYMENT_ADDED:     "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  SALE_CREATED:             "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  SALE_VOIDED:              "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PART_ORDER_STATUS_CHANGED: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  REPAIR_ORDER_STATUS_CHANGED: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  // Customers & settings
  CUSTOMER_CREATED:         "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  CUSTOMER_UPDATED:         "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  SETTINGS_UPDATED:         "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export const ACTIVITY_RESOURCE_LABELS = {
  USER:         "User",
  CUSTOMER:     "Customer",
  ORDER:        "Order",
  PAYMENT:      "Payment",
  PRODUCT:      "Product",
  INVENTORY:    "Inventory",
  REPAIR:       "Repair Job",
  SALE:         "POS Sale",
  PART_ORDER:   "Part Order",
  REPAIR_ORDER: "Repair Order",
  STAFF:        "Staff",
  SETTINGS:     "Settings",
  AUTH:         "Authentication",
};

export const ACTIVITY_RESOURCE_OPTIONS = [
  { value: "all", label: "All resources" },
  ...Object.entries(ACTIVITY_RESOURCE_LABELS).map(([value, label]) => ({ value, label })),
];

// ─── Roles ───────────────────────────────────────────────────────────────────

export const ACTIVITY_ROLE_LABELS = {
  superadmin: "Super Admin",
  admin:      "Admin",
  staff:      "Staff",
  technician: "Technician",
  user:       "Customer",
  system:     "System",
};

export const ACTIVITY_ROLE_STYLES = {
  superadmin: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin:      "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
  staff:      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  technician: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  user:       "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  system:     "bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400",
};

export const ACTIVITY_ROLE_OPTIONS = [
  { value: "all",      label: "All roles" },
  { value: "superadmin", label: "Super Admin" },
  { value: "admin",    label: "Admin" },
  { value: "staff",    label: "Staff" },
  { value: "technician", label: "Technician" },
  { value: "user",     label: "Customer" },
  { value: "system",   label: "System" },
];

// ─── Formatters ──────────────────────────────────────────────────────────────

export function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function fmtDateOnly(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function actionLabel(action) {
  return ACTIVITY_ACTION_LABELS[action] || action || "—";
}

export function resourceLabel(type) {
  return ACTIVITY_RESOURCE_LABELS[type] || type || "—";
}

export function actorLabel(log) {
  if (!log) return "System";
  if (log.actorName) return log.actorName;
  if (log.actorEmail) return log.actorEmail;
  return log.actorRole === "system" || !log.actorRole ? "System" : "—";
}

export function roleLabel(role) {
  return ACTIVITY_ROLE_LABELS[role] || role || "—";
}

// Compact human summary of the changed fields, e.g.
// "Status: pending → processing · Qty: 3 → 10". Falls back to the field count.
export function describeChanges(changes = []) {
  if (!Array.isArray(changes) || changes.length === 0) return "";
  const parts = changes.map((c) => {
    const label = c.label || c.field || "field";
    if (c.before === null && c.after === null) return label;
    return `${label}: ${c.before ?? "—"} → ${c.after ?? "—"}`;
  });
  return parts.join(" · ");
}

// Short one-line summary used inside table cells.
export function changesSummary(changes = []) {
  if (!Array.isArray(changes) || changes.length === 0) return "";
  return changes
    .map((c) => `${c.label || c.field}: ${c.before ?? "—"} → ${c.after ?? "—"}`)
    .join("; ");
}
