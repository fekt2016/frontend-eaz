import Link from "next/link";

export default function DashboardHosting() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold text-gray-900">My Hosting</h2>
        <Link href="/hosting" className="text-sm text-amber-500 hover:underline">
          Order hosting
        </Link>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
        <p className="text-gray-400 text-sm mb-4">You don&apos;t have any hosting orders yet.</p>
        <Link
          href="/hosting"
          className="inline-block rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition"
        >
          View hosting plans
        </Link>
      </div>
    </section>
  );
}
