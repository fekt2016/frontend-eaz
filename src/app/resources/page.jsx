import ResourcesListing from "@/components/resources/ResourcesListing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Free Resources, Guides & Templates | EazWorld",
  description:
    "Free checklists, guides, and templates for Ghanaian businesses — SEO checklists, website briefs, marketing budgets, and more.",
  path: "/resources",
});

export default function ResourcesPage() {
  return <ResourcesListing />;
}
