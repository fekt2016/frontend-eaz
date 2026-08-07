"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FaBoxOpen, FaTruckFast, FaClipboardList } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";

const sections = [
  {
    href: "/admin/products",
    icon: FaBoxOpen,
    title: "Products",
    description: "Create, edit, and manage shop products.",
  },
  {
    href: "/admin/delivery-zones",
    icon: FaTruckFast,
    title: "Delivery Zones",
    description: "Define delivery fees and estimated times per zone.",
  },
  {
    href: "/admin/orders",
    icon: FaClipboardList,
    title: "Orders",
    description: "Review and manage all shop orders.",
  },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  if (authLoading || user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-4xl">
        <AdminNav />
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Admin</h1>
        <p className="text-gray-500 text-sm mb-8">Manage your shop&apos;s products, delivery zones, and orders.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sections.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-5 hover:border-gray-300 transition"
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
