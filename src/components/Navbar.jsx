"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { FaBars, FaTimes, FaUserCircle, FaChevronDown, FaShoppingCart } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import ThemeToggle from "@/components/ThemeToggle";

const serviceLinks = [
  { href: "/services/web-design",   label: "Web Design & Dev",   icon: "🌐", desc: "Websites & web apps" },
  { href: "/services/seo",          label: "SEO & Content",       icon: "📈", desc: "Rank higher on Google" },
  { href: "/services/paid-ads",     label: "Paid Advertising",    icon: "🎯", desc: "Facebook & Google ads" },
  { href: "/services/branding",     label: "Branding & Identity", icon: "✨", desc: "Logo & brand design" },
  { href: "/services/social-media", label: "Social Media",        icon: "📱", desc: "Grow your audience" },
  { href: "/services/email",        label: "Email Marketing",     icon: "📧", desc: "Campaigns & automation" },
  { href: "/services/phone-repair", label: "Phone Repair",        icon: "🔧", desc: "iPhone, Samsung & more" },
  { href: "/hosting",               label: "Web Hosting",         icon: "☁️", desc: "Fast & managed hosting" },
  { href: "/domains",               label: "Domain Registration", icon: "🔗", desc: "Find your .com or .gh" },
];

const topLinks = [
  { href: "/",          label: "Home" },
  { href: "/shop",      label: "Shop" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/reviews",   label: "Reviews" },
  { href: "/blog",      label: "Blog" },
  { href: "/contact",   label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const { user, logout } = useAuth();
  const { count, openCart } = useCart();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setServicesOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/auth")) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isServiceActive = serviceLinks.some((s) => pathname === s.href) || pathname === "/services";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center" aria-label="EazWorld home">
          <Image
            src="/logo.png"
            alt="EazWorld"
            width={512}
            height={440}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">

          {/* Home */}
          <Link href="/" className={`text-sm font-medium transition ${pathname === "/" ? "text-brand-500" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"}`}>
            Home
          </Link>

          {/* Services dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setServicesOpen((v) => !v)}
              className={`flex items-center gap-1 text-sm font-medium transition ${isServiceActive ? "text-brand-500" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"}`}
            >
              Services
              <FaChevronDown size={10} className={`transition-transform duration-200 ${servicesOpen ? "rotate-180" : ""}`} />
            </button>

            {servicesOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[520px] bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl p-4">
                {/* Arrow */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-l border-t border-gray-100 dark:border-slate-800 rotate-45" />

                <div className="grid grid-cols-3 gap-1 mb-3">
                  {serviceLinks.map(({ href, label, icon, desc }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-start gap-2.5 p-3 rounded-xl transition group ${
                        pathname === href
                          ? "bg-brand-50 dark:bg-brand-900/20"
                          : "hover:bg-paper dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-lg leading-none mt-0.5 flex-shrink-0">{icon}</span>
                      <div>
                        <p className={`text-xs font-semibold leading-tight ${pathname === href ? "text-brand-600 dark:text-brand-400" : "text-gray-900 dark:text-white group-hover:text-gray-900 dark:group-hover:text-white"}`}>
                          {label}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 leading-tight">{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Footer row */}
                <div className="border-t border-gray-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                  <Link href="/services" className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white transition">
                    View all services →
                  </Link>
                  <Link href="/book-consultation" className="text-xs font-semibold px-4 py-1.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
                    Book Free Consultation
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Other top links */}
          {topLinks.slice(1).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition ${
                pathname === href ? "text-brand-500" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Cart */}
          <button
            type="button"
            onClick={openCart}
            className="relative p-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
            aria-label="Open cart"
          >
            <FaShoppingCart size={18} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition">
                <FaUserCircle size={16} className="text-brand-500" />
                {user.name.split(" ")[0]}
              </Link>
              <button onClick={handleLogout} className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400 dark:hover:border-slate-500 hover:text-gray-900 dark:hover:text-white transition">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">
                Sign In
              </Link>
              <Link href="/book-consultation" className="text-sm font-medium px-4 py-2 rounded-full bg-gray-900 dark:bg-brand-500 text-white hover:bg-gray-700 dark:hover:bg-brand-400 transition">
                Book a Call
              </Link>
            </div>
          )}

          <ThemeToggle />
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={openCart}
            className="relative p-2 text-gray-600 dark:text-slate-400"
            aria-label="Open cart"
          >
            <FaShoppingCart size={18} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <ThemeToggle />
          <button
            type="button"
            className="p-2 text-gray-600 dark:text-slate-400"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-0.5">

          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-slate-800"
            >
              <span className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</span>
                <span className="block text-xs text-gray-400 dark:text-slate-500">Go to Dashboard</span>
              </span>
            </Link>
          )}

          <Link href="/" className={`block py-2.5 text-sm font-medium border-b border-gray-50 dark:border-slate-800 ${pathname === "/" ? "text-brand-500" : "text-gray-700 dark:text-slate-300"}`} onClick={() => setMobileOpen(false)}>
            Home
          </Link>

          {/* Mobile Services accordion */}
          <div className="border-b border-gray-50 dark:border-slate-800">
            <button
              onClick={() => setMobileServicesOpen((v) => !v)}
              className={`flex items-center justify-between w-full py-2.5 text-sm font-medium ${isServiceActive ? "text-brand-500" : "text-gray-700 dark:text-slate-300"}`}
            >
              Services
              <FaChevronDown size={10} className={`transition-transform duration-200 ${mobileServicesOpen ? "rotate-180" : ""}`} />
            </button>

            {mobileServicesOpen && (
              <div className="pb-2 space-y-0.5 pl-2">
                {serviceLinks.map(({ href, label, icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 py-2 text-sm ${pathname === href ? "text-brand-500 font-medium" : "text-gray-600 dark:text-slate-400"}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="text-base w-5 text-center">{icon}</span>
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {topLinks.slice(1).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block py-2.5 text-sm font-medium border-b border-gray-50 dark:border-slate-800 last:border-0 ${pathname === href ? "text-brand-500" : "text-gray-700 dark:text-slate-300"}`}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}

          {user ? (
            <>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block w-full text-left py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 border-b border-gray-50 dark:border-slate-800" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link href="/book-consultation" className="block mt-3 text-center py-3 rounded-full bg-gray-900 dark:bg-brand-500 text-white text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Book a Free Consultation
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
