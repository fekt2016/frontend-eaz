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
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';
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

  // ── Determine if the requester is an admin (bypass maintenance) ─────────────
  // Use jwtVerify (cryptographic) — jwtDecode does NOT verify the signature
  let isAdmin = false;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      isAdmin = payload?.role === "admin";
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

  if (pathname.startsWith("/dashboard/admin") && token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      if (payload?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/auth/login", request.url));
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
