import DomainsSearch from "@/components/domains/DomainsSearch";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Domain Name Search & Registration | EazWorld",
  // T65: .com.gh / .gh / .africa need ghNIC accreditation our registrar doesn't
  // hold, so they can't be checked out here — naming them in the SEO copy only
  // lands people on a search that will refuse them.
  description:
    "Search and register domain names for your Ghanaian business. Compare .com, .net, .org, .io and more with live cedi pricing from EazWorld.",
  path: "/domains",
});

export default function DomainsPage() {
  return <DomainsSearch />;
}
