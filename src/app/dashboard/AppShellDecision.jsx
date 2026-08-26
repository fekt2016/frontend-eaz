"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "./DashboardShell";
import { titleForPath } from "./dashboardNav";

export default function AppShellDecision({ children }) {
  const pathname = usePathname();

  // POS and Commerce ship their own shells — don't double-wrap.
  if (pathname.startsWith("/dashboard/pos") || pathname.startsWith("/dashboard/commerce")) return children;

  // Resolve the route's real name from dashboardNav, so the topbar <h1> says
  // "Shop Orders" / "Hosting" / "Settings" instead of "Dashboard" everywhere.
  return <DashboardShell title={titleForPath(pathname)}>{children}</DashboardShell>;
}
