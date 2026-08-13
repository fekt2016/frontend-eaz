import PhoneRepair from "@/components/services/PhoneRepair";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Phone Repair in Accra, Ghana | EazWorld",
  description:
    "Fast, reliable phone repair in Accra — screen, battery, charging port, water damage, and board-level repairs. 30-day warranty, walk-ins welcome.",
  path: "/services/phone-repair",
});

export default function PhoneRepairPage() {
  return <PhoneRepair />;
}
