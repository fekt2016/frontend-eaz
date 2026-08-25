"use client";

import { Users } from "lucide-react";

const ALL_STAFF = "";

// Admin/superadmin only — lets them switch the Reports page between the
// shop-wide view and one staff member's own activity (T32). `staffList`
// comes from the analytics response itself (`data.scope.staffList`), so no
// separate request is needed to populate it.
export default function StaffPicker({ staffId, onChange, staffList }) {
  return (
    <div className="flex items-center gap-2">
      <Users size={12} className="text-gray-400 hidden sm:block" aria-hidden="true" />
      <label className="sr-only" htmlFor="reports-staff">Staff member</label>
      <select
        id="reports-staff"
        value={staffId || ALL_STAFF}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
      >
        <option value={ALL_STAFF}>All Staff (shop-wide)</option>
        {(staffList || []).map((s) => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
