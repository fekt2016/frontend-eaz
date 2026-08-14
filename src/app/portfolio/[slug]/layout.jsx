import { PROJECTS } from "@/data/portfolioData";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const project = PROJECTS.find((p) => p.slug === params.slug);

  if (!project) {
    return {
      title: "Project Not Found | EazWorld Portfolio",
      description: "This case study could not be found.",
    };
  }

  const description = project.caseStudy?.overview || `${project.title} — a project by EazWorld Digital Agency, Accra.`;

  return {
    title: `${project.title} | EazWorld Portfolio`,
    description,
    openGraph: {
      title: `${project.title} | EazWorld Case Study`,
      description,
      url: `${SITE_URL}/portfolio/${project.slug}`,
      type: "article",
      images: project.image
        ? [{ url: project.image, width: 1200, height: 630, alt: project.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | EazWorld Case Study`,
      description,
    },
    alternates: { canonical: `${SITE_URL}/portfolio/${project.slug}` },
  };
}

export default function PortfolioSlugLayout({ children }) {
  return children;
}
