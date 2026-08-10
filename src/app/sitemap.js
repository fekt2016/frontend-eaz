const BASE_URL = "https://eazworld.com";

const staticRoutes = [
  { url: "/",                        priority: 1.0,  changeFrequency: "weekly" },
  { url: "/about",                   priority: 0.8,  changeFrequency: "monthly" },
  { url: "/services",                priority: 0.9,  changeFrequency: "monthly" },
  { url: "/services/web-design",     priority: 0.8,  changeFrequency: "monthly" },
  { url: "/services/seo",            priority: 0.8,  changeFrequency: "monthly" },
  { url: "/services/paid-ads",       priority: 0.8,  changeFrequency: "monthly" },
  { url: "/services/branding",       priority: 0.8,  changeFrequency: "monthly" },
  { url: "/services/social-media",   priority: 0.8,  changeFrequency: "monthly" },
  { url: "/services/email",          priority: 0.8,  changeFrequency: "monthly" },
  { url: "/services/phone-repair",   priority: 0.8,  changeFrequency: "monthly" },
  { url: "/portfolio",               priority: 0.7,  changeFrequency: "monthly" },
  { url: "/reviews",                 priority: 0.7,  changeFrequency: "weekly"  },
  { url: "/blog",                    priority: 0.8,  changeFrequency: "daily"   },
  { url: "/contact",                 priority: 0.8,  changeFrequency: "monthly" },
  { url: "/book-consultation",       priority: 0.9,  changeFrequency: "monthly" },
  { url: "/hosting",                 priority: 0.8,  changeFrequency: "monthly" },
  { url: "/domains",                 priority: 0.7,  changeFrequency: "monthly" },
  { url: "/resources",               priority: 0.5,  changeFrequency: "monthly" },
  { url: "/visit-us",                priority: 0.5,  changeFrequency: "monthly" },
  { url: "/privacy",                 priority: 0.3,  changeFrequency: "yearly"  },
  { url: "/terms",                   priority: 0.3,  changeFrequency: "yearly"  },
];

async function getBlogPosts() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/posts`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const posts = await getBlogPosts();

  const staticEntries = staticRoutes.map(({ url, priority, changeFrequency }) => ({
    url: `${BASE_URL}${url}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const blogEntries = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
