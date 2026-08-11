import ShopGrid from "@/components/shop/ShopGrid";

function cleanCategory(raw) {
  try {
    return decodeURIComponent(raw || "").replace(/[-_]/g, " ").trim() || raw;
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }) {
  const category = cleanCategory(params.category);
  const title = `${category} — EazWorld Shop`;
  const description = `Browse ${category} at the EazWorld shop. Phones, accessories and repair parts with secure Paystack payments and fast delivery across Ghana.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://eazworld.com/shop/category/${encodeURIComponent(params.category)}`,
    },
  };
}

export default function ShopCategoryPage({ params }) {
  const category = cleanCategory(params.category);
  return <ShopGrid activeCategory={category} />;
}
