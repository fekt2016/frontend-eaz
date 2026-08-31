import { SITE_URL } from "@/lib/seo";

export const metadata = {
  // T104 — `absolute` rather than trimming: the tail is real keywords worth
  // keeping, and the template would otherwise append a second "| EazWorld".
  title: { absolute: "Client Reviews | EazWorld — Digital Agency Accra, Ghana" },
  description: "Read real reviews from EazWorld clients across Accra and Ghana. See what businesses say about our web design, SEO, branding and phone repair services.",
  openGraph: { title: "Client Reviews | EazWorld", description: "Real feedback from real clients. Web design, SEO, branding and phone repair in Accra, Ghana.", url: `${SITE_URL}/reviews` },
  alternates: { canonical: `${SITE_URL}/reviews` },
};
export default function ReviewsLayout({ children }) { return children; }
