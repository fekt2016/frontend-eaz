import PortfolioListing from "@/components/portfolio/PortfolioListing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Portfolio & Case Studies | EazWorld",
  description:
    "Explore 50+ web design, e-commerce, branding, and SEO projects delivered by EazWorld for African businesses — with measurable results.",
  path: "/portfolio",
});

export default function PortfolioPage() {
  return <PortfolioListing />;
}
