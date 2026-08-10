"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// The shared dashboard sidebar/shell comes from ../layout.jsx (DashboardShell).
// This layout only enforces the admin/superadmin role for /dashboard/admin/*.
export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAllowed = ["admin", "superadmin"].includes(user?.role);

  useEffect(() => {
    if (!loading && !isAllowed) router.replace("/dashboard");
  }, [loading, isAllowed, router]);

  if (loading || !isAllowed) return null;

  return children;
}
