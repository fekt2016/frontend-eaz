import { notFound } from "next/navigation";
import ProductDetail from "@/components/shop/ProductDetail";
import JsonLd from "@/components/common/JsonLd";
import { getProductBySlug } from "@/lib/products";
import { buildMetadata, truncate, productJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/seo";

export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }
  const image = product.images?.[0];
  return buildMetadata({
    title: `${product.name} | Buy Online in Ghana – EazWorld`,
    description: truncate(product.description, 155) || `${product.name} — buy online in Ghana at EazWorld. Fast delivery, secure Paystack checkout.`,
    path: `/shop/${product.slug}`,
    type: "website",
    image,
  });
}

export default async function ShopProductPage({ params }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const jsonLd = [
    productJsonLd(product),
    breadcrumbJsonLd([
      { name: "Home", url: SITE_URL },
      { name: "Shop", url: `${SITE_URL}/shop` },
      { name: product.name, url: `${SITE_URL}/shop/${product.slug}` },
    ]),
  ];

  return (
    <>
      {jsonLd.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <ProductDetail slug={params.slug} />
    </>
  );
}