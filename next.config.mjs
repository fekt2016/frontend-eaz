/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "api.microlink.io" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "logo.clearbit.com" },
    ],
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
              // Allow localhost backend in dev; production uses relative /api/v1 rewrites only
              `connect-src 'self' https://api.paystack.co https://checkout.paystack.com${!isProd ? " http://localhost:5000 ws://localhost:3000" : ""}`,
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
