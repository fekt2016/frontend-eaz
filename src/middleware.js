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
    const res  = await fetch(`${apiBase}/api/v1/settings`, { cache: 'no-store' });
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

  // ── Always allow: static assets, Next internals, API proxy
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")             // static files (.ico, .png, .svg …)
  ) {
    return NextResponse.next();
  }

  // ── Verify token and extract role ──────────────────────────────────────────
  const ADMIN_ROLES    = ["admin", "superadmin"];
  const POS_ROLES      = ["superadmin", "admin", "staff", "cashier", "technician"];
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
    "/dashboard/commerce",
  ];
  if (token && ADMIN_DASHBOARD_PATHS.some((p) => pathname.startsWith(p))) {
    if (!ADMIN_ROLES.includes(userRole)) {
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
