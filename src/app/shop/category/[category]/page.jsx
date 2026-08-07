import ShopGrid from "@/components/shop/ShopGrid";

export default function ShopCategoryPage({ params }) {
  let category = params.category;
  try {
    category = decodeURIComponent(category);
  } catch {
    // Malformed percent-encoding — fall back to the raw segment.
  }
  return <ShopGrid activeCategory={category} />;
}
