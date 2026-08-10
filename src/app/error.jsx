"use client";

export default function Error({ reset }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      backgroundColor: "#f9fafb",
      fontFamily: "sans-serif",
    }}>
      <div style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "16px",
          backgroundColor: "#fee2e2", display: "flex",
          alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", fontSize: "28px",
        }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#111827", marginBottom: "12px" }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", lineHeight: 1.6, marginBottom: "32px" }}>
          An unexpected error occurred. Please try again or go back to the homepage.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "12px 24px", borderRadius: "999px",
              backgroundColor: "#111827", color: "#ffffff",
              fontWeight: 600, fontSize: "14px",
              border: "none", cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            style={{
              padding: "12px 24px", borderRadius: "999px",
              border: "1px solid #e5e7eb", color: "#374151",
              fontWeight: 500, fontSize: "14px",
              textDecoration: "none", display: "inline-block",
            }}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
