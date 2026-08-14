import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Portfolio | EazWorld — Web Design & Digital Projects in Ghana",
  description: "Browse EazWorld's portfolio of web design, e-commerce, logistics and real estate projects built for businesses in Accra and across Ghana.",
  openGraph: { title: "Portfolio | EazWorld", description: "Web design, e-commerce, logistics and real estate projects from EazWorld — Accra, Ghana.", url: `${SITE_URL}/portfolio` },
  alternates: { canonical: `${SITE_URL}/portfolio` },
};
export default function PortfolioLayout({ children }) { return children; }
