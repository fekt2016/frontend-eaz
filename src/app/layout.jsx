import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import JsonLd from "@/components/common/JsonLd";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { ThemeProvider } from "@/context/ThemeContext";
import { SITE_URL, SITE_NAME, organizationJsonLd } from "@/lib/seo";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EazWorld | Web Design, SEO & Digital Agency in Accra, Ghana",
    template: "%s | EazWorld",
  },
  description: "Ghana's trusted digital agency. Web design, SEO, paid ads, branding, social media, email marketing, hosting and phone repair in Accra.",
  keywords: ["web design Accra", "SEO Ghana", "digital marketing Ghana", "phone repair Accra", "web hosting Ghana", "digital agency Accra"],
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "EazWorld | Digital Agency in Accra, Ghana",
    description: "Web design, SEO, paid ads, branding, hosting and phone repair — all from one team in Accra.",
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "EazWorld Digital Agency" }],
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: "EazWorld | Digital Agency in Accra, Ghana",
    description: "Web design, SEO, paid ads, branding, hosting and phone repair — all from one team in Accra.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-950 min-h-screen flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <JsonLd data={organizationJsonLd()} />
              <ConditionalLayout>{children}</ConditionalLayout>
              <CartDrawer />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}