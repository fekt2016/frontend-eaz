import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/common/JsonLd";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
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
    default: "EazWorld | Premium Digital Agency",
    template: "%s | EazWorld",
  },
  description: "Web design, domain registration, and hosting in Accra, Ghana",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-white min-h-screen flex flex-col">
        <JsonLd data={organizationJsonLd()} />
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
