import PortfolioDetail from "@/components/portfolio/PortfolioDetail";
import { PROJECTS } from "@/data/portfolioData";
import { buildMetadata, truncate } from "@/lib/seo";

export function generateMetadata({ params }) {
  const project = PROJECTS.find((p) => p.slug === params.slug);
  if (!project) {
    return buildMetadata({
      title: "Project Not Found | EazWorld",
      description: "The portfolio project you were looking for could not be found.",
      path: `/portfolio/${params.slug}`,
    });
  }
  const image = project.heroImage || project.thumbnail;
  return buildMetadata({
    title: `${project.title} — Case Study | EazWorld`,
    description: truncate(
      project.caseStudy?.overview || project.shortDesc,
      160,
    ),
    path: `/portfolio/${params.slug}`,
    image,
  });
}

export default function PortfolioDetailPage({ params }) {
  return <PortfolioDetail slug={params.slug} />;
}
