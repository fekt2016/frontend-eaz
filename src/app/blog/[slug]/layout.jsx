const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eazworld.com";

async function getPost(slug) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/posts/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: "Post Not Found | EazWorld Blog",
      description: "This blog post could not be found.",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${BASE_URL}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author || "EazWorld Team"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    alternates: { canonical: `${BASE_URL}/blog/${post.slug}` },
  };
}

export default function BlogSlugLayout({ children }) {
  return children;
}
