import { serviceDetails } from "@/data/serviceDetails";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const service = serviceDetails.find((s) => s.slug === params.slug);

  if (!service) {
    return {
      title: "Service | EazWorld",
      description: "This service could not be found.",
    };
  }

  return {
    title: `${service.title} — Accra, Ghana`,
    description: service.tagline || service.description,
    openGraph: {
      title: `${service.title} | EazWorld`,
      description: service.tagline || service.description,
      url: `${SITE_URL}/services/${service.slug}`,
      type: "website",
    },
    alternates: { canonical: `${SITE_URL}/services/${service.slug}` },
  };
}

export default function ServiceSlugLayout({ children }) {
  return children;
}
