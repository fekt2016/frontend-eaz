import ShopGrid from "@/components/shop/ShopGrid";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shop Phones & Accessories Online in Ghana | EazWorld",
  description:
    "Buy phones, cases, chargers, power banks, earphones, and screen protectors online in Ghana. Delivered fast, priced in Ghana cedis, secure Paystack checkout.",
  path: "/shop",
});

export default function ShopPage() {
  return <ShopGrid />;
}
