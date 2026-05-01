import Link from "next/link";
import { FaCheckCircle } from "react-icons/fa";

export default function PaymentSuccess() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 pt-24">
      <div className="max-w-md text-center">
        <FaCheckCircle className="text-emerald-500 text-5xl mx-auto mb-6" />
        <h1 className="font-display font-bold text-4xl text-gray-900 mb-4">Payment Successful</h1>
        <p className="text-gray-500 mb-8">Thank you. Your domain order is being processed.</p>
        <Link
          href="/domains"
          className="inline-block px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-700 transition"
        >
          Back to Domains
        </Link>
      </div>
    </div>
  );
}
