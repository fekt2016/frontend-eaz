import { serviceDetails } from "@/data/serviceDetails";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eazworld.com";

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
      url: `${BASE_URL}/services/${service.slug}`,
      type: "website",
    },
    alternates: { canonical: `${BASE_URL}/services/${service.slug}` },
  };
}

export default function ServiceSlugLayout({ children }) {
  return children;
}
