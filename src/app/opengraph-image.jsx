import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "EazWorld | Digital Agency in Accra, Ghana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
        {/* Top accent bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "4px", backgroundColor: "#f5a623", borderRadius: "2px" }} />
          <span style={{ color: "#f5a623", fontSize: "16px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Digital Agency · Accra, Ghana
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Logo / Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#f5a623",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              E
            </div>
            <span style={{ fontSize: "48px", fontWeight: 900, color: "#ffffff" }}>
              EazWorld
            </span>
          </div>

          <p style={{ fontSize: "26px", color: "#94a3b8", margin: 0, lineHeight: 1.4, maxWidth: "680px" }}>
            Web Design, SEO, Branding, Paid Ads &amp; Phone Repair — all from one trusted team in Accra.
          </p>
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Web Design", "SEO", "Branding", "Phone Repair"].map((s) => (
              <div
                key={s}
                style={{
                  backgroundColor: "#1e293b",
                  color: "#cbd5e1",
                  borderRadius: "999px",
                  padding: "8px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "1px solid #334155",
                }}
              >
                {s}
              </div>
            ))}
          </div>
          <span style={{ color: "#475569", fontSize: "16px" }}>eazworld.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
