"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { FaCamera, FaTrash, FaTimes, FaExpand, FaSpinner } from "react-icons/fa";

export default function JobPhotos({ jobId, photos = [], onUpdate, readOnly = false }) {
  const fileRef    = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [lightbox,  setLightbox]  = useState(null); // index of photo being previewed

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setError("");
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { setError("Images only."); continue; }
      if (file.size > 8 * 1024 * 1024)    { setError("Max file size is 8 MB."); continue; }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("photo", file);
        await api.upload(`/pos/jobs/${jobId}/photos`, fd);
        onUpdate?.();
      } catch (e) {
        setError(e.message || "Upload failed.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm("Remove this photo?")) return;
    try {
      await api.delete(`/pos/jobs/${jobId}/photos/${photoId}`);
      onUpdate?.();
    } catch (e) {
      setError(e.message || "Delete failed.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <FaCamera size={12} className="text-amber-400" />
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
            Device Photos
          </p>
          <span className="text-xs text-gray-600">({photos.length}/10)</span>
        </div>
        {!readOnly && photos.length < 10 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition disabled:opacity-50"
          >
            {uploading
              ? <><FaSpinner className="animate-spin" size={10} /> Uploading…</>
              : <><FaCamera size={10} /> Add Photo</>}
          </button>
        )}
      </div>

      <div className="p-4">
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        {/* Drop zone — shown when no photos yet */}
        {!readOnly && photos.length === 0 && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-amber-500/50 rounded-xl p-8 text-center cursor-pointer transition group"
          >
            {uploading ? (
              <FaSpinner size={24} className="text-amber-400 animate-spin mx-auto mb-2" />
            ) : (
              <FaCamera size={24} className="text-gray-600 group-hover:text-amber-400 mx-auto mb-2 transition" />
            )}
            <p className="text-sm text-gray-500 group-hover:text-gray-300 transition">
              {uploading ? "Uploading…" : "Click or drag photos here"}
            </p>
            <p className="text-xs text-gray-600 mt-1">JPEG, PNG, WebP · max 8 MB each · up to 10 photos</p>
          </div>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            {photos.map((photo, i) => (
              <div key={photo._id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-800">
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setLightbox(i)}
                    className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/40 flex items-center justify-center transition"
                  >
                    <FaExpand size={10} className="text-white" />
                  </button>
                  {!readOnly && (
                    <button
                      onClick={() => handleDelete(photo._id)}
                      className="w-7 h-7 rounded-lg bg-red-500/60 hover:bg-red-500 flex items-center justify-center transition"
                    >
                      <FaTrash size={9} className="text-white" />
                    </button>
                  )}
                </div>
                {/* Caption badge */}
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/60 text-xs text-gray-200 truncate">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}

            {/* Add more tile */}
            {!readOnly && photos.length < 10 && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-amber-500/50 flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-amber-400 transition disabled:opacity-50"
              >
                {uploading
                  ? <FaSpinner size={16} className="animate-spin" />
                  : <FaCamera size={16} />}
                <span className="text-xs">{uploading ? "…" : "Add"}</span>
              </button>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <FaTimes size={16} />
          </button>
          {lightbox > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(i => i - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition"
            >‹</button>
          )}
          {lightbox < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightbox(i => i + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition"
            >›</button>
          )}
          <img
            src={photos[lightbox]?.url}
            alt={photos[lightbox]?.caption || "Device photo"}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          {photos[lightbox]?.caption && (
            <p className="absolute bottom-6 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
              {photos[lightbox].caption}
            </p>
          )}
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            {lightbox + 1} / {photos.length}
          </p>
        </div>
      )}
    </div>
  );
}
