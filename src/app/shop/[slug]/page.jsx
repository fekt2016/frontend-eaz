import ProductDetail from "@/components/shop/ProductDetail";

export default function ShopProductPage({ params }) {
  const slug = params.slug;
  return <ProductDetail slug={slug} />;
}
