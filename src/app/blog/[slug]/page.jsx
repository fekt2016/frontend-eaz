import BlogArticle from "@/components/blog/BlogArticle";
import { buildMetadata, truncate } from "@/lib/seo";

async function getPost(slug) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/posts/${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata(props) {
  const params = await props.params;
  const post = await getPost(params.slug);
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

export default async function BlogArticlePage(props) {
  const params = await props.params;
  return <BlogArticle slug={params.slug} />;
}