"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProductsRedirect() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && ["admin", "superadmin", "staff"].includes(user?.role)) {
      router.replace("/dashboard/commerce");
    }
  }, [user, authLoading, router]);

  return null;
}
