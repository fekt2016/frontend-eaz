"use client";

import { useAuth } from "@/context/AuthContext";
import DashboardHosting from "./DashboardHosting";
import DashboardDomains from "./DashboardDomains";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-24">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">Account</p>
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-1">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-gray-500 mb-10">Manage your orders and account from here.</p>

        {user?.role === "admin" && (
          <div className="mb-8 p-4 rounded-2xl border border-amber-100 bg-amber-50 flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">You have admin access</p>
            <Link href="/dashboard/admin/hosting" className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition">
              View all orders →
            </Link>
          </div>
        )}

        <DashboardHosting />
        <DashboardDomains />
      </div>
    </div>
  );
}
