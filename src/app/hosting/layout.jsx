import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Web Hosting in Ghana | EazWorld",
  description:
    "Fast, secure, reliable web hosting for African businesses. NVMe SSD storage, free SSL, cPanel, 99.9% uptime, and 24/7 support — from Accra.",
  path: "/hosting",
});

export default function HostingLayout({ children }) {
  return children;
}
