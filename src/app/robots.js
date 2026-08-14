import { SITE_URL } from "@/lib/seo";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api",
          "/auth",
          "/dashboard",
          "/cart",
          "/checkout",
          "/domains/checkout",
          "/hosting/checkout",
          "/hosting/order-confirmation",
          "/hosting/payment",
          "/hosting/bank-transfer",
          "/order-confirmation",
          "/payment-success",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
