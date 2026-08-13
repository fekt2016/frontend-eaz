import BlogListing from "@/components/blog/BlogListing";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "The EazWorld Blog | SEO, Web Design & Digital Marketing Guides",
  description:
    "Practical guides, case studies, and insights on digital marketing, web design, SEO, and growing your business online in Ghana.",
  path: "/blog",
});

export default function BlogPage() {
  return <BlogListing />;
}
