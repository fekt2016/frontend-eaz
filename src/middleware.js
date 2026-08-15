import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// 30-second in-memory cache — avoids a backend hit on every page navigation
let _maintCache = null;
let _maintCachedAt = 0;
const MAINT_TTL_MS = 30_000;

async function getMaintenanceStatus() {
  const now = Date.now();
  if (_maintCache && now - _maintCachedAt < MAINT_TTL_MS) return _maintCache;

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')
      || (process.env.NODE_ENV === 'production' ? null : 'http://localhost:5000');
    if (!apiBase) return { active: false, message: '', scheduledEnd: null };
    // Hard timeout so a slow/stale backend can't hang every page render
    const res  = await fetch(`${apiBase}/api/v1/settings`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    const json = await res.json();
    if (json.success) {
      _maintCache = {
        active:       json.data.maintenanceActive ?? false,
        message:      json.data.maintenanceMessage ?? '',
        scheduledEnd: json.data.maintenanceScheduledEnd ?? null,
      };
      _maintCachedAt = now;
      return _maintCache;
    }
  } catch {
    // Backend unreachable — don't block users
  }
  return { active: false, message: '', scheduledEnd: null };
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // ── Always allow: Next internals, API proxy, and real static assets ──────
  // Only known static-file extensions bypass middleware, so URLs like
  // /dashboard/foo.bar still hit the auth/maintenance guards.
  const STATIC_EXT_RE =
    /\.(?:ico|png|svg|jpg|jpeg|gif|webp|txt|xml|json|woff|woff2|webmanifest|map)$/i;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    STATIC_EXT_RE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ── Verify token and extract role ──────────────────────────────────────────
  const ADMIN_ROLES    = ["admin", "superadmin"];
  const POS_ROLES      = ["superadmin", "admin", "staff", "technician"];
  let isAdmin = false;
  let userRole = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      userRole = payload?.role;
      isAdmin  = ADMIN_ROLES.includes(userRole);
    } catch { /* invalid / forged token — treat as guest */ }
  }

  // ── Keep the team out of the public storefront ───────────────────────────────
  // Any signed-in staff-side role (superadmin/admin/staff/technician) is bounced
  // from public pages to the dashboard. Guests and customers (role "user") are
  // free to browse the shop, blog, etc. /auth stays open so login/logout works.
  const inStaffArea = pathname.startsWith("/dashboard") || pathname.startsWith("/auth");
  if (token && POS_ROLES.includes(userRole) && !inStaffArea) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Maintenance check (skip for admins) ─────────────────────────────────────
  if (!isAdmin) {
    const { active, message, scheduledEnd } = await getMaintenanceStatus();

    // Maintenance is ON → send to maintenance page (unless already there)
    if (active && !pathname.startsWith("/maintenance")) {
      const url = new URL("/maintenance", request.url);
      if (message)      url.searchParams.set("msg", message);
      if (scheduledEnd) url.searchParams.set("until", scheduledEnd);
      return NextResponse.redirect(url);
    }

    // Maintenance is OFF → redirect away from maintenance page back to home
    if (!active && pathname.startsWith("/maintenance")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // ── Dashboard auth guard ─────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Admin-only dashboard pages (flat routes under /dashboard).
  const ADMIN_DASHBOARD_PATHS = [
    "/dashboard/consultations",
    "/dashboard/chats",
    "/dashboard/reviews",
    "/dashboard/blog",
    "/dashboard/hosting-orders",
    "/dashboard/domain-orders",
    "/dashboard/users",
    "/dashboard/emails",
    // Delivery Zones — admin/superadmin only. Inventory and Products are
    // open to staff too (they manage parts + shop products in the marketplace).
    "/dashboard/commerce/delivery-zones",
  ];
  if (token && ADMIN_DASHBOARD_PATHS.some((p) => pathname.startsWith(p))) {
    if (!ADMIN_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Staff-accessible dashboard pages (marketplace). The backend gates shop
  // order APIs to admin + staff, so staff may open the marketplace overview
  // and shop orders — but not the admin-only commerce subpages above.
  const STAFF_DASHBOARD_PATHS = [
    "/dashboard/commerce",
    "/dashboard/commerce/orders",
  ];
  if (token && STAFF_DASHBOARD_PATHS.some((p) => pathname.startsWith(p))) {
    if (!["admin", "superadmin", "staff"].includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ── POS auth guard ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard/pos")) {
    if (!token) {
      return NextResponse.redirect(new URL(`/auth/login?redirect=${pathname}`, request.url));
    }
    if (!POS_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static / _next/image
     *  - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
