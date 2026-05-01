import Link from "next/link";

export default function HostingOrderDetailPage() {
  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Hosting Order</h1>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
          <p className="text-gray-400 text-sm">Order details coming soon.</p>
        </div>
      </div>
    </div>
  );
}
