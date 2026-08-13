import BookConsultation from "@/components/book-consultation/BookConsultation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Book a Free Consultation | EazWorld",
  description:
    "Book a free 30-minute consultation with EazWorld in Accra, Ghana. Honest advice on web design, SEO, branding, and digital growth — no obligation.",
  path: "/book-consultation",
});

export default function BookConsultationPage() {
  return <BookConsultation />;
}
