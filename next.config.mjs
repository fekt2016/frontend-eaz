/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product images come from many external supplier hosts (cdn.shopify.com,
    // apple.com, samsung.com, amazon, belkin, jbl, …). Rather than maintain a
    // brittle allowlist that crashes the shop whenever a new host appears, allow
    // any HTTPS image host. next/image still serves optimized images from the
    // same origin (/_next/image), so the browser CSP `img-src 'self'` covers them.
    // Applies in dev and production. http:// is intentionally excluded.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",                    value: "DENY" },
          { key: "X-Content-Type-Options",              value: "nosniff" },
          { key: "Referrer-Policy",                     value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",                  value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "X-XSS-Protection",                   value: "1; mode=block" },
          { key: "X-Permitted-Cross-Domain-Policies",  value: "none" },
          { key: "X-DNS-Prefetch-Control",              value: "on" },
          ...(isProd
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
            : []
          ),
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://checkout.paystack.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://res.cloudinary.com https://picsum.photos https://images.unsplash.com https://logo.clearbit.com https://api.microlink.io",
              // API calls go through Next.js rewrites (/api/v1) so the browser only ever
              // talks to 'self' — no need to whitelist the backend IP/domain here.
              `connect-src 'self' https://api.paystack.co https://checkout.paystack.com${!isProd ? " ws://localhost:3000" : ""}`,
              "frame-src https://checkout.paystack.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"}/:path*`,
      },
      {
        source: "/api/webhooks/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:5000"}/api/webhooks/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/service/seo", destination: "/seo", permanent: true },
      { source: "/service/:path*", destination: "/services/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
