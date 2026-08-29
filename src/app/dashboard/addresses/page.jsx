"use client";

import { useMemo, useState } from "react";
import { Home, MapPin, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import {
  useAddresses,
  useCreateAddress,
  useUpdateAddress,
  useSetDefaultAddress,
  useDeleteAddress,
} from "@/hooks/queries/useAddresses";
import {
  useLocationRegions,
  useLocationCities,
  useNeighborhoodOptions,
} from "@/hooks/queries/useLocations";
import { sanitizeText } from "@/lib/sanitize";

const inputCls =
  "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 transition bg-white dark:bg-slate-900";
const labelCls = "block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1.5";

// Mirrors the server's cap (controllers/addressController.js MAX_ADDRESSES).
const MAX_ADDRESSES = 3;

const EMPTY = { label: "", street: "", region: "", city: "", neighborhood: "", phone: "" };

function addressLine(a) {
  return [a.street, a.neighborhood, a.city, a.region]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Add/edit form. Region → city → neighbourhood is a cascade, not three free
 * text fields: the region decides whether the address is in the Greater-Accra
 * delivery core or is a regional bus-station pickup, and the neighbourhood
 * carries the id that prices the delivery. Typed by hand, none of that resolves
 * and checkout silently offers no delivery options at all.
 */
function AddressForm({ initial, onCancel, onSubmit, saving, error }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });

  const regionsQuery = useLocationRegions();
  const regions = regionsQuery.data ?? [];
  const citiesQuery = useLocationCities(form.region);
  const cities = useMemo(() => citiesQuery.data ?? [], [citiesQuery.data]);
  const neighborhoodsQuery = useNeighborhoodOptions(form.city);
  const neighborhoods = useMemo(() => neighborhoodsQuery.data ?? [], [neighborhoodsQuery.data]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Changing a level up the cascade invalidates everything below it — keeping
  // a city from the previous region would submit a combination that resolves
  // to no zone.
  const setRegion = (e) =>
    setForm((f) => ({ ...f, region: e.target.value, city: "", neighborhood: "" }));
  const setCity = (e) => setForm((f) => ({ ...f, city: e.target.value, neighborhood: "" }));

  const submit = (e) => {
    e.preventDefault();
    // Sanitise on submit, never on keystroke (STYLE_GUIDE).
    const clean = {
      label: sanitizeText(form.label),
      street: sanitizeText(form.street),
      neighborhood: sanitizeText(form.neighborhood),
      city: sanitizeText(form.city),
      region: sanitizeText(form.region),
      phone: sanitizeText(form.phone),
    };
    const match = neighborhoods.find(
      (n) => String(n.name).trim().toLowerCase() === clean.neighborhood.trim().toLowerCase(),
    );
    onSubmit({ ...clean, neighborhoodId: match?.id || null });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="addr-label" className={labelCls}>
          Label <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
        </label>
        <input
          id="addr-label"
          value={form.label}
          onChange={set("label")}
          placeholder="Home, Office…"
          maxLength={60}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="addr-street" className={labelCls}>
          Street address
        </label>
        <input
          id="addr-street"
          value={form.street}
          onChange={set("street")}
          placeholder="House number and street"
          maxLength={200}
          className={inputCls}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="addr-region" className={labelCls}>
            Region
          </label>
          <select id="addr-region" value={form.region} onChange={setRegion} className={inputCls}>
            <option value="">Select a region</option>
            {regions.map((r) => (
              <option key={r.region || r} value={r.region || r}>
                {r.region || r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="addr-city" className={labelCls}>
            City
          </label>
          <select
            id="addr-city"
            value={form.city}
            onChange={setCity}
            disabled={!form.region}
            className={`${inputCls} disabled:opacity-50`}
          >
            <option value="">{form.region ? "Select a city" : "Pick a region first"}</option>
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="addr-neighborhood" className={labelCls}>
            Area / neighbourhood
          </label>
          <select
            id="addr-neighborhood"
            value={form.neighborhood}
            onChange={set("neighborhood")}
            disabled={!form.city || neighborhoods.length === 0}
            className={`${inputCls} disabled:opacity-50`}
          >
            <option value="">
              {!form.city
                ? "Pick a city first"
                : neighborhoods.length === 0
                ? "No priced areas for this city"
                : "Select your area"}
            </option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-slate-500">
            Your area sets the delivery price at checkout.
          </p>
        </div>

        <div>
          <label htmlFor="addr-phone" className={labelCls}>
            Phone for this address{" "}
            <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
          </label>
          <input
            id="addr-phone"
            value={form.phone}
            onChange={set("phone")}
            placeholder="Leave blank to use your account number"
            maxLength={30}
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-full bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 transition"
        >
          {saving ? "Saving…" : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const { data: addresses = [], isLoading } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const setDefault = useSetDefaultAddress();
  const deleteAddress = useDeleteAddress();

  // `null` = closed, "new" = the add form, an id = editing that address.
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const atLimit = addresses.length >= MAX_ADDRESSES;
  const saving = createAddress.isPending || updateAddress.isPending;

  const handleSubmit = async (body) => {
    setError("");
    try {
      if (editing === "new") await createAddress.mutateAsync(body);
      else await updateAddress.mutateAsync({ id: editing, ...body });
      setEditing(null);
    } catch (err) {
      setError(err?.message || "We could not save that address. Please check the fields and try again.");
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await deleteAddress.mutateAsync(id);
      setConfirmDelete(null);
    } catch (err) {
      setError(err?.message || "We could not delete that address.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white">
            Delivery Addresses
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-500 mt-0.5">
            Where we deliver your orders. Your default address is filled in at checkout.
          </p>
        </div>
        {editing === null && !atLimit && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setEditing("new");
            }}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition"
          >
            <Plus size={14} />
            Add address
          </button>
        )}
      </div>

      {editing === "new" && (
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">New address</h2>
          <AddressForm
            initial={EMPTY}
            onCancel={() => setEditing(null)}
            onSubmit={handleSubmit}
            saving={saving}
            error={error}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-600 dark:text-slate-500">Loading your addresses…</p>
      ) : addresses.length === 0 && editing === null ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 p-10 text-center">
          <MapPin size={28} className="mx-auto text-gray-400 dark:text-slate-600" />
          <p className="mt-3 font-semibold text-gray-900 dark:text-white">No saved addresses yet</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-500">
            Add one here, or save it as you check out.
          </p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 transition"
          >
            <Plus size={14} />
            Add address
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((addr) => (
            <li
              key={addr._id}
              className={`rounded-2xl border p-5 ${
                addr.isDefault
                  ? "border-brand-300 bg-brand-50 dark:border-brand-500/50 dark:bg-brand-500/10"
                  : "border-gray-100 dark:border-slate-800 bg-paper dark:bg-slate-900"
              }`}
            >
              {editing === addr._id ? (
                <>
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Edit address</h2>
                  <AddressForm
                    initial={addr}
                    onCancel={() => setEditing(null)}
                    onSubmit={handleSubmit}
                    saving={saving}
                    error={error}
                  />
                </>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Home size={14} className="text-gray-500 dark:text-slate-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {addr.label || "Address"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500 text-white">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-gray-700 dark:text-slate-300 break-words">
                      {addressLine(addr) || "—"}
                    </p>
                    {addr.phone && (
                      <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-500">{addr.phone}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDefault.mutate(addr._id)}
                        aria-label={`Make ${addr.label || addressLine(addr)} the default address`}
                        title="Make default"
                        className="p-2 rounded-full text-gray-500 hover:text-brand-500 hover:bg-white dark:hover:bg-slate-800 transition"
                      >
                        <Star size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setEditing(addr._id);
                      }}
                      aria-label={`Edit ${addr.label || addressLine(addr)}`}
                      title="Edit"
                      className="p-2 rounded-full text-gray-500 hover:text-brand-500 hover:bg-white dark:hover:bg-slate-800 transition"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(addr._id)}
                      aria-label={`Delete ${addr.label || addressLine(addr)}`}
                      title="Delete"
                      className="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}

              {confirmDelete === addr._id && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                  <p className="text-sm text-red-700 dark:text-red-300">Delete this address?</p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDelete(addr._id)}
                      disabled={deleteAddress.isPending}
                      className="px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-60 transition"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      aria-label="Cancel delete"
                      className="p-1.5 rounded-full text-red-700 dark:text-red-300 hover:bg-white/60 dark:hover:bg-slate-800 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {atLimit && editing === null && (
        <p className="mt-4 text-xs text-gray-600 dark:text-slate-500">
          You have reached the maximum of {MAX_ADDRESSES} saved addresses — delete one to add another.
        </p>
      )}

      {error && editing === null && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
