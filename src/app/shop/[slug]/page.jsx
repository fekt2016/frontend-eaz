import ProductDetail from "@/components/shop/ProductDetail";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eazworld.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

async function getProduct(slug) {
  try {
    // Server-to-server fetch to the backend (no CORS/mixed-content concerns).
    const res = await fetch(`${API_BASE}/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: "Product | EazWorld Shop",
      description: "This product could not be found.",
    };
  }

  const title = `${product.name} — EazWorld Shop`;
  const description = product.description || `Buy ${product.name} at EazWorld — secure payment, fast delivery in Ghana.`;
  const image = product.images?.[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/shop/${params.slug}`,
      type: "website",
      images: image ? [{ url: image, width: 800, height: 800, alt: product.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: { canonical: `${BASE_URL}/shop/${params.slug}` },
  };
}

export default function ShopProductPage({ params }) {
  const slug = params.slug;
  return <ProductDetail slug={slug} />;
}
