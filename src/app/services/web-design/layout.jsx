import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Web Design Pricing — Accra, Ghana",
  description:
    "Transparent web design pricing in Accra, Ghana. Landing pages from GHS 800 and business websites from GHS 2,500. Mobile-first, fast, conversion-focused websites.",
  openGraph: {
    title: "Web Design Pricing | EazWorld",
    description: "Landing pages from GHS 800, business websites from GHS 2,500 — Accra, Ghana.",
    url: `${SITE_URL}/services/web-design`,
  },
  alternates: { canonical: `${SITE_URL}/services/web-design` },
};

export default function WebDesignLayout({ children }) {
  return children;
}
