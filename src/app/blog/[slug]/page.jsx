import BlogArticle from "@/components/blog/BlogArticle";
import { posts } from "@/content/blog/posts";
import { buildMetadata, truncate } from "@/lib/seo";

export function generateMetadata({ params }) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) {
    return buildMetadata({
      title: "Article Not Found | EazWorld",
      description: "The blog article you were looking for could not be found.",
      path: `/blog/${params.slug}`,
      type: "article",
    });
  }
  return buildMetadata({
    title: `${post.title} | EazWorld Blog`,
    description: truncate(post.excerpt, 160),
    path: `/blog/${params.slug}`,
    type: "article",
  });
}

export default function BlogArticlePage({ params }) {
  return <BlogArticle slug={params.slug} />;
}
