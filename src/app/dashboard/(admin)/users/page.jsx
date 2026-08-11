"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaSpinner, FaRedo, FaEdit, FaBan, FaCheckCircle,
  FaTimes, FaSearch, FaShieldAlt, FaUser, FaKey, FaEye, FaEyeSlash,
  FaPlus, FaUserCog, FaCashRegister, FaTools,
} from "react-icons/fa";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const ROLE_OPTIONS = [
  { value: "user",       label: "User" },
  { value: "staff",      label: "Staff" },
  { value: "cashier",    label: "Cashier" },
  { value: "technician", label: "Technician" },
  { value: "admin",      label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

const roleStyles = {
  superadmin: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin:      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  user:       "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  staff:      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cashier:    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  technician: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const roleIcons = {
  superadmin: FaShieldAlt,
  admin:      FaShieldAlt,
  user:       FaUser,
  staff:      FaUserCog,
  cashier:    FaCashRegister,
  technician: FaTools,
};

// ─── Create User Modal ─────────────────────────────────────────────────────
function CreateUserModal({ isSuperAdmin, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const visibleRoles = ROLE_OPTIONS.filter((r) => r.value !== "superadmin" || isSuperAdmin);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Name, email, and password are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/auth/users", form);
      onCreated();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FaPlus size={13} />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Create User</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <FaTimes size={13} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
              {error}
            </p>
          )}

          {[
            { label: "Full Name",     key: "name",  type: "text",  placeholder: "e.g. Kwame Mensah" },
            { label: "Email Address", key: "email", type: "email", placeholder: "user@example.com" },
            { label: "Phone Number",  key: "phone", type: "tel",   placeholder: "+233 24 000 0000" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Temporary Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              >
                {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Share this with the user — they can change it later from their settings.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-emerald-400 transition"
            >
              {visibleRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
              Staff = shop team · Cashier = sales · Technician = repairs · Admin = full management
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaPlus size={11} />}
            {saving ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSaved, isSuperAdmin }) {
  const [form, setForm] = useState({
    name:  user.name  || "",
    email: user.email || "",
    phone: user.phone || "",
    role:  user.role  || "user",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const visibleRoles = ROLE_OPTIONS.filter((r) => r.value !== "superadmin" || isSuperAdmin);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await api.patch(`/auth/users/${user._id}`, form);
      onSaved(res.data);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">Edit User</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <FaTimes size={13} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
              {error}
            </p>
          )}
          {[
            { label: "Full Name",     key: "name",  type: "text" },
            { label: "Email Address", key: "email", type: "email" },
            { label: "Phone Number",  key: "phone", type: "tel" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-400 transition"
            >
              {visibleRoles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-full bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-amber-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" size={12} /> : null}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Block Modal ───────────────────────────────────────────────────────────
function BlockModal({ user, onClose, onSaved }) {
  const [reason, setReason] = useState(user.blockedReason || "");
  const [saving, setSaving] = useState(false);

  const handleBlock = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/auth/users/${user._id}/block`, {
        isBlocked: !user.isBlocked,
        blockedReason: !user.isBlocked ? reason : "",
      });
      onSaved(res.data);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const blocking = !user.isBlocked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800">
        <div className="px-6 py-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${blocking ? "bg-red-100 dark:bg-red-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
            {blocking ? <FaBan size={20} className="text-red-500" /> : <FaCheckCircle size={20} className="text-emerald-500" />}
          </div>
          <h3 className="font-bold text-center text-gray-900 dark:text-white mb-1">
            {blocking ? "Block User" : "Unblock User"}
          </h3>
          <p className="text-center text-xs text-gray-400 dark:text-slate-500 mb-4">
            {blocking
              ? `${user.name} will be blocked and unable to log in.`
              : `${user.name} will be able to log in again.`}
          </p>

          {blocking && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Reason (optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Violated terms of service"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-red-400 transition"
              />
            </div>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
            Cancel
          </button>
          <button
            onClick={handleBlock}
            disabled={saving}
            className={`flex-1 py-2.5 rounded-full text-white text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2 ${
              blocking ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {saving ? <FaSpinner className="animate-spin" size={12} /> : null}
            {blocking ? "Block User" : "Unblock User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────
function ChangePasswordModal({ user, onClose }) {
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(false);

  const handleSave = async () => {
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/auth/users/${user._id}/password`, { newPassword });
      setSuccess(true);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <FaKey size={13} className="text-violet-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">Change Password</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{user.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
            <FaTimes size={13} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <FaCheckCircle size={22} className="text-emerald-500" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Password Updated</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">The new password is active immediately.</p>
              <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-full bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-amber-400 transition">
                Done
              </button>
            </div>
          ) : (
            <>
              {error && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
                  {error}
                </p>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                  >
                    {showNew ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-violet-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                  >
                    {showConfirm ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {saving ? <FaSpinner className="animate-spin" size={12} /> : <FaKey size={11} />}
                  {saving ? "Saving…" : "Set Password"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { user: me, loading: authLoading } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [createOpen, setCreateOpen]         = useState(false);
  const [editTarget, setEditTarget]         = useState(null);
  const [blockTarget, setBlockTarget]       = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);

  const isSuperAdmin = me?.role === "superadmin";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && me?.role === "admin") fetchUsers();
  }, [authLoading, me?.role, fetchUsers]);

  const handleSaved = (updated) => {
    setUsers((prev) => prev.map((u) => u._id === updated._id ? updated : u));
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-6 pb-24">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
              {users.length} registered · {users.filter(u => u.isBlocked).length} blocked
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition"
            >
              <FaPlus size={11} /> Create User
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50"
            >
              <FaRedo size={11} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <FaSearch size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <FaSpinner className="animate-spin text-2xl text-amber-500" />
            <span className="text-sm">Loading users…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
            <p className="text-gray-400 dark:text-slate-500 text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800/60 text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Joined</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filtered.map((u) => (
                    <tr key={u._id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/40 transition ${u.isBlocked ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm flex-shrink-0">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{u.name}</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-slate-400">{u.phone || "—"}</td>
                      <td className="px-5 py-3.5">
                        {(() => {
                          const RoleIcon = roleIcons[u.role] || FaUser;
                          return (
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${roleStyles[u.role] || "bg-gray-50 text-gray-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                              <RoleIcon size={8} />
                              {u.role}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isBlocked ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                              <FaBan size={8} /> Blocked
                            </span>
                            {u.blockedReason && (
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 max-w-[120px] truncate" title={u.blockedReason}>
                                {u.blockedReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-400 dark:text-slate-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditTarget(u)}
                            title="Edit user"
                            className="p-2 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300 transition"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            onClick={() => setPasswordTarget(u)}
                            title="Change password"
                            className="p-2 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400 transition"
                          >
                            <FaKey size={13} />
                          </button>
                          {String(u._id) !== String(me?._id) && (
                            <button
                              onClick={() => setBlockTarget(u)}
                              title={u.isBlocked ? "Unblock user" : "Block user"}
                              className={`p-2 rounded-lg transition ${
                                u.isBlocked
                                  ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                  : "text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              }`}
                            >
                              {u.isBlocked ? <FaCheckCircle size={13} /> : <FaBan size={13} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {createOpen    && <CreateUserModal     isSuperAdmin={isSuperAdmin} onClose={() => setCreateOpen(null)} onCreated={fetchUsers} />}
      {editTarget    && <EditModal           user={editTarget}     isSuperAdmin={isSuperAdmin} onClose={() => setEditTarget(null)}     onSaved={handleSaved} />}
      {blockTarget   && <BlockModal          user={blockTarget}    onClose={() => setBlockTarget(null)}    onSaved={handleSaved} />}
      {passwordTarget && <ChangePasswordModal user={passwordTarget} onClose={() => setPasswordTarget(null)} />}
    </div>
  );
}
