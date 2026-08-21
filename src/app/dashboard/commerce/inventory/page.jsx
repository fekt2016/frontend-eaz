"use client";

// T24: Marketplace and Inventory merged into one page — /dashboard/commerce
// now renders inventory directly. Kept as a redirect (mirrors the existing
// /dashboard/commerce/products → /dashboard/commerce/inventory shim in this
// same directory) so old links/bookmarks still land somewhere useful.
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function InventoryRedirect() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && ["admin", "superadmin", "staff"].includes(user?.role)) {
      router.replace("/dashboard/commerce");
    }
  }, [user, authLoading, router]);

  return null;
}
