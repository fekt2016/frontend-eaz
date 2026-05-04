"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/hosting", label: "Hosting" },
  { href: "/domains", label: "Domains" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  if (pathname?.startsWith("/auth")) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl text-gray-900">
          Eaz<span className="text-amber-500">World</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition ${
                pathname === href ? "text-amber-500" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition">
                <FaUserCircle size={16} className="text-amber-500" />
                {user.name.split(" ")[0]}
              </Link>
              <button onClick={handleLogout} className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                Sign In
              </Link>
              <Link href="/book-consultation" className="text-sm font-medium px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                Book a Call
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block py-2.5 text-sm font-medium border-b border-gray-50 last:border-0 ${
                pathname === href ? "text-amber-500" : "text-gray-700"
              }`}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" className="block py-2.5 text-sm font-medium text-gray-700 border-b border-gray-50" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
              <button onClick={() => { handleLogout(); setOpen(false); }} className="block w-full text-left py-2.5 text-sm font-medium text-gray-700">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block py-2.5 text-sm font-medium text-gray-700 border-b border-gray-50" onClick={() => setOpen(false)}>
                Sign In
              </Link>
              <Link href="/book-consultation" className="block mt-3 text-center py-3 rounded-full bg-gray-900 text-white text-sm font-medium" onClick={() => setOpen(false)}>
                Book a Free Consultation
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
