import Link from "next/link";

export default function AdminHostingOrdersPage() {
  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Hosting Orders (Admin)</h1>
        <p className="text-gray-500 text-sm mb-8">View and manage all hosting orders.</p>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
          <p className="text-gray-400 text-sm">Admin order management coming soon.</p>
        </div>
      </div>
    </div>
  );
}
