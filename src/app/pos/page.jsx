"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PosRoot() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth/login?redirect=/pos"); return; }
    if (user.role === "technician" || user.role === "admin") {
      router.replace("/pos/technician");
    } else if (user.role === "cashier") {
      router.replace("/pos/sell");
    } else {
      router.replace("/pos/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-slate-700 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );
}
