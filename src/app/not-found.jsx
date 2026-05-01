import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 pt-24">
      <h1 className="font-display font-bold text-6xl text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 text-lg mb-8">This page could not be found.</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition"
      >
        Back to Home
      </Link>
    </div>
  );
}
