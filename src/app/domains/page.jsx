"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

function ResultRow({ result, onSelect }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition ${
      result.available
        ? "border-emerald-100 bg-emerald-50"
        : "border-gray-100 bg-gray-50 opacity-60"
    }`}>
      <div>
        <p className="text-sm font-semibold text-gray-900">{result.domain}</p>
        {result.available && (
          <p className="text-xs text-gray-400 mt-0.5">
            {result.price ? <>GH₵{result.price}<span className="ml-1">/yr</span></> : "—"}
          </p>
        )}
      </div>
      {result.available ? (
        <button
          onClick={() => onSelect(result)}
          disabled={!result.price}
          className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition disabled:opacity-40"
        >
          Register
        </button>
      ) : (
        <span className="text-xs text-gray-400 font-medium">Taken</span>
      )}
    </div>
  );
}

function DomainsContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get("name") || "";
  const [query, setQuery] = useState(name);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const doSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const res = await api.get(`/domain/search?domain=${encodeURIComponent(searchQuery.trim())}`);
      const { results: allResults = [] } = res;
      const mapped = allResults.map((r) => {
        const tld = r.domain.includes(".") ? "." + r.domain.split(".").slice(1).join(".") : ".com";
        return {
          domain: r.domain,
          available: r.available,
          price: r.price ?? null,
          tld,
        };
      });
      setResults(mapped);
    } catch (err) {
      setError(err.message || "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (name) doSearch(name);
  }, [name]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/domains?name=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelect = (result) => {
    router.push(`/domains/checkout?domain=${encodeURIComponent(result.domain)}&price=${result.price}`);
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
          <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-60">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm mb-6">{error}</div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((r) => (
              <ResultRow key={r.domain} result={r} onSelect={handleSelect} />
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="p-8 rounded-2xl border border-gray-100 bg-gray-50 text-center">
            <p className="text-gray-400 text-sm">No results found. Try a different name.</p>
          </div>
        )}

        {!searched && !loading && (
          <div className="p-8 rounded-2xl border border-gray-100 bg-gray-50 text-center">
            <p className="text-gray-400 text-sm">Enter a domain name above to check availability.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DomainsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <DomainsContentInner />
    </Suspense>
  );
}
