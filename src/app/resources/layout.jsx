import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Free Resources — SEO Checklists, Templates & Guides",
  description:
    "Free checklists, templates and guides for Ghanaian businesses — SEO checklists, website project briefs, digital marketing budget guides and more.",
  openGraph: {
    title: "Free Resources | EazWorld",
    description: "Practical SEO checklists, templates and guides for Ghanaian businesses.",
    url: `${SITE_URL}/resources`,
  },
  alternates: { canonical: `${SITE_URL}/resources` },
};

export default function ResourcesLayout({ children }) {
  return children;
}
