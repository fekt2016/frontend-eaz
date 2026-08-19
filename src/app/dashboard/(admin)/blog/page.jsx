"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Plus, Pen, Trash2, RotateCw, Loader2, Eye, EyeOff, Star, X, Check, PenLine } from "lucide-react";

const CATEGORIES = ["SEO", "Web Design", "Case Study", "Social Media", "Branding", "Phone Repair", "Paid Advertising", "Email Marketing", "General"];

const CATEGORY_COLORS = {
  SEO:               "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "Web Design":      "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  "Case Study":      "bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400",
  "Social Media":    "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  Branding:          "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  "Phone Repair":    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  "Paid Advertising":"bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  "Email Marketing": "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  General:           "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
};

const empty = { title: "", excerpt: "", content: "", category: "General", author: "EazWorld Team", featured: false, published: false };

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PostForm({ initial, onSave, onCancel, saving }) {
  const [fields, setFields] = useState(initial || empty);
  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (k) => () => setFields((f) => ({ ...f, [k]: !f[k] }));

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-400 transition bg-white dark:bg-slate-800";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
            {initial?._id ? "Edit Post" : "New Post"}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input type="text" value={fields.title} onChange={set("title")} placeholder="e.g. How to Rank on Google in Ghana" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Category <span className="text-red-400">*</span></label>
              <select value={fields.category} onChange={set("category")} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Author</label>
              <input type="text" value={fields.author} onChange={set("author")} placeholder="EazWorld Team" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Excerpt <span className="text-red-400">*</span></label>
            <textarea value={fields.excerpt} onChange={set("excerpt")} rows={2} placeholder="Short summary shown on the blog list page…" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">
              Content <span className="text-red-400">*</span>
              <span className="ml-2 font-normal text-gray-400">(Markdown supported: ## Heading, **bold**, - list, 1. numbered)</span>
            </label>
            <textarea value={fields.content} onChange={set("content")} rows={16} placeholder={`## Introduction\n\nWrite your article here...\n\n## Section Title\n\n- Point one\n- Point two\n\n**Key takeaway:** Summary here.`} className={`${inputCls} font-mono text-xs`} />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <button type="button" onClick={toggle("published")}
                className={`w-10 h-6 rounded-full transition ${fields.published ? "bg-emerald-500" : "bg-gray-200 dark:bg-slate-700"} relative`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${fields.published ? "left-5" : "left-1"}`} />
              </button>
              <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">Published</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <button type="button" onClick={toggle("featured")}
                className={`w-10 h-6 rounded-full transition ${fields.featured ? "bg-brand-500" : "bg-gray-200 dark:bg-slate-700"} relative`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${fields.featured ? "left-5" : "left-1"}`} />
              </button>
              <span className="text-sm text-gray-700 dark:text-slate-300 font-medium">Featured</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition">
            Cancel
          </button>
          <button
            onClick={() => onSave(fields)}
            disabled={saving || !fields.title || !fields.excerpt || !fields.content}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-brand-400 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="animate-spin" size={12} /> : <Check size={12} />}
            {saving ? "Saving…" : initial?._id ? "Save Changes" : "Publish Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/dashboard");
  }, [user, authLoading, router]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/posts/admin/all");
      const json = await res.json();
      setPosts(json.data || []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") fetchPosts();
  }, [authLoading, user?.role, fetchPosts]);

  const handleSave = async (fields) => {
    setSaving(true);
    try {
      const url    = editing?._id ? `/api/v1/posts/${editing._id}` : "/api/v1/posts";
      const method = editing?._id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        await fetchPosts();
        setShowForm(false);
        setEditing(null);
      }
    } finally { setSaving(false); }
  };

  const handleToggle = async (post, key) => {
    try {
      await fetch(`/api/v1/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !post[key] }),
      });
      setPosts((prev) => prev.map((p) => p._id === post._id ? { ...p, [key]: !p[key] } : p));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this post permanently?")) return;
    await fetch(`/api/v1/posts/${id}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  const handleEdit = async (post) => {
    // fetch full post with content
    const res = await fetch(`/api/v1/posts/admin/${post._id}`);
    const json = await res.json();
    setEditing(json.data);
    setShowForm(true);
  };

  if (authLoading || user?.role !== "admin") return null;

  const published = posts.filter((p) => p.published).length;
  const drafts    = posts.filter((p) => !p.published).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-6 pb-24">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Blog Posts</h1>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
              {published} published · {drafts} draft{drafts !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchPosts} disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 transition disabled:opacity-50">
              <RotateCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-brand-400 transition"
            >
              <Plus size={11} /> New Post
            </button>
          </div>
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <Loader2 className="animate-spin text-brand-500" size={24} />
            <span className="text-sm">Loading posts…</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <PenLine size={36} className="mb-4 mx-auto text-gray-400 dark:text-slate-500" />
            <p className="font-semibold text-gray-900 dark:text-white mb-2">No posts yet</p>
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-5">Create your first blog post.</p>
            <button onClick={() => { setEditing(null); setShowForm(true); }}
              className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 transition">
              Write First Post
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post._id} className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 transition">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.General}`}>
                      {post.category}
                    </span>
                    {post.featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 border border-brand-200 dark:border-brand-800/30">
                        <Star size={9} /> Featured
                      </span>
                    )}
                    {!post.published && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight mb-1">{post.title}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {post.author} · {post.readTime} · {fmtDate(post.publishedAt || post.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(post, "published")}
                    title={post.published ? "Unpublish" : "Publish"}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${post.published ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                  >
                    {post.published ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    onClick={() => handleToggle(post, "featured")}
                    title={post.featured ? "Remove featured" : "Mark featured"}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${post.featured ? "text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                  >
                    <Star size={13} />
                  </button>
                  <button
                    onClick={() => handleEdit(post)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition"
                  >
                    <Pen size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Post form modal */}
      {showForm && (
        <PostForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          saving={saving}
        />
      )}
    </div>
  );
}
