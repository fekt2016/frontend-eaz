import CartPage from "@/components/cart/CartPage";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function CartRoute() {
  return <CartPage />;
}
