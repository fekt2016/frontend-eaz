import ShopGrid from "@/components/shop/ShopGrid";

export const metadata = {
  title: "Shop — Phones, Accessories & Repair Parts in Ghana",
  description:
    "Buy phones, accessories and genuine phone repair parts online from EazWorld in Accra, Ghana. Secure Paystack payments, fast delivery, in-store pickup.",
  openGraph: {
    title: "Shop | EazWorld",
    description: "Phones, accessories and phone repair parts from EazWorld, Accra, Ghana.",
    url: "https://eazworld.com/shop",
  },
  alternates: { canonical: "https://eazworld.com/shop" },
};

export default function ShopPage() {
  return <ShopGrid />;
}
