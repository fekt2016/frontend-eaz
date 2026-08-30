"use client";

/*
 * Admin user-detail page (owner request, 2026-08-30): "we should have a user
 * detail page where all the edit and update can be done by the admin and
 * superadmin".
 *
 * Why a page and not a bigger modal on the list: a modal only exists if you
 * arrived from the list, so a bookmarked or refreshed URL shows nothing, and
 * every action has to fit a dialog. This page fetches its own user via
 * GET /auth/users/:id, so it stands alone.
 *
 * Division of labour with the list: this page owns edit, role and password.
 * The list keeps only quick block/unblock, because that is the one action you
 * genuinely want without leaving a table of twenty people. Two code paths for
 * the same mutation is how the deleted useContacts hook rotted (T129) — so the
 * edit and password modals were removed from the list rather than left behind.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api, errorMessage } from "@/lib/api";
import { isAdminRole, ROLE_OPTIONS, roleTones, roleLabel } from "@/lib/roles";
import { sanitizeName, sanitizeEmail, sanitizePhone } from "@/lib/sanitize";
import {
  ArrowLeft, Ban, CheckCircle2, Key, Mail, MapPin, Phone, ShieldCheck,
  ShoppingBag, User as UserIcon,
} from "lucide-react";
import {
  Badge, Button, Card, EmptyState, Field, Input, PageHeader, Select, Skeleton,
  Table, TableWrap, Td, Th,
} from "@/components/ui";
import { formatGhs } from "@/lib/shop";
import GhanaCardReview from "./GhanaCardReview";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: me } = useAuth();
  const isSuperAdmin = me?.role === "superadmin";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [formError, setFormError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwNote, setPwNote] = useState("");

  const [blockReason, setBlockReason] = useState("");
  const [blockBusy, setBlockBusy] = useState(false);

  // Related records load SEPARATELY from the user, on purpose. The backend runs
  // on a 512MB heap, so a customer with a long history must not arrive as one
  // payload — orders are paginated server-side and fetched after the profile
  // paints, so a slow or failing related query never blocks the page you came
  // to use.
  const [orders, setOrders] = useState(null);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersError, setOrdersError] = useState("");
  const [addresses, setAddresses] = useState(null);
  const [addressesError, setAddressesError] = useState("");

  const applyUser = useCallback((u) => {
    setUser(u);
    setForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "user",
    });
    setBlockReason(u.blockedReason || "");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get(`/auth/users/${id}`);
      applyUser(res.data);
    } catch (err) {
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, applyUser]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/admin/users/${id}/orders?limit=10`);
        if (cancelled) return;
        setOrders(res.data.orders || []);
        setOrdersTotal(res.data.total || 0);
      } catch (err) {
        if (!cancelled) { setOrders([]); setOrdersError(errorMessage(err)); }
      }
    })();
    (async () => {
      try {
        const res = await api.get(`/admin/users/${id}/addresses`);
        if (cancelled) return;
        setAddresses(res.data || []);
      } catch (err) {
        if (!cancelled) { setAddresses([]); setAddressesError(errorMessage(err)); }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Only a superadmin may hand out the superadmin role — the backend enforces
  // this (authController adminUpdateUser); hiding the option keeps the UI from
  // offering something that would come back 403.
  const visibleRoles = ROLE_OPTIONS.filter((r) => r.value !== "superadmin" || isSuperAdmin);

  // The backend refuses to let an admin strip their own admin role. Disabling
  // the control says so before the request rather than after.
  const editingSelf = user && me && String(user._id) === String(me._id ?? me.id);

  async function saveProfile(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      // Sanitise on submit, never on keystroke — the project convention.
      const payload = {
        name: sanitizeName(form.name),
        email: sanitizeEmail(form.email),
        phone: sanitizePhone(form.phone),
        role: form.role,
      };
      const res = await api.patch(`/auth/users/${id}`, payload);
      applyUser(res.data);
      setSavedAt(new Date());
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock() {
    setBlockBusy(true);
    setFormError("");
    try {
      const blocking = !user.isBlocked;
      const res = await api.patch(`/auth/users/${id}/block`, {
        isBlocked: blocking,
        blockedReason: blocking ? blockReason : "",
      });
      applyUser(res.data);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBlockBusy(false);
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setPwNote("");
    setPwBusy(true);
    try {
      await api.patch(`/auth/users/${id}/password`, { newPassword });
      setNewPassword("");
      setPwNote("Password updated.");
    } catch (err) {
      setPwNote(errorMessage(err));
    } finally {
      setPwBusy(false);
    }
  }

  if (!isAdminRole(me?.role)) {
    return (
      <div className="px-4 pb-24 pt-6 sm:px-6">
        <Card className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          You do not have permission to view this page.
        </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 pb-24 pt-6 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="px-4 pb-24 pt-6 sm:px-6">
        <Card className="mx-auto max-w-6xl space-y-4 p-6">
        <p className="text-sm text-error dark:text-error-dark">
          {loadError || "User not found."}
        </p>
        <Button variant="ghost" onClick={() => router.push("/dashboard/users")}>
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/dashboard/users"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <PageHeader
        title={user.name || "Unnamed user"}
        description={user.email}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={roleTones[user.role] || "neutral"} className="uppercase">
              {roleLabel(user.role)}
            </Badge>
            {user.isBlocked ? (
              <Badge tone="error">Blocked</Badge>
            ) : user.isVerified ? (
              <Badge tone="success">Verified</Badge>
            ) : (
              <Badge tone="warning">Unverified</Badge>
            )}
          </div>
        }
      />

      {formError && (
        <p className="text-sm text-error dark:text-error-dark" role="alert">{formError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Profile ───────────────────────────────────────────────────── */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <UserIcon className="h-4 w-4" /> Profile
          </h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                placeholder="+233 XX XXX XXXX"
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field
              label="Role"
              hint={
                editingSelf
                  ? "You cannot change your own role."
                  : !isSuperAdmin
                  ? "Only a super admin can assign the Super Admin role."
                  : undefined
              }
            >
              <Select
                value={form.role}
                disabled={editingSelf}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                {visibleRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>

            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving} variant="brand">Save changes</Button>
              {savedAt && (
                <span className="text-sm text-success dark:text-success-dark">
                  Saved {savedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* ── Account status + admin actions ────────────────────────────── */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
              <ShieldCheck className="h-4 w-4" /> Account
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600 dark:text-slate-400">Joined</dt>
                <dd className="text-gray-900 dark:text-white">{fmtDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600 dark:text-slate-400">Verified</dt>
                <dd className="text-gray-900 dark:text-white">{user.isVerified ? "Yes" : "No"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-600 dark:text-slate-400">Email</dt>
                <dd className="flex items-center gap-1 text-gray-900 dark:text-white">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-600 dark:text-slate-400">Phone</dt>
                <dd className="flex items-center gap-1 text-gray-900 dark:text-white">
                  <Phone className="h-3.5 w-3.5" /> {user.phone || "—"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
              {user.isBlocked ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              {user.isBlocked ? "Unblock access" : "Block access"}
            </h2>
            {!user.isBlocked && (
              <Field label="Reason (shown to the customer)">
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Why is this account being blocked?"
                />
              </Field>
            )}
            {user.isBlocked && user.blockedReason && (
              <p className="mb-3 text-sm text-gray-600 dark:text-slate-400">
                Blocked: {user.blockedReason}
              </p>
            )}
            <Button
              onClick={toggleBlock}
              loading={blockBusy}
              variant={user.isBlocked ? "ghost" : "danger"}
              fullWidth
              className="mt-3"
            >
              {user.isBlocked ? "Unblock user" : "Block user"}
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
              <Key className="h-4 w-4" /> Reset password
            </h2>
            <form onSubmit={resetPassword} className="space-y-3">
              <Field label="New password">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
              </Field>
              <Button type="submit" loading={pwBusy} fullWidth>Set password</Button>
              {pwNote && (
                <p className="text-sm text-gray-600 dark:text-slate-400">{pwNote}</p>
              )}
            </form>
          </Card>
        </div>
      </div>

      {/* ── Related records ─────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
              <ShoppingBag className="h-4 w-4" /> Orders
            </h2>
            {ordersTotal > 0 && (
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {ordersTotal} total{ordersTotal > (orders?.length || 0) ? ` · showing ${orders.length}` : ""}
              </span>
            )}
          </div>

          {/* Shop orders are guest checkouts with no user ref — they are matched
              by the email and phone captured at checkout, the same rule the
              customer's own "My Orders" uses. So an order placed with a
              different email will not appear here, and that is correct rather
              than a bug. */}
          {orders === null ? (
            <Skeleton className="h-24 w-full" />
          ) : ordersError ? (
            <p className="text-sm text-error dark:text-error-dark">{ordersError}</p>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders"
              description="No shop orders match this customer's email or phone."
            />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Order</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <Td className="font-medium text-gray-900 dark:text-white">{o.orderNumber}</Td>
                      <Td className="whitespace-nowrap">{fmtDate(o.createdAt)}</Td>
                      <Td><Badge tone={o.status === "delivered" ? "success" : o.status === "cancelled" ? "error" : "neutral"}>{o.status}</Badge></Td>
                      <Td className="text-right">{formatGhs(o.total)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>

        <div className="space-y-6">
        <GhanaCardReview userId={id} />

        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
            <MapPin className="h-4 w-4" /> Saved addresses
          </h2>
          {addresses === null ? (
            <Skeleton className="h-24 w-full" />
          ) : addressesError ? (
            <p className="text-sm text-error dark:text-error-dark">{addressesError}</p>
          ) : addresses.length === 0 ? (
            <EmptyState title="No saved addresses" />
          ) : (
            <ul className="space-y-3">
              {addresses.map((a) => (
                <li key={a._id} className="rounded-xl border border-gray-100 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{a.label || "Address"}</span>
                    {a.isDefault && <Badge tone="brand">Default</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                    {[a.street, a.neighborhood, a.city, a.region].filter(Boolean).join(", ")}
                  </p>
                  {a.phone && (
                    <p className="mt-1 text-caption text-gray-500 dark:text-slate-500">{a.phone}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
