"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function DomainsContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get("name") || "";
  const [query, setQuery] = useState(name);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) router.push(`/domains?name=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-24">
        <Link href="/" className="text-gray-400 text-sm hover:text-gray-700 transition mb-8 inline-block">← Home</Link>

        <h1 className="font-display font-black text-4xl text-gray-900 mb-2">Domain Search</h1>
        <p className="text-gray-500 mb-10">Find and register the perfect domain for your business.</p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="yourbusiness.com"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition bg-white"
          />
          <button type="submit" className="px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition">
            Search
          </button>
        </form>

        <div className="p-8 rounded-2xl border border-gray-100 bg-gray-50 text-center">
          <p className="text-gray-400 text-sm">
            {name ? `Domain search coming soon. Searching for "${name}"...` : "Enter a domain name above to check availability."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DomainsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
      </div>
    }>
      <DomainsContentInner />
    </Suspense>
  );
}
