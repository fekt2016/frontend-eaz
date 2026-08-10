"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaUserPlus, FaSync } from "react-icons/fa";
import { sanitizeName, sanitizeEmail, getPasswordRules, validatePassword, formatPhoneInput } from "@/lib/sanitize";

const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition";
const labelCls = "block text-xs font-medium text-gray-400 mb-1.5";

export default function StaffPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);

  // New staff form
  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [phone,        setPhone]        = useState("");
  const [password,     setPassword]     = useState("");
  const [selectedRole, setSelectedRole] = useState("cashier");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");

  const passwordRules = getPasswordRules(password);
  const passwordStrong = passwordRules.every(r => r.met);

  const loadStaff = () => {
    setLoading(true);
    api.get("/pos/staff").then(r => setStaff(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role !== "superadmin") { router.replace("/pos/dashboard"); return; }
    loadStaff();
  }, [user, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    const cleanName  = sanitizeName(name);
    const cleanEmail = sanitizeEmail(email);
    if (!cleanName || !cleanEmail) { setError("Name and email are required."); return; }
    setSaving(true);
    try {
      await api.post("/pos/staff", { name: cleanName, email: cleanEmail, phone: phone.trim(), password, role: selectedRole });
      setSuccess("Staff account created.");
      setName(""); setEmail(""); setPhone(""); setPassword(""); setModal(false);
      loadStaff();
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your team</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStaff}
            className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition"
            title="Refresh"
          >
            <FaSync size={12} />
          </button>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition"
          >
            <FaUserPlus size={12} /> Add Staff
          </button>
        </div>
      </div>

      {success && <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">{success}</p>}

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-800 animate-pulse" />)}</div>
        ) : staff.length === 0 ? (
          <div className="py-14 text-center text-gray-500 text-sm">No staff accounts yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {staff.map(s => (
              <div key={s._id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    {s._id === user?._id && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">You</span>}
                  </div>
                  <p className="text-xs text-gray-500">{s.email}{s.phone ? ` · ${s.phone}` : ""}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                  s.role === "superadmin" ? "bg-red-500/15 text-red-400"
                  : s.role === "admin"  ? "bg-amber-500/15 text-amber-400"
                  : "bg-blue-500/15 text-blue-400"
                }`}>
                  {s.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add staff modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-base font-bold text-white">Add Staff Account</h2>
              <button onClick={() => setModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Full name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Staff name" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Email address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@example.com" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Phone number</label>
                <input type="tel" value={phone} onChange={e => setPhone(formatPhoneInput(e.target.value))} placeholder="0244388190" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Role *</label>
                <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)} className={inputCls + " cursor-pointer"}>
                  <option value="cashier">Cashier — sales only</option>
                  <option value="technician">Technician — repairs only</option>
                  <option value="admin">Admin — repair steps only</option>
                  <option value="staff">Staff — full access (no superadmin)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Password *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" className={inputCls} required />
                {password.length > 0 && (
                  <div className="mt-2 space-y-1 bg-gray-800 rounded-xl p-3">
                    {passwordRules.map(({ rule, met }) => (
                      <div key={rule} className="flex items-center gap-2">
                        <span className={`text-xs ${met ? "text-green-400" : "text-gray-500"}`}>{met ? "✓" : "·"} {rule}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={saving || !passwordStrong} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-50 transition">
                {saving ? "Creating…" : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
