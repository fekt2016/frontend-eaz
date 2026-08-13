import ShopGrid from "@/components/shop/ShopGrid";
import JsonLd from "@/components/common/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/seo";

function decodeCategory(raw) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function generateMetadata({ params }) {
  const category = decodeCategory(params.category);
  return buildMetadata({
    title: `${category} — Buy Online in Ghana | EazWorld Shop`,
    description: `Shop ${category} online in Ghana at EazWorld — great prices, genuine products, fast delivery, and secure Paystack checkout.`,
    path: `/shop/category/${encodeURIComponent(category)}`,
  });
}

export default function ShopCategoryPage({ params }) {
  const category = decodeCategory(params.category);
  const jsonLd = breadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: "Shop", url: `${SITE_URL}/shop` },
    { name: category, url: `${SITE_URL}/shop/category/${encodeURIComponent(category)}` },
  ]);
  return (
    <>
      <JsonLd data={jsonLd} />
      <ShopGrid activeCategory={category} />
    </>
  );
}
