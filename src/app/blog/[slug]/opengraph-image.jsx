import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/seo";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const SITE_HOST = new URL(SITE_URL).host;

const CATEGORY_COLORS = {
  "SEO":              "#10b981",
  "Web Design":       "#8b5cf6",
  "Case Study":       "#f5a623",
  "Social Media":     "#ec4899",
  "Branding":         "#8b5cf6",
  "Phone Repair":     "#06b6d4",
  "Paid Advertising": "#3b82f6",
  "Email Marketing":  "#f59e0b",
  "General":          "#64748b",
};

async function getPost(slug) {
  try {
    const res = await fetch(`${API_BASE}/posts/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export default async function BlogOgImage({ params }) {
  const post = await getPost(params.slug);

  const title    = post?.title    || "EazWorld Blog";
  const category = post?.category || "General";
  const author   = post?.author   || "EazWorld Team";
  const readTime = post?.readTime || "5 min read";
  const accent   = CATEGORY_COLORS[category] || "#f5a623";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f172a",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Category pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              backgroundColor: `${accent}20`,
              color: accent,
              borderRadius: "999px",
              padding: "8px 20px",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: `1px solid ${accent}40`,
            }}
          >
            {category}
          </div>
          <span style={{ color: "#475569", fontSize: "15px" }}>{readTime}</span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p
            style={{
              fontSize: title.length > 60 ? "36px" : "46px",
              fontWeight: 900,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            {title}
          </p>
          <p style={{ fontSize: "20px", color: "#64748b", margin: 0 }}>
            By {author}
          </p>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "#f5a623",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              E
            </div>
            <span style={{ color: "#94a3b8", fontSize: "18px", fontWeight: 700 }}>EazWorld</span>
          </div>
          <span style={{ color: "#334155", fontSize: "16px" }}>{SITE_HOST}/blog</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
