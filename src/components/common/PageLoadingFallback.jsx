"use client";

import React from "react";

export default function PageLoadingFallback() {
  return (
    <div
      style={{
        background: "#0A0A14",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 24,
      }}
    >
      <style jsx global>{`
        @keyframes eaz_spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 9999,
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#F5A623",
          animation: "eaz_spin 0.8s linear infinite",
          marginBottom: 12,
        }}
      />
      <div
        style={{
          color: "rgba(136,136,170,1)",
          fontFamily: "DM Sans, system-ui, -apple-system, Segoe UI, sans-serif",
          fontSize: "0.9rem",
        }}
      >
        Loading...
      </div>
    </div>
  );
}

