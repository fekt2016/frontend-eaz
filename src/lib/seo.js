const DEV_FALLBACK_URL = "http://localhost:3000";

// `FRONTEND_URL` is the single source of truth for canonical URLs, metadataBase,
// Open Graph URLs, sitemap.xml and robots.txt. A localhost default is convenient
// in development, but shipping it to production points every canonical tag, OG
// URL and sitemap entry at localhost with no runtime error to notice — search
// engines quietly drop the pages. So production refuses to build without it.
// Supply the value from the container environment, never here — it must be present
// at BOTH image-build time and run time (see .env.local.example).
function resolveSiteUrl() {
  const configured = process.env.FRONTEND_URL?.trim();
  // Trailing slashes would double up in `${SITE_URL}${path}` — normalize once here.
  if (configured) return configured.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FRONTEND_URL is not set. It is required for production builds: canonical " +
        "URLs, Open Graph tags, sitemap.xml and robots.txt would otherwise be " +
        `emitted as ${DEV_FALLBACK_URL}. Set FRONTEND_URL to the deployed origin ` +
        "(scheme + host, no trailing slash) in the deployment environment.",
    );
  }

  return DEV_FALLBACK_URL;
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "EazWorld";

export function truncate(str, max = 160) {
  if (!str) return "";
  const clean = String(str).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function buildMetadata({
  title,
  description,
  path = "/",
  type = "website",
  image,
}) {
  const url = `${SITE_URL}${path}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      ...(image
        ? { images: [{ url: image, width: 1200, height: 630, alt: title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function productJsonLd(product) {
  const image = product.images?.[0];
  const offers = {
    "@type": "Offer",
    priceCurrency: "GHS",
    price: (Number(product.price) || 0) / 100,
    availability:
      product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    url: `${SITE_URL}/shop/${product.slug}`,
  };
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(image ? { image: [image] } : {}),
    ...(product.description ? { description: product.description } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers,
  };
}

export function breadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
