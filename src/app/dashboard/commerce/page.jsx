"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Truck, ClipboardList, Boxes } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const sections = [
  {
    href: "/dashboard/commerce/inventory",
    icon: Boxes,
    title: "Inventory",
    description: "Manage repair parts and shop products from one place.",
  },
  {
    href: "/dashboard/commerce/delivery-zones",
    icon: Truck,
    title: "Delivery Zones",
    description: "Define delivery fees and estimated times per zone.",
    adminOnly: true,
  },
  {
    href: "/dashboard/commerce/orders",
    icon: ClipboardList,
    title: "Orders",
    description: "Review and manage all shop orders.",
  },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  useEffect(() => {
    if (!authLoading && !["admin", "superadmin", "staff"].includes(user?.role)) router.replace("/dashboard");
  }, [user, authLoading, router]);

  if (authLoading || !["admin", "superadmin", "staff"].includes(user?.role)) return null;

  const visibleSections = sections.filter((s) => !s.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Marketplace</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your shop&apos;s products, inventory, and orders.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {visibleSections.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-gray-100 bg-paper p-5 hover:border-gray-300 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <p className="font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
