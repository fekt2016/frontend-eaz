/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/service/seo", destination: "/seo", permanent: true },
      { source: "/service/:path*", destination: "/services/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
