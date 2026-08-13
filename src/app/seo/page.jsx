"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SEORedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/services/seo");
  }, [router]);

  return null;
}
