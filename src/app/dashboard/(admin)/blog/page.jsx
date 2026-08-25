"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Plus, Pen, Trash2, RotateCw, Eye, EyeOff, Star, Check, PenLine } from "lucide-react";
import { isAdminRole } from "@/lib/roles";
import {
  Badge, Button, Card, EmptyState, Input, Modal, PageHeader,
  Select, Skeleton, Switch, Textarea,
} from "@/components/ui";

const CATEGORIES = ["SEO", "Web Design", "Case Study", "Social Media", "Branding", "Phone Repair", "Paid Advertising", "Email Marketing", "General"];

/*
 * Nine categories against six semantic tones, so these keep their own hues and
 * ride Badge's tone={null} escape hatch. Every pair is a Tailwind 700-on-50,
 * which clears AA; the old General used gray-600 on gray-100 and did not.
 */
const CATEGORY_COLORS = {
  SEO:               "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "Web Design":      "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
  "Case Study":      "bg-brand-50 text-brand-ink dark:bg-brand-900/20 dark:text-brand-400",
  "Social Media":    "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
  Branding:          "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  "Phone Repair":    "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
  "Paid Advertising":"bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  "Email Marketing": "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  General:           "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300",
};

const empty = { title: "", excerpt: "", content: "", category: "General", author: "EazWorld Team", featured: false, published: false };

const CONTENT_PLACEHOLDER = `## Introduction

Write your article here...

## Section Title

- Point one
- Point two

**Key takeaway:** Summary here.`;

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function PostForm({ initial, onSave, onCancel, saving, error }) {
  const [fields, setFields] = useState(initial || empty);
  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));
  const setValue = (k) => (v) => setFields((f) => ({ ...f, [k]: v }));

  const incomplete = !fields.title || !fields.excerpt || !fields.content;

  return (
    <Modal
      open
      onClose={onCancel}
      size="full"
      title={initial?._id ? "Edit post" : "New post"}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(fields)} loading={saving} disabled={incomplete}>
            {!saving && <Check size={15} aria-hidden="true" />}
            {saving ? "Saving…" : initial?._id ? "Save changes" : "Publish post"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-error/20 bg-error-surface px-3 py-2 text-caption font-medium text-error dark:border-error-dark/30 dark:bg-error-surface-dark dark:text-error-dark"
          >
            {error}
          </p>
        )}

        <Input
          label="Title"
          required
          value={fields.title}
          onChange={set("title")}
          placeholder="e.g. How to Rank on Google in Ghana"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Category" required value={fields.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Author" value={fields.author} onChange={set("author")} placeholder="EazWorld Team" />
        </div>

        <Textarea
          label="Excerpt"
          required
          rows={2}
          value={fields.excerpt}
          onChange={set("excerpt")}
          placeholder="Short summary shown on the blog list page…"
        />

        <Textarea
          label="Content"
          required
          rows={16}
          value={fields.content}
          onChange={set("content")}
          placeholder={CONTENT_PLACEHOLDER}
          hint="Markdown supported: ## Heading, **bold**, - list, 1. numbered"
          className="font-mono text-caption"
        />

        <div className="flex flex-wrap items-center gap-8 pt-1">
          <Switch
            checked={fields.published}
            onChange={setValue("published")}
            label="Published"
            tone="success"
          />
          <Switch
            checked={fields.featured}
            onChange={setValue("featured")}
            label="Featured"
          />
        </div>
      </div>
    </Modal>
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
  const [saveError, setSaveError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdminRole(user?.role)) router.replace("/dashboard");
  }, [user, authLoading, router]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/posts/admin/all");
      setPosts(res.data || []);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdminRole(user?.role)) fetchPosts();
  }, [authLoading, user?.role, fetchPosts]);

  const handleSave = async (fields) => {
    setSaving(true);
    setSaveError("");
    try {
      // The old handler swallowed a failed save silently — the dialog just sat
      // there. Now the server's own message comes back into the form.
      if (editing?._id) await api.patch(`/posts/${editing._id}`, fields);
      else await api.post("/posts", fields);
      await fetchPosts();
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      setSaveError(e?.message || "Failed to save the post.");
    } finally { setSaving(false); }
  };

  const handleToggle = async (post, key) => {
    // Optimistic: flip locally, roll back if the server disagrees.
    setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, [key]: !p[key] } : p)));
    try {
      await api.patch(`/posts/${post._id}`, { [key]: !post[key] });
    } catch {
      setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, [key]: post[key] } : p)));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${deleteTarget._id}`);
      setPosts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const handleEdit = async (post) => {
    // The list endpoint omits the body — fetch the full post before editing.
    const res = await api.get(`/posts/admin/${post._id}`);
    setEditing(res.data);
    setSaveError("");
    setShowForm(true);
  };

  const openNew = () => { setEditing(null); setSaveError(""); setShowForm(true); };

  if (authLoading || !isAdminRole(user?.role)) return null;

  const published = posts.filter((p) => p.published).length;
  const drafts    = posts.filter((p) => !p.published).length;

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title="Blog Posts"
          description={`${published} published · ${drafts} draft${drafts !== 1 ? "s" : ""}`}
          actions={
            <>
              <Button size="sm" variant="secondary" onClick={fetchPosts} disabled={loading}>
                <RotateCw size={15} aria-hidden="true" className={loading ? "animate-spin" : ""} /> Refresh
              </Button>
              <Button size="sm" onClick={openNew}>
                <Plus size={15} aria-hidden="true" /> New post
              </Button>
            </>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="mb-3 h-5 w-24 rounded-full" />
                <Skeleton className="mb-2 h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={PenLine}
              title="No posts yet"
              description="Write the first article — it goes straight onto the public blog once published."
              action={<Button onClick={openNew}>Write first post</Button>}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post._id} interactive className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge tone={null} className={CATEGORY_COLORS[post.category] || CATEGORY_COLORS.General}>
                      {post.category}
                    </Badge>
                    {post.featured && (
                      <Badge tone="brand"><Star size={11} aria-hidden="true" /> Featured</Badge>
                    )}
                    {!post.published && <Badge tone="neutral">Draft</Badge>}
                  </div>
                  <p className="text-body-sm font-semibold leading-tight text-gray-900 dark:text-white">{post.title}</p>
                  <p className="mt-1 text-caption text-gray-600 dark:text-slate-400">
                    {post.author} · {post.readTime} · {fmtDate(post.publishedAt || post.createdAt)}
                  </p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-2 ${post.published ? "text-success dark:text-success-dark" : ""}`}
                    onClick={() => handleToggle(post, "published")}
                    aria-label={post.published ? `Unpublish ${post.title}` : `Publish ${post.title}`}
                  >
                    {post.published ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-2 ${post.featured ? "text-brand-ink dark:text-brand-400" : ""}`}
                    onClick={() => handleToggle(post, "featured")}
                    aria-label={post.featured ? `Remove ${post.title} from featured` : `Mark ${post.title} as featured`}
                  >
                    <Star size={15} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    onClick={() => handleEdit(post)}
                    aria-label={`Edit ${post.title}`}
                  >
                    <Pen size={15} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-error dark:text-error-dark"
                    onClick={() => setDeleteTarget(post)}
                    aria-label={`Delete ${post.title}`}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <PostForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          saving={saving}
          error={saveError}
        />
      )}

      {/* Replaces window.confirm(), which the rest of the app no longer uses. */}
      {deleteTarget && (
        <Modal
          open
          size="sm"
          onClose={() => setDeleteTarget(null)}
          title="Delete this post?"
          description={`“${deleteTarget.title}” will be removed permanently. This cannot be undone.`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete post</Button>
            </>
          }
        >
          <p className="text-body-sm text-gray-600 dark:text-slate-400">
            If you only want it off the public blog, unpublish it instead — the draft stays here.
          </p>
        </Modal>
      )}
    </div>
  );
}
