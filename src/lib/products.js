const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

async function getJSON(path, fallback, revalidate) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...(revalidate ? { next: { revalidate } } : { cache: "no-store" }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    return data || fallback;
  } catch {
    return fallback;
  }
}

export async function getProductBySlug(slug) {
  const data = await getJSON(`/products/${encodeURIComponent(slug)}`, {});
  return data?.success ? data.data : null;
}

const MAX_PRODUCT_PAGE_SIZE = 60;
const MAX_PRODUCT_PAGES = 50;

export async function getAllProducts({ revalidate = 3600 } = {}) {
  const seen = new Map();
  for (let page = 1; page <= MAX_PRODUCT_PAGES; page++) {
    const data = await getJSON(
      `/products?limit=${MAX_PRODUCT_PAGE_SIZE}&page=${page}`,
      {},
      revalidate,
    );
    const items = data?.data || [];
    if (!items.length) break;
    for (const item of items) {
      if (item?._id) seen.set(item._id, item);
    }
  }
  return [...seen.values()];
}
