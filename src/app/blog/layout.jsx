import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Blog | EazWorld — Digital Marketing & Web Design Insights",
  description: "Practical guides, case studies and tips on web design, SEO, branding and digital marketing for businesses in Ghana.",
  openGraph: { title: "Blog | EazWorld", description: "Practical digital marketing and web design guides for Ghanaian businesses.", url: `${SITE_URL}/blog` },
  alternates: { canonical: `${SITE_URL}/blog` },
};
export default function BlogLayout({ children }) { return children; }
