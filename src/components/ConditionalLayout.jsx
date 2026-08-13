"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

// Routes where the global Navbar / Footer / ChatWidget should NOT render
const BARE_PREFIXES = ["/dashboard"];

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isBare = BARE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"));

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
