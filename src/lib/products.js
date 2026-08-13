const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

async function getJSON(path, fallback) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
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

export async function getAllProducts() {
  const data = await getJSON("/products?limit=60", {});
  return data?.data || [];
}
