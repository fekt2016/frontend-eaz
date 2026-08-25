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
