"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { isAdminRole } from "@/lib/roles";
import {
  RotateCw, Pen, Ban, CheckCircle2,
  Search, ShieldCheck, User, Key, Eye, EyeOff,
  Plus, UserCog, Wrench, Users as UsersIcon,
} from "lucide-react";
import {
  Badge, Button, Card, EmptyState, Field, Input, Modal,
  PageHeader, Select, Skeleton, Table, TableWrap, Td, Th,
} from "@/components/ui";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const ROLE_OPTIONS = [
  { value: "user",       label: "User" },
  { value: "staff",      label: "Staff" },
  { value: "technician", label: "Technician" },
  { value: "admin",      label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

/*
 * Roles used to carry five hand-picked Tailwind hues (purple/blue/emerald/
 * orange) whose light shades were never contrast-checked. They now map onto the
 * measured semantic tones, which stay distinguishable while clearing 4.5:1 in
 * both themes. Gold is reserved for the highest authority — the house accent.
 */
const roleTones = {
  superadmin: "brand",
  admin:      "info",
  staff:      "success",
  technician: "warning",
  user:       "neutral",
};

const roleIcons = {
  superadmin: ShieldCheck,
  admin:      ShieldCheck,
  user:       User,
  staff:      UserCog,
  technician: Wrench,
};

/*
 * The fetch wrapper in lib/api.js throws a plain Error carrying the server's
 * message — it is not axios, so the `e.response.data.error` this page used to
 * read was always undefined and every failure showed the generic fallback.
 */
const errMsg = (e, fallback) => e?.message || fallback;

function FormError({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-error/20 bg-error-surface px-3 py-2 text-caption font-medium text-error dark:border-error-dark/30 dark:bg-error-surface-dark dark:text-error-dark"
    >
      {children}
    </p>
  );
}

/** Password input with a show/hide toggle, wired to a real <label>. */
function PasswordField({ label, value, onChange, placeholder, hint, required }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} hint={hint} required={required}>
      {(p) => (
        <div className="relative">
          <Input
            bare
            type={show ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="pr-11"
            {...p}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
          >
            {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
      )}
    </Field>
  );
}

// ─── Create User Modal ─────────────────────────────────────────────────────
function CreateUserModal({ isSuperAdmin, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", role: "user",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const visibleRoles = ROLE_OPTIONS.filter((r) => r.value !== "superadmin" || isSuperAdmin);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
      setError(errMsg(e, "Failed to create user."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Create user"
      description="The account is active immediately."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} loading={saving}>
            {!saving && <Plus size={15} aria-hidden="true" />}
            {saving ? "Creating…" : "Create user"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormError>{error}</FormError>

        <Input label="Full name" required value={form.name} onChange={set("name")} placeholder="e.g. Kwame Mensah" />
        <Input label="Email address" required type="email" value={form.email} onChange={set("email")} placeholder="user@example.com" />
        <Input label="Phone number" type="tel" value={form.phone} onChange={set("phone")} placeholder="+233 24 000 0000" />

        <PasswordField
          label="Temporary password"
          required
          value={form.password}
          onChange={set("password")}
          placeholder="Min. 8 characters"
          hint="Share this with the user — they can change it later from their settings."
        />

        <Select
          label="Role"
          value={form.role}
          onChange={set("role")}
          hint="Staff = shop team & sales · Technician = repairs · Admin = full management"
        >
          {visibleRoles.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </div>
    </Modal>
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
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
      setError(errMsg(e, "Failed to update user."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit user"
      description={user.email || user.phone || undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormError>{error}</FormError>

        <Input label="Full name" required value={form.name} onChange={set("name")} />
        <Input label="Email address" required type="email" value={form.email} onChange={set("email")} />
        <Input label="Phone number" type="tel" value={form.phone} onChange={set("phone")} />

        <Select label="Role" value={form.role} onChange={set("role")}>
          {visibleRoles.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
      </div>
    </Modal>
  );
}

// ─── Block Modal ───────────────────────────────────────────────────────────
function BlockModal({ user, onClose, onSaved }) {
  const [reason, setReason] = useState(user.blockedReason || "");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const blocking = !user.isBlocked;

  const handleBlock = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.patch(`/auth/users/${user._id}/block`, {
        isBlocked: blocking,
        blockedReason: blocking ? reason : "",
      });
      onSaved(res.data);
      onClose();
    } catch (e) {
      setError(errMsg(e, blocking ? "Failed to block user." : "Failed to unblock user."));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={blocking ? "Block user" : "Unblock user"}
      description={
        blocking
          ? `${user.name} will be blocked and unable to log in.`
          : `${user.name} will be able to log in again.`
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={blocking ? "danger" : "primary"} onClick={handleBlock} loading={saving}>
            {blocking ? "Block user" : "Unblock user"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormError>{error}</FormError>

        <div
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${
            blocking
              ? "bg-error-surface dark:bg-error-surface-dark"
              : "bg-success-surface dark:bg-success-surface-dark"
          }`}
        >
          {blocking
            ? <Ban size={20} aria-hidden="true" className="text-error dark:text-error-dark" />
            : <CheckCircle2 size={20} aria-hidden="true" className="text-success dark:text-success-dark" />}
        </div>

        {blocking && (
          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Violated terms of service"
            hint="Shown to staff on the user list, not to the user."
          />
        )}
      </div>
    </Modal>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────
function ChangePasswordModal({ user, onClose }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);

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
      setError(errMsg(e, "Failed to update password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Change password"
      description={user.name}
      footer={
        success ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {!saving && <Key size={15} aria-hidden="true" />}
              {saving ? "Saving…" : "Set password"}
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="py-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-surface dark:bg-success-surface-dark">
            <CheckCircle2 size={22} aria-hidden="true" className="text-success dark:text-success-dark" />
          </div>
          <p className="font-display font-bold text-gray-900 dark:text-white">Password updated</p>
          <p className="mt-1 text-body-sm text-gray-600 dark:text-slate-400">
            The new password is active immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <FormError>{error}</FormError>
          <PasswordField
            label="New password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
          <PasswordField
            label="Confirm password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
          />
        </div>
      )}
    </Modal>
  );
}

// ─── Row ───────────────────────────────────────────────────────────────────
function UserRow({ u, isSelf, onEdit, onPassword, onBlock }) {
  const RoleIcon = roleIcons[u.role] || User;
  return (
    <tr className={`transition-colors hover:bg-paper dark:hover:bg-slate-800/40 ${u.isBlocked ? "opacity-60" : ""}`}>
      <Td>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-body-sm text-brand-ink dark:bg-brand-900/30 dark:text-brand-400">
            {u.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-body-sm font-semibold leading-tight text-gray-900 dark:text-white">{u.name}</p>
            <p className="truncate text-caption text-gray-600 dark:text-slate-400">{u.email}</p>
          </div>
        </div>
      </Td>
      <Td>{u.phone || "—"}</Td>
      <Td>
        <Badge tone={roleTones[u.role] || "neutral"} className="uppercase">
          <RoleIcon size={11} aria-hidden="true" />
          {u.role}
        </Badge>
      </Td>
      <Td>
        {u.isBlocked ? (
          <div>
            <Badge tone="error">
              <Ban size={11} aria-hidden="true" /> Blocked
            </Badge>
            {u.blockedReason && (
              <p className="mt-1 max-w-[140px] truncate text-caption text-gray-600 dark:text-slate-400" title={u.blockedReason}>
                {u.blockedReason}
              </p>
            )}
          </div>
        ) : (
          <Badge tone="success">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success dark:bg-success-dark" /> Active
          </Badge>
        )}
      </Td>
      <Td className="whitespace-nowrap">{fmtDate(u.createdAt)}</Td>
      <Td>
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${u.name}`} className="px-2">
            <Pen size={15} aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onPassword} aria-label={`Change password for ${u.name}`} className="px-2">
            <Key size={15} aria-hidden="true" />
          </Button>
          {!isSelf && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBlock}
              aria-label={u.isBlocked ? `Unblock ${u.name}` : `Block ${u.name}`}
              className={`px-2 ${u.isBlocked ? "text-success dark:text-success-dark" : "text-error dark:text-error-dark"}`}
            >
              {u.isBlocked
                ? <CheckCircle2 size={15} aria-hidden="true" />
                : <Ban size={15} aria-hidden="true" />}
            </Button>
          )}
        </div>
      </Td>
    </tr>
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
    if (!authLoading && isAdminRole(me?.role)) fetchUsers();
  }, [authLoading, me?.role, fetchUsers]);

  const handleSaved = (updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
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

  const blockedCount = users.filter((u) => u.isBlocked).length;

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Users"
          description={`${users.length} registered · ${blockedCount} blocked`}
          actions={
            <>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus size={15} aria-hidden="true" /> Create user
              </Button>
              <Button size="sm" variant="secondary" onClick={fetchUsers} disabled={loading}>
                <RotateCw size={15} aria-hidden="true" className={loading ? "animate-spin" : ""} /> Refresh
              </Button>
            </>
          }
        />

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-600 dark:text-slate-400"
          />
          <Input
            label="Search users"
            hideLabel
            type="search"
            size="lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="pl-11"
          />
        </div>

        {loading ? (
          <Card padding="none" className="overflow-hidden">
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="ml-auto h-3.5 w-24" />
                </div>
              ))}
            </div>
          </Card>
        ) : filtered.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={UsersIcon}
              title={search ? "No users match that search" : "No users yet"}
              description={
                search
                  ? "Try a different name, email or phone number."
                  : "Create the first account to get your team into the dashboard."
              }
              action={
                search ? (
                  <Button variant="secondary" onClick={() => setSearch("")}>Clear search</Button>
                ) : (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus size={15} aria-hidden="true" /> Create user
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <TableWrap>
              <Table className="min-w-[640px]">
                <thead>
                  <tr className="bg-paper dark:bg-slate-800/60">
                    <Th>User</Th>
                    <Th>Phone</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Joined</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <UserRow
                      key={u._id}
                      u={u}
                      isSelf={String(u._id) === String(me?._id)}
                      onEdit={() => setEditTarget(u)}
                      onPassword={() => setPasswordTarget(u)}
                      onBlock={() => setBlockTarget(u)}
                    />
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </Card>
        )}
      </div>

      {/* Modals */}
      {createOpen && (
        <CreateUserModal
          isSuperAdmin={isSuperAdmin}
          onClose={() => setCreateOpen(false)}
          onCreated={fetchUsers}
        />
      )}
      {editTarget && (
        <EditModal
          user={editTarget}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {blockTarget && (
        <BlockModal user={blockTarget} onClose={() => setBlockTarget(null)} onSaved={handleSaved} />
      )}
      {passwordTarget && (
        <ChangePasswordModal user={passwordTarget} onClose={() => setPasswordTarget(null)} />
      )}
    </div>
  );
}
