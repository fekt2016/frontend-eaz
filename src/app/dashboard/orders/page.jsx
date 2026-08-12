"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaShoppingBag } from "react-icons/fa";
import { api } from "@/lib/api";
import { ShopOrderCard } from "@/components/dashboard/customer/CustomerCards";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/orders/mine")
      .then((res) => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">My Shop Orders</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-0.5">Orders matched by the phone or email you use at checkout.</p>
        </div>
        <Link href="/shop" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
          Visit Shop
        </Link>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 flex justify-center">
          <div className="w-6 h-6 border-2 border-gray-200 dark:border-slate-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center">
          <FaShoppingBag size={28} className="text-gray-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-slate-500 text-sm mb-2">No shop orders linked to your account.</p>
          <p className="text-xs text-gray-300 dark:text-slate-600 mb-4">Orders are matched by the phone or email you use at checkout.</p>
          <Link href="/shop" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition">
            Browse the Shop
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {orders.map((o) => <ShopOrderCard key={o._id} order={o} />)}
        </div>
      )}
    </div>
  );
}