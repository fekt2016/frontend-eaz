import ServiceDetail from "@/components/services/ServiceDetail";
import { serviceDetails } from "@/data/serviceDetails";
import { buildMetadata, truncate } from "@/lib/seo";

export function generateMetadata({ params }) {
  const service = serviceDetails.find((s) => s.slug === params.slug);
  if (!service) {
    return buildMetadata({
      title: "Service Not Found | EazWorld",
      description: "The service you were looking for could not be found.",
      path: `/services/${params.slug}`,
    });
  }
  return buildMetadata({
    title: `${service.title} | EazWorld`,
    description: truncate(service.description || service.tagline, 160),
    path: `/services/${params.slug}`,
  });
}

export default function ServiceDetailPage({ params }) {
  return <ServiceDetail slug={params.slug} />;
}
