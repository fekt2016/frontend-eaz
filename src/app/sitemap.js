import { getAllProducts } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/services", changeFrequency: "weekly", priority: 0.8 },
  { path: "/services/web-design", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/seo", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/paid-ads", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/branding", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/social-media", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/email", changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/phone-repair", changeFrequency: "weekly", priority: 0.7 },
  { path: "/hosting", changeFrequency: "weekly", priority: 0.8 },
  { path: "/domains", changeFrequency: "weekly", priority: 0.8 },
  { path: "/portfolio", changeFrequency: "weekly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/reviews", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/resources", changeFrequency: "monthly", priority: 0.5 },
  { path: "/book-consultation", changeFrequency: "monthly", priority: 0.5 },
  { path: "/visit-us", changeFrequency: "monthly", priority: 0.5 },
  { path: "/seo", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/track-order", changeFrequency: "monthly", priority: 0.2 },
];

const CATEGORIES = [
  "Phones",
  "Phone Cases & Covers",
  "Chargers & Cables",
  "Power Banks",
  "Earphones & Headphones",
  "Screen Protectors",
];

async function getBlogPosts() {
  try {
    const res = await fetch(`${SITE_URL}/api/v1/posts`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const staticEntries = STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  const posts = await getBlogPosts();
  const blogEntries = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const products = await getAllProducts();
  const productEntries = products.map((product) => ({
    url: `${SITE_URL}/shop/${product.slug}`,
    lastModified: product.updatedAt || product.createdAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const categoryEntries = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/shop/category/${encodeURIComponent(category)}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...blogEntries];
}
