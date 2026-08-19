/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.microlink.io" },
      { protocol: "https", hostname: "cdn.ecoustics.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "d3gqasl9vmjfd8.cloudfront.net" },
      { protocol: "https", hostname: "eu.baseus.com" },
      { protocol: "https", hostname: "hypervolt.in" },
      { protocol: "https", hostname: "i0.wp.com" },
      { protocol: "https", hostname: "image-us.samsung.com" },
      { protocol: "https", hostname: "images.ctfassets.net" },
      { protocol: "https", hostname: "images.mobilefun.co.uk" },
      { protocol: "https", hostname: "images.samsung.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "in.jbl.com" },
      { protocol: "https", hostname: "irepart.com" },
      { protocol: "https", hostname: "lamicallshop.com" },
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "nillkin.org" },
      { protocol: "https", hostname: "partners.spigen.com" },
      { protocol: "https", hostname: "phonesstorekenya.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "pisces.bbystatic.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "repairpartsusa.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "store.storeimages.cdn-apple.com" },
      { protocol: "https", hostname: "supcase.com" },
      { protocol: "https", hostname: "target.scene7.com" },
      { protocol: "https", hostname: "techhouse.sg" },
      { protocol: "https", hostname: "us.moshi.com" },
      { protocol: "https", hostname: "us.ugreen.com" },
      { protocol: "https", hostname: "www.apple.com" },
      { protocol: "https", hostname: "www.baseus.com" },
      { protocol: "https", hostname: "www.belkin.com" },
      { protocol: "https", hostname: "www.esrtech.com" },
      { protocol: "https", hostname: "www.jbl.com" },
      { protocol: "https", hostname: "www.nillkin.com" },
      { protocol: "https", hostname: "www.ringkestore.com" },
      { protocol: "https", hostname: "www.safesleevecases.com" },
      { protocol: "https", hostname: "www.shopyvision.com" },
      { protocol: "https", hostname: "www.spigen.com" },
      { protocol: "https", hostname: "www.tanotis.com" },
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
              "img-src 'self' data: blob: https://api.microlink.io https://cdn.ecoustics.com https://cdn.shopify.com https://d3gqasl9vmjfd8.cloudfront.net https://eu.baseus.com https://hypervolt.in https://i0.wp.com https://image-us.samsung.com https://images.ctfassets.net https://images.mobilefun.co.uk https://images.samsung.com https://images.unsplash.com https://in.jbl.com https://irepart.com https://lamicallshop.com https://logo.clearbit.com https://m.media-amazon.com https://nillkin.org https://partners.spigen.com https://phonesstorekenya.com https://picsum.photos https://pisces.bbystatic.com https://placehold.co https://repairpartsusa.com https://res.cloudinary.com https://store.storeimages.cdn-apple.com https://supcase.com https://target.scene7.com https://techhouse.sg https://us.moshi.com https://us.ugreen.com https://www.apple.com https://www.baseus.com https://www.belkin.com https://www.esrtech.com https://www.jbl.com https://www.nillkin.com https://www.ringkestore.com https://www.safesleevecases.com https://www.shopyvision.com https://www.spigen.com https://www.tanotis.com",
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
