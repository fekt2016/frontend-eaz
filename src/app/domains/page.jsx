import DomainsSearch from "@/components/domains/DomainsSearch";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Domain Name Search & Registration | EazWorld",
  description:
    "Search and register domain names for your Ghanaian business. Compare .com, .com.gh, .africa and more with live pricing from EazWorld.",
  path: "/domains",
});

export default function DomainsPage() {
  return <DomainsSearch />;
}
