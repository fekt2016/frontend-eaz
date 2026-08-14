import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Domain Registration | EazWorld — Register .com, .org, .gh Domains",
  description: "Register your domain name in Ghana. .com, .org, .net and .gh domains available. Fast, affordable domain registration with free DNS management.",
  openGraph: { title: "Domain Registration | EazWorld", description: "Register .com, .org, .net and .gh domains in Ghana. Affordable pricing, fast setup.", url: `${SITE_URL}/domains` },
  alternates: { canonical: `${SITE_URL}/domains` },
};
export default function DomainsLayout({ children }) { return children; }
