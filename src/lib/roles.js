// `restrictTo('admin')` on the backend implicitly grants superadmin (site owner)
// access too — these dashboard gates need the same rule, or a superadmin gets
// redirected out of admin pages / their data silently never loads.
export const ADMIN_ROLES = ["admin", "superadmin"];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

// Who can work the live-chat console (/dashboard/chats): admins plus
// front-desk staff. Backend mirrors this via restrictTo('admin', 'staff').
export function canHandleChats(role) {
  return [...ADMIN_ROLES, "staff"].includes(role);
}

// Where each role should land right after signing in — login, email
// verification, and 2FA verification all need this same mapping (T29).
export function landingPathForRole(role) {
  if (role === "admin" || role === "superadmin") return "/dashboard";
  if (role === "staff") return "/dashboard/pos/sell";
  if (role === "technician") return "/dashboard/pos";
  return "/"; // customers land on the homepage, not the dashboard
}

// ── Shared role presentation ───────────────────────────────────────────────
// These lived inside the users LIST page. The user-detail page needs the same
// options and the same colour mapping, and a second copy is exactly how two
// surfaces drift apart — one gains a role the other never shows. Single source.

export const ROLE_OPTIONS = [
  { value: "user",       label: "User" },
  { value: "staff",      label: "Staff" },
  { value: "technician", label: "Technician" },
  { value: "admin",      label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

/*
 * Roles used to carry five hand-picked Tailwind hues (purple/blue/emerald/
 * orange) whose light shades were never contrast-checked. They now map onto the
 * measured semantic tones, which stay distinguishable while clearing 4.5:1 in
 * both themes. Gold is reserved for the highest authority — the house accent.
 */
export const roleTones = {
  superadmin: "brand",
  admin:      "info",
  staff:      "success",
  technician: "warning",
  user:       "neutral",
};

export function roleLabel(role) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label || role || "—";
}
