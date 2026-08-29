"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { canHandleChats, isAdminRole } from "@/lib/roles";
import {
  RotateCw, CheckCircle2, Trash2,
  Mail, MessagesSquare, Send, UserShield, Bell,
  Handshake, Eye, BarChart3,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import {
  Badge, Button, Card, ConfirmDialog, EmptyState,
  Input, Modal, PageHeader, Skeleton,
} from "@/components/ui";
import QualityMetrics from "./QualityMetrics";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function renderText(text) {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

/** Which of the three mutually-exclusive states a session is in. */
function sessionState(s) {
  if (s.resolved) return "closed";
  if (s.humanAccepted) return "live";
  if (s.humanRequested) return "pending";
  return "bot";
}

const STATE_BADGE = {
  pending: { tone: "brand",   label: "Pending" },
  live:    { tone: "success", label: "Live" },
  closed:  { tone: "neutral", label: "Closed" },
};

/** T69 — the agent who owns a session, or null while nobody has claimed it. */
function ownerOf(s) {
  return s?.acceptedBy ? { id: String(s.acceptedBy), name: s.acceptedByName || "another agent" } : null;
}

/** T69 phase 4 — the customer's star rating, e.g. "★★★★☆". */
function stars(rating) {
  return "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
}

export default function AdminChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const myId = String(user?._id || user?.id || "");
  const [sessions, setSessions]            = useState([]);
  const [loading, setLoading]              = useState(true);
  const [filter, setFilter]                = useState("all");
  const [openSessions, setOpenSessions]    = useState({});
  const [replies, setReplies]              = useState({});
  const [sendingSessions, setSendingSessions] = useState({});
  const [newAlert, setNewAlert]            = useState(false);
  const [deleteTarget, setDeleteTarget]    = useState(null);
  const [deleting, setDeleting]            = useState(false);
  const [showMetrics, setShowMetrics]      = useState(false);
  const messagesEndRefs                    = useRef({});
  const prevPendingCount                   = useRef(0);

  const refreshSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const json = await api.get("/chat/sessions");
      const raw = json.data || [];
      // Deduplicate by sessionId (safety net)
      const seen = new Set();
      const data = raw.filter((s) => {
        if (seen.has(s.sessionId)) return false;
        seen.add(s.sessionId);
        return true;
      });
      setSessions(data);

      const pendingNow = data.filter((s) => s.humanRequested && !s.humanAccepted && !s.resolved).length;
      if (silent && pendingNow > prevPendingCount.current) {
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 4000);
      }
      prevPendingCount.current = pendingNow;
    } catch { if (!silent) setSessions([]); }
    finally  { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && !canHandleChats(user?.role)) router.replace("/dashboard");
  }, [authLoading, user?.role, router]);

  useEffect(() => {
    if (!authLoading && canHandleChats(user?.role)) refreshSessions(false);
  }, [authLoading, user?.role, refreshSessions]);

  useEffect(() => {
    if (authLoading || !canHandleChats(user?.role)) return;
    const id = setInterval(() => refreshSessions(true), 8000);
    return () => clearInterval(id);
  }, [authLoading, user?.role, refreshSessions]);

  const applyToSession = (sessionId, patch) => {
    setSessions((prev) => prev.map((s) => (s.sessionId === sessionId ? { ...s, ...patch } : s)));
    setOpenSessions((prev) => prev[sessionId] ? { ...prev, [sessionId]: { ...prev[sessionId], ...patch } } : prev);
  };

  const openSession = (s) => {
    setOpenSessions((prev) => ({ ...prev, [s.sessionId]: s }));
  };

  const closeSession = (sessionId) => {
    setOpenSessions((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
    setReplies((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
  };

  const acceptChat = async (sessionId) => {
    try {
      const json = await api.post(`/chat/sessions/${sessionId}/accept`);
      applyToSession(sessionId, {
        humanAccepted:  true,
        acceptedBy:     json.data?.acceptedBy ?? myId,
        acceptedByName: json.data?.acceptedByName ?? user?.name,
      });
    } catch {}
  };

  const claimChat = async (sessionId) => {
    try {
      const json = await api.post(`/chat/sessions/${sessionId}/claim`);
      applyToSession(sessionId, {
        acceptedBy:     json.data?.acceptedBy ?? myId,
        acceptedByName: json.data?.acceptedByName ?? user?.name,
      });
    } catch {}
  };

  const toggleResolved = async (sessionId, current) => {
    try {
      await api.patch(`/chat/sessions/${sessionId}`, { resolved: !current });
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === sessionId
            ? { ...s, resolved: !current, humanRequested: !current ? false : s.humanRequested }
            : s
        )
      );
      setOpenSessions((prev) =>
        prev[sessionId]
          ? { ...prev, [sessionId]: { ...prev[sessionId], resolved: !current, humanRequested: !current ? false : prev[sessionId].humanRequested } }
          : prev
      );
    } catch (err) {
      console.error("[chat] toggleResolved failed:", err);
    }
  };

  const confirmDelete = async () => {
    const sessionId = deleteTarget?.sessionId;
    if (!sessionId) return;
    setDeleting(true);
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      closeSession(sessionId);
      setDeleteTarget(null);
    } catch {} finally { setDeleting(false); }
  };

  const sendReply = async (e, session) => {
    e.preventDefault();
    const sessionId = session.sessionId;
    const text = replies[sessionId] || "";
    if (!text.trim()) return;
    setSendingSessions((prev) => ({ ...prev, [sessionId]: true }));
    try {
      const json = await api.post(`/chat/sessions/${sessionId}/reply`, { message: text.trim() });
      if (json.success) {
        const newMsg = {
          role:       "admin",
          content:    text.trim(),
          createdAt:  new Date().toISOString(),
          senderId:   json.data?.senderId ?? myId,
          senderName: json.data?.senderName ?? user?.name,
        };
        setOpenSessions((prev) =>
          prev[sessionId]
            ? { ...prev, [sessionId]: { ...prev[sessionId], resolved: false, messages: [...(prev[sessionId].messages || []), newMsg] } }
            : prev
        );
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === sessionId
              ? { ...s, resolved: false, messages: [...(s.messages || []), newMsg], lastActivity: new Date().toISOString() }
              : s
          )
        );
        setReplies((prev) => ({ ...prev, [sessionId]: "" }));
      }
    } catch {}
    finally { setSendingSessions((prev) => ({ ...prev, [sessionId]: false })); }
  };

  // Auto-scroll per modal
  useEffect(() => {
    Object.keys(openSessions).forEach((sid) => {
      const count = openSessions[sid]?.messages?.length || 0;
      const prevCount = messagesEndRefs.current[`${sid}_prevCount`] || 0;
      if (count > prevCount) {
        messagesEndRefs.current[sid]?.scrollIntoView({ behavior: "smooth" });
      }
      messagesEndRefs.current[`${sid}_prevCount`] = count;
    });
  }, [openSessions]);

  // Live-poll all open sessions every 5 s
  useEffect(() => {
    const ids = Object.keys(openSessions);
    if (ids.length === 0) return;

    const poll = async () => {
      for (const id of ids) {
        try {
          const json = await api.get(`/chat/sessions/${id}`);
          if (!json.success || !json.data) continue;
          const fresh = json.data;
          setOpenSessions((prev) => {
            const cur = prev[id];
            if (!cur) return prev;
            const hasNewMessages = (fresh.messages?.length ?? 0) > (cur.messages?.length ?? 0);
            const stateChanged = fresh.resolved !== cur.resolved
              || fresh.humanAccepted !== cur.humanAccepted
              || String(fresh.acceptedBy || "") !== String(cur.acceptedBy || "");
            if (!hasNewMessages && !stateChanged) return prev;
            return { ...prev, [id]: fresh };
          });
          setSessions((prev) => prev.map((s) => (s.sessionId === id ? { ...s, ...fresh } : s)));
        } catch { /* ignore */ }
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [openSessions]);

  if (authLoading || !canHandleChats(user?.role)) return null;

  const totalOpen     = sessions.filter((s) => !s.resolved).length;
  const totalResolved = sessions.filter((s) =>  s.resolved).length;
  const pendingCount  = sessions.filter((s) =>  s.humanRequested && !s.humanAccepted && !s.resolved).length;
  const liveCount     = sessions.filter((s) =>  s.humanAccepted  && !s.resolved).length;

  const visibleSessions =
    filter === "pending"
      ? sessions.filter((s) => s.humanRequested && !s.humanAccepted && !s.resolved)
      : filter === "live"
        ? sessions.filter((s) => s.humanAccepted && !s.resolved)
        : filter === "open"
          ? sessions.filter((s) => !s.resolved)
          : filter === "resolved"
            ? sessions.filter((s) => s.resolved)
            : sessions;

  const FILTERS = [
    { value: "all",      label: "All" },
    { value: "open",     label: "Open",     count: totalOpen },
    { value: "pending",  label: "Pending",  count: pendingCount },
    { value: "live",     label: "Live",     count: liveCount },
    ...(isAdminRole(user?.role) ? [{ value: "resolved", label: "Resolved" }] : []),
  ];

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Chat Sessions"
          description={`${sessions.length} total · ${totalOpen} open · ${totalResolved} resolved`}
          actions={
            <>
              {pendingCount > 0 && (
                <Badge tone="brand"><Bell size={12} aria-hidden="true" /> {pendingCount} pending</Badge>
              )}
              {liveCount > 0 && (
                <Badge tone="success">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success dark:bg-success-dark" />
                  {liveCount} live
                </Badge>
              )}
              {isAdminRole(user?.role) && (
                <Button
                  size="sm"
                  variant={showMetrics ? "primary" : "secondary"}
                  aria-pressed={showMetrics}
                  onClick={() => setShowMetrics((v) => !v)}
                >
                  <BarChart3 size={15} aria-hidden="true" /> Quality
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => refreshSessions(false)} disabled={loading}>
                <RotateCw size={15} aria-hidden="true" className={loading ? "animate-spin" : ""} /> Refresh
              </Button>
            </>
          }
        />

        {isAdminRole(user?.role) && showMetrics && <QualityMetrics />}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total",    value: sessions.length, accent: false },
            { label: "Open",     value: totalOpen,       accent: totalOpen > 0 },
            { label: "Pending",  value: pendingCount,    accent: pendingCount > 0 },
            { label: "Live",     value: liveCount,       accent: liveCount > 0, success: true },
            { label: "Resolved", value: totalResolved,   accent: false },
          ].map(({ label, value, accent, success }) => (
            <Card key={label} padding="sm" className="text-center">
              <p className={`text-2xl font-bold tabular-nums ${
                !accent
                  ? "text-gray-900 dark:text-white"
                  : success
                    ? "text-success dark:text-success-dark"
                    : "text-brand-ink dark:text-brand-400"
              }`}>
                {value}
              </p>
              <p className="mt-1 text-caption text-gray-600 dark:text-slate-400">{label}</p>
            </Card>
          ))}
        </div>

        {/* New pending alert */}
        {newAlert && (
          <div
            role="status"
            className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/20"
          >
            <Bell size={16} aria-hidden="true" className="flex-shrink-0 text-brand-ink dark:text-brand-400" />
            <p className="text-body-sm font-semibold text-brand-ink dark:text-brand-400">
              New live chat request — a user is waiting for your response.
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="mb-6 flex w-fit flex-wrap gap-2" role="group" aria-label="Filter sessions">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? "primary" : "secondary"}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}{f.count ? ` (${f.count})` : ""}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} padding="sm">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : visibleSessions.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={MessagesSquare}
              title={
                filter === "pending"
                  ? "No sessions awaiting approval"
                  : filter === "live"
                    ? "No active live chats"
                    : "No chat sessions yet"
              }
              description={
                filter === "pending"
                  ? "Users who request a human agent appear here for you to accept."
                  : filter === "live"
                    ? "Accepted live chats appear here."
                    : "Conversations from the website chat widget appear here."
              }
              action={
                filter !== "all" ? (
                  <Button variant="secondary" onClick={() => setFilter("all")}>Show all sessions</Button>
                ) : null
              }
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {visibleSessions.map((s) => {
              const state = sessionState(s);
              const isOpen = !!openSessions[s.sessionId];
              return (
                <button
                  key={s.sessionId}
                  type="button"
                  onClick={() => openSession(s)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    isOpen
                      ? "border-brand-400 bg-brand-50/60 dark:border-brand-600 dark:bg-brand-900/10"
                      : state === "live"
                        ? "border-success/30 bg-white hover:border-success/60 dark:border-success-dark/30 dark:bg-slate-900"
                        : state === "pending"
                          ? "border-brand-200 bg-white hover:border-brand-300 dark:border-brand-900/40 dark:bg-slate-900"
                          : state === "closed"
                            ? "border-gray-200 bg-white opacity-60 dark:border-slate-800 dark:bg-slate-900"
                            : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-caption font-bold ${
                        state === "live"
                          ? "bg-success-surface text-success dark:bg-success-surface-dark dark:text-success-dark"
                          : "bg-brand-100 text-brand-ink dark:bg-brand-900/30 dark:text-brand-400"
                      }`}>
                        {s.name ? s.name.charAt(0).toUpperCase() : "?"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-body-sm font-semibold text-gray-900 dark:text-white">
                          {s.name || "Anonymous"}
                        </span>
                        <span className="block truncate text-caption text-gray-600 dark:text-slate-400">
                          {s.email || "No contact info"}
                        </span>
                      </span>
                    </span>
                    <span className="flex flex-shrink-0 flex-col items-end gap-1">
                      {STATE_BADGE[state] && (
                        <Badge tone={STATE_BADGE[state].tone}>
                          {state === "pending" && <Bell size={11} aria-hidden="true" />}
                          {state === "live" && (
                            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success dark:bg-success-dark" />
                          )}
                          {STATE_BADGE[state].label}
                        </Badge>
                      )}
                    </span>
                  </span>
                  <span className="mt-2 flex items-center justify-between text-caption text-gray-600 dark:text-slate-400">
                    <span>{s.messages?.length || 0} messages</span>
                    <span>{fmtDate(s.lastActivity)}</span>
                  </span>
                  {(ownerOf(s) || s.rating) && (
                    <span className="mt-1.5 flex items-center justify-between gap-2 text-caption text-gray-600 dark:text-slate-400">
                      {ownerOf(s) ? (
                        <span className="flex min-w-0 items-center gap-1">
                          <UserShield size={11} aria-hidden="true" className="flex-shrink-0" />
                          <span className="truncate">{ownerOf(s).id === myId ? "You" : ownerOf(s).name}</span>
                        </span>
                      ) : <span />}
                      {s.rating && (
                        <span
                          className="flex-shrink-0 text-brand-ink dark:text-brand-400"
                          title={`Customer rated this ${s.rating} out of 5`}
                        >
                          {stars(s.rating)}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* One modal per open session */}
      {Object.values(openSessions).map((session) => {
        const sid         = session.sessionId;
        const state       = sessionState(session);
        const owner       = ownerOf(session);
        const iOwn        = !!owner && owner.id === myId;
        const canReply    = iOwn && !session.resolved;
        const isSending   = !!sendingSessions[sid];
        const replyText   = replies[sid] || "";

        return (
          <Modal
            key={sid}
            open
            onClose={() => closeSession(sid)}
            size="xl"
            title={session.name || "Anonymous"}
            description={session.email || "No contact info"}
          >
            <div className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6">
              {/* Pending banner */}
              {state === "pending" && (
                <div className="flex items-center gap-3 border-b border-brand-200 bg-brand-50 px-5 py-3 dark:border-brand-900/30 dark:bg-brand-900/20">
                  <Bell size={16} aria-hidden="true" className="flex-shrink-0 text-brand-ink dark:text-brand-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-brand-ink dark:text-brand-400">
                      This user is waiting for a live agent
                    </p>
                    <p className="mt-0.5 text-caption text-gray-700 dark:text-slate-300">
                      Accept the chat to start the live session — the user is notified instantly.
                    </p>
                  </div>
                  <Button size="sm" variant="brand" onClick={() => acceptChat(sid)}>
                    <Handshake size={14} aria-hidden="true" /> Accept chat
                  </Button>
                </div>
              )}

              {/* Live banner */}
              {state === "live" && (
                <div className="flex items-center gap-3 border-b border-success/20 bg-success-surface px-5 py-3 dark:border-success-dark/30 dark:bg-success-surface-dark">
                  <span aria-hidden="true" className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-success dark:bg-success-dark" />
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-success dark:text-success-dark">
                      Live chat in progress
                    </p>
                    <p className="mt-0.5 text-caption text-gray-700 dark:text-slate-300">
                      {canReply
                        ? "You are connected with this user. Reply below — messages appear instantly."
                        : owner
                          ? `${owner.name} is answering this customer. Take over below if you need to step in.`
                          : "Nobody has claimed this chat yet — claim it below to reply."}
                    </p>
                  </div>
                </div>
              )}

              {/* Detail header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-slate-800">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body-sm font-semibold text-gray-900 dark:text-white">
                      {session.name || "Anonymous"}
                    </p>
                    {iOwn ? (
                      <span className="flex items-center gap-1 text-caption font-semibold text-success dark:text-success-dark">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success dark:bg-success-dark" />
                        You&apos;re handling this
                      </span>
                    ) : owner ? (
                      <span className="flex items-center gap-1 text-caption font-semibold text-gray-700 dark:text-slate-300">
                        <UserShield size={12} aria-hidden="true" />
                        {owner.name} is handling this
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-caption font-semibold text-gray-600 dark:text-slate-400">
                        <Eye size={12} aria-hidden="true" />
                        Watching — read-only
                      </span>
                    )}
                    {STATE_BADGE[state] && state !== "closed" && (
                      <Badge tone={STATE_BADGE[state].tone}>{STATE_BADGE[state].label}</Badge>
                    )}
                    {session.rating && (
                      <Badge tone={session.rating >= 4 ? "success" : session.rating <= 2 ? "error" : "warning"}>
                        {stars(session.rating)} {session.rating}/5
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3">
                    {session.email && (
                      <a
                        href={`mailto:${session.email}`}
                        className="flex items-center gap-1 text-caption text-brand-ink hover:underline dark:text-brand-400"
                      >
                        <Mail size={12} aria-hidden="true" />{session.email}
                      </a>
                    )}
                    {session.phone && (
                      <a
                        href={`https://wa.me/${session.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={session.phone}
                        className="flex items-center gap-1 text-caption text-success hover:underline dark:text-success-dark"
                      >
                        <FaWhatsapp size={12} aria-hidden="true" />WhatsApp
                      </a>
                    )}
                    {!session.email && !session.phone && (
                      <span className="text-caption text-gray-600 dark:text-slate-400">No contact info captured</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {state === "pending" && (
                    <Button size="sm" variant="brand" onClick={() => acceptChat(sid)}>
                      <Handshake size={14} aria-hidden="true" /> Accept
                    </Button>
                  )}
                  {session.resolved ? (
                    isAdminRole(user?.role) && (
                      <Button size="sm" variant="secondary" onClick={() => toggleResolved(sid, true)}>
                        <CheckCircle2 size={14} aria-hidden="true" /> Reopen
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      variant={state === "live" ? "danger" : "primary"}
                      onClick={() => toggleResolved(sid, false)}
                    >
                      <CheckCircle2 size={14} aria-hidden="true" />
                      {state === "live" ? "Resolve" : "Resolve"}
                    </Button>
                  )}
                  {isAdminRole(user?.role) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 text-error dark:text-error-dark"
                      onClick={() => setDeleteTarget(session)}
                      aria-label={`Delete chat session with ${session.name || "this user"}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="max-h-80 space-y-3 overflow-y-auto p-5">
                {(session.messages || []).map((msg, i) => {
                  const isUser   = msg.role === "user";
                  const isAdmin  = msg.role === "admin";
                  const isSystem = msg.role === "bot" && msg.content.startsWith("🔴");
                  if (isSystem) {
                    return (
                      <div key={i} className="my-2 flex justify-center">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-caption text-gray-700 dark:bg-slate-800 dark:text-slate-300">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }
                  const senderLabel = !isAdmin
                    ? null
                    : msg.senderId && String(msg.senderId) === myId
                      ? "You"
                      : msg.senderName || "EazWorld team";
                  return (
                    <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      {isAdmin && (
                        <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-info text-white">
                          <UserShield size={13} aria-hidden="true" />
                        </div>
                      )}
                      <div>
                        {isAdmin && (
                          <p className="mb-1 ml-0.5 text-caption font-semibold text-info dark:text-info-dark">
                            {senderLabel}
                          </p>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-body-sm leading-relaxed ${
                          isUser
                            ? "rounded-tr-sm bg-brand-500 text-gray-900"
                            : isAdmin
                              ? "rounded-tl-sm border border-info/20 bg-info-surface text-info dark:border-info-dark/30 dark:bg-info-surface-dark dark:text-info-dark"
                              : "rounded-tl-sm border border-gray-200 bg-paper text-gray-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}>
                          {!isAdmin && !isUser && (
                            <p className="mb-1 font-mono text-eyebrow font-bold uppercase opacity-70">Eazy</p>
                          )}
                          {renderText(msg.content)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={(el) => { messagesEndRefs.current[sid] = el; }} />
              </div>

              {/* Resolved banner */}
              {session.resolved && (
                <div className="flex items-center gap-3 border-t border-gray-200 bg-paper px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <span aria-hidden="true" className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gray-400" />
                  <p className="flex-1 text-body-sm font-medium text-gray-700 dark:text-slate-300">
                    This conversation has ended
                  </p>
                  {isAdminRole(user?.role) && (
                    <Button size="sm" variant="secondary" onClick={() => toggleResolved(sid, true)}>
                      Reopen
                    </Button>
                  )}
                </div>
              )}

              {/* Reply box */}
              {state === "pending" ? (
                <div className="border-t border-brand-100 bg-brand-50/40 p-4 dark:border-brand-900/30 dark:bg-brand-900/5">
                  <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                    <Bell size={15} aria-hidden="true" className="text-brand-ink dark:text-brand-400" />
                    <p className="text-body-sm font-medium text-brand-ink dark:text-brand-400">
                      Accept the chat above to start replying
                    </p>
                    <Button size="sm" variant="brand" onClick={() => acceptChat(sid)}>
                      <Handshake size={14} aria-hidden="true" /> Accept
                    </Button>
                  </div>
                </div>
              ) : !canReply && !session.resolved ? (
                <div className="border-t border-gray-100 bg-paper/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <div className="flex flex-wrap items-center justify-center gap-3 py-2 text-center">
                    {owner ? (
                      <>
                        <UserShield size={15} aria-hidden="true" className="text-gray-600 dark:text-slate-400" />
                        <p className="text-body-sm font-medium text-gray-700 dark:text-slate-300">
                          {owner.name} is handling this chat — take over to reply
                        </p>
                        <Button size="sm" variant="secondary" onClick={() => claimChat(sid)}>
                          <Handshake size={14} aria-hidden="true" /> Take over
                        </Button>
                      </>
                    ) : (
                      <>
                        <Eye size={15} aria-hidden="true" className="text-gray-600 dark:text-slate-400" />
                        <p className="text-body-sm font-medium text-gray-700 dark:text-slate-300">
                          You&apos;re watching this chat — claim it to reply
                        </p>
                        <Button size="sm" variant="primary" onClick={() => claimChat(sid)}>
                          <Handshake size={14} aria-hidden="true" /> Claim chat
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`border-t p-4 ${
                  state === "live"
                    ? "border-success/20 bg-success-surface/40 dark:border-success-dark/30 dark:bg-success-surface-dark/30"
                    : "border-gray-100 dark:border-slate-800"
                }`}>
                  <form onSubmit={(e) => sendReply(e, session)} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        label="Reply to this user"
                        hideLabel
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplies((prev) => ({ ...prev, [sid]: e.target.value }))}
                        placeholder={
                          state === "live"
                            ? "Reply to this user (live chat)…"
                            : "Reply to this user…"
                        }
                        disabled={isSending || session.resolved}
                        className="rounded-full"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="md"
                      className="!px-3"
                      disabled={!replyText.trim() || session.resolved}
                      loading={isSending}
                      aria-label="Send reply"
                    >
                      {!isSending && <Send size={16} aria-hidden="true" />}
                    </Button>
                  </form>
                  <p className="mt-2 text-center text-caption text-gray-600 dark:text-slate-400">
                    Your reply appears in the user&apos;s chat widget instantly
                  </p>
                </div>
              )}

              <div className="border-t border-gray-100 px-5 py-2.5 text-caption text-gray-600 dark:border-slate-800 dark:text-slate-400">
                Started {fmtDate(session.createdAt)} · Last active {fmtDate(session.lastActivity)}
              </div>
            </div>
          </Modal>
        );
      })}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this chat session?"
        description={deleteTarget ? (deleteTarget.name || deleteTarget.email || "Anonymous session") : undefined}
        confirmLabel="Delete session"
      >
        <p className="text-body-sm text-gray-600 dark:text-slate-400">
          The whole conversation is removed permanently, including the customer&apos;s messages and
          any contact details captured in it. To close it without losing the record, use Resolve.
        </p>
      </ConfirmDialog>
    </div>
  );
}
