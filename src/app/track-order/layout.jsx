import { SITE_URL } from "@/lib/seo";

// Transactional: kept out of the index, but it still needs its own canonical —
// it was inheriting the root's, which told crawlers this page *is* the homepage.
export const metadata = {
  title: "Track Your Order",
  description: "Look up an EazWorld order with your tracking number to see its current status and delivery history.",
  alternates: { canonical: `${SITE_URL}/track-order` },
  robots: { index: false, follow: true },
};

export default function TrackOrderLayout({ children }) {
  return children;
}
