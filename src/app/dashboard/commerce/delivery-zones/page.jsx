"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { formatGhs } from "@/lib/shop";
import { useDeliveryZones, useCreateZone, useUpdateZone, useDeleteZone } from "@/hooks/queries/useDeliveryZones";
import { Badge, Button } from "@/components/ui";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200";

function ZoneEditor({ zone, onDone }) {
  const [name, setName] = useState(zone.name || "");
  const [feeGhs, setFeeGhs] = useState((Number(zone.fee || 0) / 100).toFixed(2));
  const [days, setDays] = useState(zone.estimatedDays ?? "");
  const [isActive, setIsActive] = useState(zone.isActive ?? true);
  const updateZone = useUpdateZone();
  const saving = updateZone.isPending;

  const handleSave = () => {
    if (!name.trim() || !days) {
      alert("Name and estimated days are required.");
      return;
    }
    updateZone.mutate(
      {
        id: zone._id,
        name: name.trim(),
        fee: Math.round((parseFloat(feeGhs) || 0) * 100),
        estimatedDays: parseInt(days, 10) || 0,
        isActive,
      },
      { onSuccess: onDone, onError: (err) => alert(err.message || "Update failed") },
    );
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3 mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Zone name" />
        <input
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
          value={feeGhs}
          onChange={(e) => setFeeGhs(e.target.value)}
          placeholder="Delivery fee (GH₵)"
        />
        <input
          type="number"
          min="0"
          className={inputClass}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder="Estimated days"
        />
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Active
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onDone} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition disabled:opacity-60"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDeliveryZonesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [editingId, setEditingId] = useState(null);
  const [newZone, setNewZone] = useState({ name: "", feeGhs: "", days: "", isActive: true });

  const isAllowed = ["admin", "superadmin"].includes(user?.role);

  useEffect(() => {
    if (!authLoading && !isAllowed) router.replace("/dashboard");
  }, [authLoading, isAllowed, router]);

  const { data: zones = [], isLoading: loading } = useDeliveryZones({ enabled: !authLoading && isAllowed });
  const createZone = useCreateZone();
  const archiveZone = useUpdateZone();
  const deleteZone = useDeleteZone();
  const creating = createZone.isPending;
  const updating = deleteZone.isPending
    ? deleteZone.variables
    : archiveZone.isPending
    ? archiveZone.variables?.id
    : null;

  const handleCreate = () => {
    if (!newZone.name.trim() || !newZone.days) {
      alert("Zone name and estimated days are required.");
      return;
    }
    createZone.mutate(
      {
        name: newZone.name.trim(),
        fee: Math.round((parseFloat(newZone.feeGhs) || 0) * 100),
        estimatedDays: parseInt(newZone.days, 10) || 0,
        isActive: newZone.isActive,
      },
      {
        onSuccess: () => setNewZone({ name: "", feeGhs: "", days: "", isActive: true }),
        onError: (err) => alert(err.message || "Failed to create zone"),
      },
    );
  };

  const handleArchive = (zone) => {
    const onError = (err) => alert(err.message || "Update failed");
    if (zone.isActive) deleteZone.mutate(zone._id, { onError });
    else archiveZone.mutate({ id: zone._id, isActive: true }, { onError });
  };

  if (authLoading || !isAllowed) return null;

  return (
    <div className="min-h-screen bg-paper dark:bg-ink px-4 pt-6 pb-24">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Delivery Zones</h1>
        <p className="text-gray-500 text-sm mb-8">Define delivery fees and estimated delivery times per zone.</p>

        <div className="rounded-2xl border border-gray-100 bg-paper p-5 mb-8">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Add Zone</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              className={inputClass}
              value={newZone.name}
              onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              placeholder="Zone name"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              value={newZone.feeGhs}
              onChange={(e) => setNewZone({ ...newZone, feeGhs: e.target.value })}
              placeholder="Fee (GH₵)"
            />
            <input
              type="number"
              min="0"
              className={inputClass}
              value={newZone.days}
              onChange={(e) => setNewZone({ ...newZone, days: e.target.value })}
              placeholder="Est. days"
            />
            <button
              onClick={handleCreate}
              disabled={creating}
              className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition disabled:opacity-60"
            >
              {creating ? "..." : "+ Add Zone"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : zones.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-paper p-8 text-center">
            <p className="text-gray-600 text-sm">No delivery zones yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone._id} className={`p-4 rounded-2xl border bg-paper ${zone.isActive ? "border-gray-100" : "border-gray-200 opacity-70"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{zone.name}</p>
                      {!zone.isActive && (
                        <Badge tone="neutral">Archived</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {formatGhs(zone.fee)} · ~{zone.estimatedDays} {zone.estimatedDays === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingId(editingId === zone._id ? null : zone._id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={zone.isActive ? "danger" : "primary"}
                      size="sm"
                      onClick={() => handleArchive(zone)}
                      loading={updating === zone._id}
                    >
                      {zone.isActive ? "Archive" : "Activate"}
                    </Button>
                  </div>
                </div>
                {editingId === zone._id && (
                  <ZoneEditor zone={zone} onDone={() => setEditingId(null)} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
