"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DashboardShell from "../DashboardShell";

export default function CommerceLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAllowed = ["admin", "superadmin"].includes(user?.role);

  useEffect(() => {
    if (!loading && !isAllowed) router.replace("/dashboard");
  }, [loading, isAllowed, router]);

  if (loading || !isAllowed) return null;

  return <DashboardShell title="Marketplace">{children}</DashboardShell>;
}
