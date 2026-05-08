"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get("/auth/users")
      .then((res) => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-white px-4 pt-24 pb-24">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="mb-6 inline-block text-sm text-gray-400 hover:text-gray-700 transition">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Users Management</h1>
        <p className="text-gray-500 text-sm mb-8">View all registered users in the system.</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <p className="text-gray-400 text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
