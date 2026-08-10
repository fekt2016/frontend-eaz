"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/commerce/products", label: "Products" },
  { href: "/commerce/delivery-zones", label: "Delivery Zones" },
  { href: "/commerce/orders", label: "Orders" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition">
        ← Back to Dashboard
      </Link>
      <div className="flex gap-2 ml-auto">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                active
                  ? "bg-gray-900 text-white"
                  : "border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
