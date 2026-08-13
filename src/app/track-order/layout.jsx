import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Track Your Order | EazWorld",
  description:
    "Track your EazWorld order status using your order number and phone number.",
  path: "/track-order",
});

export default function TrackOrderLayout({ children }) {
  return children;
}
