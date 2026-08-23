"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { api } from "@/lib/api";

const btnGhostClass =
  "inline-flex items-center gap-1.5 rounded-full border border-gray-300 dark:border-slate-600 px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:border-gray-900 dark:hover:border-slate-400 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-50";

// Cloudinary upload via the shared /api/v1/uploads route (same pattern as the
// POS job photos / hosting proof uploads elsewhere in the admin). Originally
// lived only inside ProductForm.jsx (gallery/variant images); extracted here
// so the inventory Part form (T33) can reuse it instead of duplicating it.
export default function UploadButton({ accept = "image/*", onUploaded, label = "Upload" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.upload("/uploads", fd);
      const url = res?.data?.url;
      if (!url) throw new Error("Upload did not return a URL");
      onUploaded(url);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shrink-0">
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={`${btnGhostClass} ${busy ? "cursor-wait" : ""}`}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
        {busy ? "Uploading…" : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
