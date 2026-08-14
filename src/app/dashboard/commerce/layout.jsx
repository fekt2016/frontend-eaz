"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "../DashboardShell";

export default function CommerceLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Staff use the marketplace for shop orders; admin-only subpages are
  // gated server-side in middleware.js and self-gated in their pages.
  const isAllowed = ["admin", "superadmin", "staff"].includes(user?.role);

  useEffect(() => {
    if (!loading && !isAllowed) router.replace("/dashboard");
  }, [loading, isAllowed, router]);

  if (loading || !isAllowed) return null;

  return <DashboardShell title="Marketplace">{children}</DashboardShell>;
}