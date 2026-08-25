import { Space_Grotesk, DM_Sans, Space_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import JsonLd from "@/components/common/JsonLd";
import QueryProvider from "@/components/providers/QueryProvider";
import MotionProvider from "@/components/providers/MotionProvider";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { ThemeProvider } from "@/context/ThemeContext";
import { SITE_URL, SITE_NAME, organizationJsonLd } from "@/lib/seo";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "EazWorld | Web Design, SEO & Digital Agency in Accra, Ghana",
    template: "%s | EazWorld",
  },
  description: "Ghana's trusted digital agency. Web design, SEO, paid ads, branding, social media, email marketing, hosting and phone repair in Accra.",
  keywords: ["web design Accra", "SEO Ghana", "digital marketing Ghana", "phone repair Accra", "web hosting Ghana", "digital agency Accra"],
  icons: {
    // Firefox's ICO decoder rejects PNG-compressed .ico entries, so a plain
    // PNG is listed alongside — browsers that prefer PNG will use it.
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: ["/favicon.ico"],
    apple: "/apple-touch-icon.png",
  },
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

const themeInit = `(function(){try{
  var c=document.cookie.match(/(?:^|; )eazworld-theme=([^;]*)/);
  var t=c&&c[1];
  if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}
  var el=document.documentElement;
  if(t==="dark"){el.classList.add("dark");}else{el.classList.remove("dark");}
}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-gray-900 dark:text-slate-100 bg-paper dark:bg-ink min-h-screen flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInit }} />
        <QueryProvider>
          <MotionProvider>
            <ThemeProvider>
              <AuthProvider>
                <CartProvider>
                  <JsonLd data={organizationJsonLd()} />
                  <ConditionalLayout>{children}</ConditionalLayout>
                  <CartDrawer />
                </CartProvider>
              </AuthProvider>
            </ThemeProvider>
          </MotionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}