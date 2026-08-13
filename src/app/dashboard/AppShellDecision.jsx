"use client";

import { usePathname } from "next/navigation";
import DashboardShell from "./DashboardShell";

export default function AppShellDecision({ children }) {
  const pathname = usePathname();

  // POS and Commerce ship their own shells — don't double-wrap.
  if (pathname.startsWith("/dashboard/pos") || pathname.startsWith("/dashboard/commerce")) return children;

  return <DashboardShell>{children}</DashboardShell>;
}
