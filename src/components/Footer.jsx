import Link from "next/link";
import Image from "next/image";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { MapPin, Phone } from "lucide-react";

const columns = [
  {
    title: "Services",
    links: [
      { href: "/services/web-design", label: "Web Design" },
      { href: "/hosting", label: "Web Hosting" },
      { href: "/domains", label: "Domains" },
      { href: "/services/seo", label: "SEO" },
      { href: "/services/phone-repair", label: "Phone Repair" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/reviews", label: "Reviews" },
      { href: "/blog", label: "Blog" },
      { href: "/resources", label: "Free Resources" },
      { href: "/visit-us", label: "Visit Us" },
    ],
  },
  {
    title: "Work With Us",
    links: [
      { href: "/book-consultation", label: "Book Consultation" },
      { href: "/contact", label: "Contact Us" },
      { href: "/auth/login", label: "Client Login" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

const social = [
  { Icon: FaFacebook, href: "#", label: "Facebook" },
  { Icon: FaTwitter, href: "#", label: "Twitter" },
  { Icon: FaInstagram, href: "#", label: "Instagram" },
  { Icon: FaLinkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="bg-paper dark:bg-ink border-t border-gray-100 dark:border-slate-800 text-gray-900 dark:text-slate-100 transition-colors">
      <div className="h-0.5 w-full flex" aria-hidden="true">
        <span className="flex-1 bg-star-red" />
        <span className="flex-1 bg-star-gold" />
        <span className="flex-1 bg-star-green" />
      </div>
      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="inline-block" aria-label="EazWorld home">
            <Image
              src="/logo.png"
              alt="EazWorld"
              width={512}
              height={440}
              className="h-10 w-auto"
            />
          </Link>
          <p className="text-gray-500 dark:text-slate-400 mt-3 text-sm leading-relaxed">
            Premium digital agency in Accra, Ghana. Web design, hosting, domains, and phone repair.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400">
              <MapPin className="text-brand-500 mt-0.5 flex-shrink-0" size={11} />
              <span>E1/12 Nima, Alwaleed bin Talal Highway, Nima, Accra</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
              <Phone className="text-brand-500 flex-shrink-0" size={11} />
              <a href="tel:+233244388190" className="hover:text-gray-900 dark:hover:text-white transition">+233 24 438 8190</a>
            </div>
            <a
              href="https://wa.me/233244388190"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
            >
              <FaWhatsapp size={13} />
              WhatsApp Us
            </a>
          </div>
          <div className="flex gap-3 mt-5">
            {social.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-full border border-gray-200 dark:border-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-slate-500 transition"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400 mb-4">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white text-sm transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 dark:border-slate-800">
        {/* Our Network */}
        <div className="max-w-6xl mx-auto px-4 pt-5 pb-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-5 border-b border-gray-100 dark:border-slate-800">
          <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wider whitespace-nowrap">Our Network:</span>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1">
            {[
              { href: "https://saiisai.com", label: "saiisai.com" },
              { href: "https://worldstargh.com", label: "worldstargh.com" },
              { href: "https://jmlogisticsgh.com", label: "jmlogisticsgh.com" },
              { href: "https://giwainvestment.com", label: "giwainvestment.com" },
            ].map(({ href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 dark:text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 transition"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
        {/* Copyright */}
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-slate-500">
          <span>© {new Date().getFullYear()} EazWorld. All rights reserved. Made in Accra, Ghana.</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-slate-300 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
