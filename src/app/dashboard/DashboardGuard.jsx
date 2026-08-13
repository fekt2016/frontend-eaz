"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const Spinner = () => (
  <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 dark:border-slate-600 dark:border-t-brand-400 rounded-full animate-spin" />
  </div>
);

export default function DashboardGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setRedirecting(true);
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  // Show spinner while auth loads OR while redirect is in flight (prevents blank flash)
  if (loading || redirecting) return <Spinner />;

  if (!user) return <Spinner />;

  return children;
}
