import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

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
    <footer className="bg-gray-50 border-t border-gray-100 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Link href="/" className="font-display font-bold text-xl text-gray-900">
            Eaz<span className="text-amber-500">World</span>
          </Link>
          <p className="text-gray-500 mt-3 text-sm leading-relaxed">
            Premium digital agency in Accra, Ghana. Web design, hosting, domains, and phone repair.
          </p>
          <div className="flex gap-3 mt-5">
            {social.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-400 transition"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-gray-600 hover:text-gray-900 text-sm transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>© {new Date().getFullYear()} EazWorld. All rights reserved. Made in Accra, Ghana.</span>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-gray-700 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
