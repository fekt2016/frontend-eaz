"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaServer, FaGlobe, FaShieldAlt, FaExternalLinkAlt,
  FaClock, FaChevronRight, FaUserCircle,
} from "react-icons/fa";

const CPANEL_URL = process.env.NEXT_PUBLIC_CPANEL_URL || "https://your-server-ip:2083";

const statusConfig = {
  active:    { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  paid:      { label: "Paid",      cls: "bg-blue-50 text-blue-700 border-blue-100",          dot: "bg-blue-500" },
  pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700 border-amber-100",        dot: "bg-amber-400" },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-100",              dot: "bg-red-400" },
  failed:    { label: "Failed",    cls: "bg-red-50 text-red-700 border-red-100",              dot: "bg-red-400" },
  completed: { label: "Active",    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",  dot: "bg-emerald-500" },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || { label: status, cls: "bg-gray-50 text-gray-600 border-gray-100", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function HostingCard({ order }) {
  const isActive = order.status === "active";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <FaServer size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 capitalize">{order.planType} — {order.tier}</p>
            <p className="text-xs text-gray-400 capitalize">{order.billingCycle} · GH₵{order.amount}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.domain && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
          <FaGlobe size={12} className="text-gray-400" />
          <span className="text-xs text-gray-600 font-mono">{order.domain}</span>
        </div>
      )}

      {isActive && order.cpanelUsername && (
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-600 font-medium">cPanel Username</p>
            <p className="text-sm font-mono text-emerald-800 font-semibold">{order.cpanelUsername}</p>
          </div>
          <a
            href={CPANEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            cPanel <FaExternalLinkAlt size={9} />
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <Link
          href={`/dashboard/hosting/${order._id}`}
          className="flex-1 text-center text-xs font-semibold py-2 rounded-full border border-gray-200 text-gray-700 hover:border-gray-400 hover:text-gray-900 transition"
        >
          View Details
        </Link>
        {isActive && (
          <a
            href={CPANEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition flex items-center justify-center gap-1.5"
          >
            Login to cPanel <FaExternalLinkAlt size={9} />
          </a>
        )}
      </div>
    </div>
  );
}

function DomainCard({ order }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FaGlobe size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 font-mono">{order.domain}</p>
            <p className="text-xs text-gray-400">{order.years} year{order.years > 1 ? "s" : ""} · GH₵{order.price}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [hosting, setHosting] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loadingHosting, setLoadingHosting] = useState(true);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    api.get("/hosting/orders")
      .then((res) => setHosting(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingHosting(false));

    api.get("/domain/orders")
      .then((res) => setDomains(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingDomains(false));
  }, []);

  const activeHosting = hosting.filter(o => o.status === "active").length;
  const activeDomains = domains.filter(o => o.status === "completed").length;
  const pendingOrders = [...hosting, ...domains].filter(o => o.status === "pending").length;

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "hosting", label: "Hosting" },
    { id: "domains", label: "Domains" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <FaUserCircle size={24} className="text-amber-500" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-gray-900">
                {user?.name ? `Hey, ${user.name.split(" ")[0]} 👋` : "Dashboard"}
              </h1>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
          {user?.role === "admin" && (
            <Link href="/dashboard/admin/hosting" className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition">
              <FaShieldAlt size={12} /> Admin Panel
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={FaServer} label="Active Hosting" value={activeHosting} color="bg-amber-400" />
          <StatCard icon={FaGlobe} label="Active Domains" value={activeDomains} color="bg-blue-500" />
          <StatCard icon={FaClock} label="Pending Orders" value={pendingOrders} color="bg-gray-400" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-gray-100 rounded-2xl p-1 w-fit">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${
                tab === item.id ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "overview" && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Recent Hosting */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Hosting</h2>
                <button onClick={() => setTab("hosting")} className="text-xs text-amber-500 hover:underline flex items-center gap-1">
                  View all <FaChevronRight size={9} />
                </button>
              </div>
              {loadingHosting ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : hosting.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <p className="text-gray-400 text-sm mb-3">No hosting orders yet.</p>
                  <Link href="/hosting" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                    Browse Plans
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {hosting.slice(0, 2).map(o => <HostingCard key={o._id} order={o} />)}
                </div>
              )}
            </div>

            {/* Recent Domains */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Recent Domains</h2>
                <button onClick={() => setTab("domains")} className="text-xs text-amber-500 hover:underline flex items-center gap-1">
                  View all <FaChevronRight size={9} />
                </button>
              </div>
              {loadingDomains ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : domains.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                  <p className="text-gray-400 text-sm mb-3">No domains registered yet.</p>
                  <Link href="/domains" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                    Search Domains
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {domains.slice(0, 3).map(o => <DomainCard key={o._id} order={o} />)}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="md:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { href: "/hosting", icon: FaServer, label: "Order Hosting", color: "text-amber-500 bg-amber-50" },
                  { href: "/domains", icon: FaGlobe, label: "Register Domain", color: "text-blue-500 bg-blue-50" },
                  { href: "/contact", icon: FaShieldAlt, label: "Get Support", color: "text-emerald-500 bg-emerald-50" },
                  { href: CPANEL_URL, icon: FaExternalLinkAlt, label: "cPanel Login", color: "text-purple-500 bg-purple-50", external: true },
                ].map(({ href, icon: Icon, label, color, external }) => (
                  external ? (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                      className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-gray-200 hover:shadow-sm transition text-center cursor-pointer">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{label}</span>
                    </a>
                  ) : (
                    <Link key={label} href={href}
                      className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:border-gray-200 hover:shadow-sm transition text-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{label}</span>
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hosting tab */}
        {tab === "hosting" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">All Hosting Orders</h2>
              <Link href="/hosting" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                + New Order
              </Link>
            </div>
            {loadingHosting ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : hosting.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <FaServer size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">No hosting orders yet.</p>
                <Link href="/hosting" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                  Browse Hosting Plans
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {hosting.map(o => <HostingCard key={o._id} order={o} />)}
              </div>
            )}
          </div>
        )}

        {/* Domains tab */}
        {tab === "domains" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">All Domains</h2>
              <Link href="/domains" className="text-xs font-semibold px-4 py-2 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                + Register Domain
              </Link>
            </div>
            {loadingDomains ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 flex justify-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : domains.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <FaGlobe size={28} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">No domains registered yet.</p>
                <Link href="/domains" className="text-sm font-semibold px-5 py-2.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                  Search Domains
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {domains.map(o => <DomainCard key={o._id} order={o} />)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
