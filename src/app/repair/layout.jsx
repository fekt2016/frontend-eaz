import { SITE_URL } from "@/lib/seo";

// The booking form, distinct from the /services/phone-repair marketing page — the
// title targets booking intent so the two don't compete for the same query.
// No "| EazWorld" here: the root layout's `%s | EazWorld` template appends it.
export const metadata = {
  title: "Book a Device Repair in Accra",
  description: "Book a phone, tablet or laptop repair in Accra in two minutes. Bring your device to the shop or send a rider to collect it. Free assessment, you approve the quote before any work starts, 30-day warranty.",
  keywords: ["book phone repair Accra", "laptop repair Accra", "tablet repair Ghana", "device pickup repair Accra"],
  openGraph: { title: "Book a Device Repair | EazWorld", description: "Phone, tablet and laptop repairs in Accra — walk in or send a rider. Free assessment and a 30-day warranty.", url: `${SITE_URL}/repair` },
  alternates: { canonical: `${SITE_URL}/repair` },
};
export default function RepairLayout({ children }) { return children; }
