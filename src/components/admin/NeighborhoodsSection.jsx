"use client";

import { errorMessage } from "@/lib/api";
import { useState } from "react";
import { MapPinned, RefreshCw, Plus, AlertTriangle, Ruler } from "lucide-react";
import {
  useAdminNeighborhoods,
  useNeighborhoodCoverage,
  useCreateNeighborhood,
  useUpdateNeighborhood,
  useDeactivateNeighborhood,
  useRecalculateNeighborhood,
  useRecalculateAllNeighborhoods,
} from "@/hooks/queries/useShippingAdmin";
import { Alert, Badge, Button, Input, Select, Skeleton, Switch } from "@/components/ui";

const ZONE_KEYS = ["A", "B", "C", "D", "E", "F"];

// A → F reads near → far, so the tone ramps calm → hot. Zone is the single
// most scannable fact in a 116-row list.
const ZONE_TONE = { A: "success", B: "success", C: "info", D: "warning", E: "warning", F: "error" };

/**
 * How the distance behind a zone was obtained. This badge is the honest-data
 * guard: an estimate must never be mistaken for a measurement, because the
 * zone assignment is only as trustworthy as the number under it.
 */
function SourceBadge({ source }) {
  if (source === "google") return <Badge tone="success">Measured</Badge>;
  if (source === "manual") return <Badge tone="info">Manual</Badge>;
  return <Badge tone="warning">Estimated</Badge>;
}

function NeighborhoodRow({ row, onSave, onRecalculate, onDeactivate, saving, recalculatingId, mapsReady }) {
  const [editing, setEditing] = useState(false);
  const [zone, setZone] = useState(row.assignedZone);
  const [km, setKm] = useState(row.distanceKm ?? "");

  const dirty = zone !== row.assignedZone || String(km) !== String(row.distanceKm ?? "");
  const recalculating = recalculatingId === row._id;

  const save = () => {
    const value = Number(km);
    if (!Number.isFinite(value) || value < 0) return;
    onSave({ id: row._id, assignedZone: zone, distanceKm: value });
    setEditing(false);
  };

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition ${
        row.isActive
          ? "border-gray-200 dark:border-slate-700"
          : "border-dashed border-gray-300 opacity-60 dark:border-slate-700"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{row.name}</p>
            <Badge tone={ZONE_TONE[row.assignedZone] || "neutral"}>Zone {row.assignedZone}</Badge>
            {row.zoneOverride && (
              <Badge tone="neutral" title="Set by hand — automated recalculation leaves this alone">
                <AlertTriangle size={10} aria-hidden="true" /> Override
              </Badge>
            )}
            {!row.isActive && <Badge tone="neutral">Inactive</Badge>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 dark:text-slate-400">
            <span>{row.city} · {row.municipality}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Ruler size={11} aria-hidden="true" />
              {row.distanceKm != null ? `${row.distanceKm} km` : "no distance"}
            </span>
            <SourceBadge source={row.distanceSource} />
          </p>
        </div>

        {!editing ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={recalculating}
              disabled={!mapsReady || recalculating}
              onClick={() => onRecalculate(row._id)}
              title={mapsReady ? "Re-measure from the warehouse" : "Google Maps is not configured"}
            >
              <RefreshCw size={12} className={recalculating ? "animate-spin" : ""} aria-hidden="true" />
              Measure
            </Button>
            {row.isActive && (
              <Button size="sm" variant="ghost" onClick={() => onDeactivate(row)}>
                Disable
              </Button>
            )}
          </div>
        ) : (
          <div className="flex shrink-0 flex-wrap items-end gap-2">
            <Select
              label="Zone"
              size="sm"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-24"
            >
              {ZONE_KEYS.map((k) => (
                <option key={k} value={k}>Zone {k}</option>
              ))}
            </Select>
            <Input
              label="Distance (km)"
              size="sm"
              type="number"
              min="0"
              step="0.1"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              className="w-28"
            />
            <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setZone(row.assignedZone);
                setKm(row.distanceKm ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {editing && zone !== row.assignedZone && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-500">
          Changing the zone by hand marks this area as an override, so re-measuring will
          keep your choice instead of recalculating it.
        </p>
      )}
    </div>
  );
}

function AddNeighborhoodForm({ onCreate, saving, onCancel }) {
  const [form, setForm] = useState({
    name: "", city: "Accra", municipality: "",
    lat: "", lng: "", distanceKm: "", assignedZone: "A",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onCreate({
      ...form,
      lat: Number(form.lat),
      lng: Number(form.lng),
      distanceKm: Number(form.distanceKm),
      distanceSource: "manual",
    });
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/40"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" value={form.name} onChange={set("name")} required placeholder="e.g. Achimota" />
        <Input label="City" value={form.city} onChange={set("city")} required />
        <Input label="Municipality" value={form.municipality} onChange={set("municipality")} required placeholder="e.g. Okaikwei North" />
        <Select label="Zone" value={form.assignedZone} onChange={set("assignedZone")}>
          {ZONE_KEYS.map((k) => <option key={k} value={k}>Zone {k}</option>)}
        </Select>
        <Input label="Latitude" type="number" step="any" value={form.lat} onChange={set("lat")} required placeholder="5.6128" />
        <Input label="Longitude" type="number" step="any" value={form.lng} onChange={set("lng")} required placeholder="-0.2343" />
        <Input
          label="Distance (km)"
          hint="From the warehouse. Measure it later if you don't know."
          type="number" min="0" step="0.1"
          value={form.distanceKm} onChange={set("distanceKm")} required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving}>Add area</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/**
 * Neighbourhood management for the A–F distance zones.
 *
 * Every serviceable area is pre-assigned to a zone, which is what lets checkout
 * price a delivery with one indexed read and no Google call. This screen is
 * where those assignments — and the distances behind them — are maintained.
 */
export default function NeighborhoodsSection() {
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [recalculatingId, setRecalculatingId] = useState(null);

  const listQ = useAdminNeighborhoods({
    city, zone, q,
    ...(includeInactive ? { includeInactive: "true" } : {}),
  });
  const coverageQ = useNeighborhoodCoverage();

  const create = useCreateNeighborhood();
  const update = useUpdateNeighborhood();
  const deactivate = useDeactivateNeighborhood();
  const recalcOne = useRecalculateNeighborhood();
  const recalcAll = useRecalculateAllNeighborhoods();

  const rows = listQ.data ?? [];
  const coverage = coverageQ.data ?? {};
  const mapsReady = Boolean(coverage.measured != null);

  // From the coverage endpoint, not from `rows` — deriving it from the filtered
  // list would drop every other city from the dropdown the moment you filter by
  // one, leaving no way back without clearing the filter.
  const cities = coverage.cities ?? [];

  const handleSave = (body) => {
    setStatus({ type: "", message: "" });
    update.mutate(body, {
      onSuccess: () => setStatus({ type: "success", message: "Area updated." }),
      onError: (err) => setStatus({ type: "error", message: errorMessage(err, "Update failed.") }),
    });
  };

  const handleRecalculate = (id) => {
    setStatus({ type: "", message: "" });
    setRecalculatingId(id);
    recalcOne.mutate(id, {
      onSuccess: (res) => {
        const d = res?.data ?? {};
        setStatus({
          type: "success",
          message: d.zoneChanged
            ? `${d.name}: ${d.distanceKm} km — moved from zone ${d.previousZone} to ${d.assignedZone}.`
            : `${d.name}: ${d.distanceKm} km — stays in zone ${d.assignedZone}.`,
        });
      },
      onError: (err) => setStatus({ type: "error", message: errorMessage(err, "Measurement failed.") }),
      onSettled: () => setRecalculatingId(null),
    });
  };

  const handleRecalculateAll = () => {
    setStatus({ type: "", message: "" });
    recalcAll.mutate(
      { ...(city ? { city } : {}), limit: 25 },
      {
        onSuccess: (res) => {
          const m = res?.meta ?? {};
          setStatus({
            type: m.failed ? "warning" : "success",
            message:
              `Measured ${m.succeeded ?? 0} area(s), ${m.zoneChanges?.length ?? 0} zone change(s).` +
              (m.failed ? ` ${m.failed} failed.` : "") +
              (m.remaining ? ` ${m.remaining} still on estimates — run again to continue.` : ""),
          });
        },
        onError: (err) => setStatus({ type: "error", message: errorMessage(err, "Batch measurement failed.") }),
      },
    );
  };

  const handleDeactivate = (row) => {
    if (!window.confirm(`Stop delivering to ${row.name}? Existing orders keep their zone.`)) return;
    deactivate.mutate(row._id, {
      onSuccess: () => setStatus({ type: "success", message: `${row.name} disabled.` }),
      onError: (err) => setStatus({ type: "error", message: errorMessage(err, "Failed.") }),
    });
  };

  const estimatedCount = coverage.estimated ?? 0;

  return (
    <div className="mt-6 border-t border-gray-200 pt-5 dark:border-slate-800">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-body-sm font-semibold text-gray-900 dark:text-white">
            <MapPinned size={14} aria-hidden="true" /> Delivery areas
          </p>
          <p className="mt-0.5 text-caption text-gray-600 dark:text-slate-400">
            Each area is pre-assigned to a distance zone, so checkout prices a delivery
            without calling Google.
          </p>
        </div>
        {!showAdd && (
          <Button size="sm" variant="secondary" onClick={() => setShowAdd(true)}>
            <Plus size={13} aria-hidden="true" /> Add area
          </Button>
        )}
      </div>

      {/* ── Coverage summary ── */}
      {coverageQ.isLoading ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Areas", value: coverage.total ?? 0 },
            { label: "Measured", value: coverage.measured ?? 0 },
            { label: "Estimated", value: estimatedCount },
            { label: "Overrides", value: coverage.overrides ?? 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 px-3 py-2 dark:border-slate-700"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-caption text-gray-600 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {coverage.byZone?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {coverage.byZone.map((z) => (
            <Badge key={z.zone} tone={ZONE_TONE[z.zone] || "neutral"}>
              Zone {z.zone}: {z.count}
            </Badge>
          ))}
        </div>
      )}

      {estimatedCount > 0 && (
        <Alert tone="warning" className="mt-3">
          {estimatedCount} area{estimatedCount === 1 ? " is" : "s are"} priced from an estimated
          distance rather than a measured one. Measuring needs Google Maps billing enabled on the
          Cloud project — until then these stay estimates, and areas marked “Override” keep the
          zone you set.
        </Alert>
      )}

      {showAdd && (
        <div className="mt-3">
          <AddNeighborhoodForm
            saving={create.isPending}
            onCancel={() => setShowAdd(false)}
            onCreate={(body) =>
              create.mutate(body, {
                onSuccess: () => {
                  setShowAdd(false);
                  setStatus({ type: "success", message: "Area added." });
                },
                onError: (err) => setStatus({ type: "error", message: errorMessage(err, "Could not add.") }),
              })
            }
          />
        </div>
      )}

      {/* ── Filters ── */}
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input
          label="Search"
          hideLabel
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search areas…"
        />
        <Select label="City" hideLabel value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Select label="Zone" hideLabel value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="">All zones</option>
          {ZONE_KEYS.map((k) => <option key={k} value={k}>Zone {k}</option>)}
        </Select>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-caption text-gray-600 dark:text-slate-400">
          <Switch
            checked={includeInactive}
            onChange={setIncludeInactive}
            aria-label="Show disabled areas"
          />
          Show disabled
        </label>
        <Button
          size="sm"
          variant="secondary"
          loading={recalcAll.isPending}
          disabled={recalcAll.isPending}
          onClick={handleRecalculateAll}
          title="Measures up to 25 unmeasured areas per run"
        >
          <RefreshCw size={12} className={recalcAll.isPending ? "animate-spin" : ""} aria-hidden="true" />
          Measure estimated{city ? ` in ${city}` : ""}
        </Button>
      </div>

      {status.message && (
        <div className="mt-3">
          <Alert tone={status.type || "info"}>{status.message}</Alert>
        </div>
      )}

      {/* ── List ── */}
      <div className="mt-3 space-y-1.5">
        {listQ.isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-slate-500">
            No delivery areas match those filters.
          </p>
        ) : (
          <>
            <p className="text-caption text-gray-500 dark:text-slate-500">
              {rows.length} area{rows.length === 1 ? "" : "s"}
            </p>
            {rows.map((row) => (
              <NeighborhoodRow
                key={row._id}
                row={row}
                mapsReady={mapsReady}
                saving={update.isPending}
                recalculatingId={recalculatingId}
                onSave={handleSave}
                onRecalculate={handleRecalculate}
                onDeactivate={handleDeactivate}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
