"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  FaSpinner, FaRedo, FaCheckCircle, FaTrash, FaWhatsapp,
  FaEnvelope, FaComments, FaPaperPlane, FaUserShield, FaBell,
  FaHandshake,
} from "react-icons/fa";

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

export default function AdminChatsPage() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");
  const [active, setActive]           = useState(null);
  const [reply, setReply]             = useState("");
  const [sending, setSending]         = useState(false);
  const [newAlert, setNewAlert]       = useState(false); // flashes when a new pending arrives
  const messagesEndRef                 = useRef(null);
  const prevPendingCount               = useRef(0);

  // Silent background refresh — does NOT show the spinner
  const refreshSessions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const json = await api.get("/chat/sessions");
      const data = json.data || [];
      setSessions(data);

      // Alert if a new pending request arrived since last check
      const pendingNow = data.filter((s) => s.humanRequested && !s.humanAccepted && !s.resolved).length;
      if (silent && pendingNow > prevPendingCount.current) {
        setNewAlert(true);
        setTimeout(() => setNewAlert(false), 4000);
      }
      prevPendingCount.current = pendingNow;
    } catch { if (!silent) setSessions([]); }
    finally  { if (!silent) setLoading(false); }
  }, []);

  // Initial load
  useEffect(() => {
    if (!authLoading && user?.role === "admin") refreshSessions(false);
  }, [authLoading, user?.role, refreshSessions]);

  // Auto-refresh sessions list every 8 s so new pending requests appear automatically
  useEffect(() => {
    if (authLoading || user?.role !== "admin") return;
    const id = setInterval(() => refreshSessions(true), 8000);
    return () => clearInterval(id);
  }, [authLoading, user?.role, refreshSessions]);

  const acceptChat = async (sessionId) => {
    try {
      await api.post(`/chat/sessions/${sessionId}/accept`);
      setSessions((prev) => prev.map((s) => s.sessionId === sessionId ? { ...s, humanAccepted: true } : s));
      if (active?.sessionId === sessionId) setActive((a) => a ? { ...a, humanAccepted: true } : a);
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
      if (active?.sessionId === sessionId) {
        setActive((a) => ({ ...a, resolved: !current, humanRequested: !current ? false : a.humanRequested }));
      }
    } catch {}
  };

  const handleDelete = async (sessionId) => {
    if (!confirm("Delete this chat session permanently?")) return;
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (active?.sessionId === sessionId) setActive(null);
    } catch {}
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      const json = await api.post(`/chat/sessions/${active.sessionId}/reply`, { message: reply.trim() });
      if (json.success) {
        const newMsg = { role: "admin", content: reply.trim(), createdAt: new Date().toISOString() };
        setActive((a) => ({
          ...a,
          resolved: false,
          messages: [...(a.messages || []), newMsg],
        }));
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === active.sessionId
              ? {
                  ...s,
                  resolved: false,
                  messages: [...(s.messages || []), newMsg],
                  lastActivity: new Date().toISOString(),
                }
              : s
          )
        );
        setReply("");
      }
    } catch {}
    finally { setSending(false); }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  // Live-poll the active session every 5 s so admin sees new user messages instantly
  useEffect(() => {
    if (!active?.sessionId) return;
    const id = active.sessionId;

    const poll = async () => {
      try {
        const json = await api.get(`/chat/sessions/${id}`);
        if (!json.success || !json.data) return;
        const fresh = json.data;
        setActive((prev) => {
          if (!prev || prev.sessionId !== id) return prev;
          const hasNewMessages = (fresh.messages?.length ?? 0) > (prev.messages?.length ?? 0);
          const stateChanged   = fresh.resolved !== prev.resolved || fresh.humanAccepted !== prev.humanAccepted;
          if (!hasNewMessages && !stateChanged) return prev;
          return fresh; // new messages or state change — refresh
        });
        setSessions((prev) =>
          prev.map((s) => (s.sessionId === id ? { ...s, ...fresh } : s))
        );
      } catch { /* ignore */ }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [active?.sessionId]);

  if (authLoading) return null;

  const totalOpen       = sessions.filter((s) => !s.resolved).length;
  const totalResolved   = sessions.filter((s) =>  s.resolved).length;
  const pendingCount    = sessions.filter((s) =>  s.humanRequested && !s.humanAccepted && !s.resolved).length;
  const liveCount       = sessions.filter((s) =>  s.humanAccepted  && !s.resolved).length;

  // Apply client-side filters
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 px-4 pt-6 pb-24">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Chat Sessions</h1>
            <p className="text-gray-400 dark:text-slate-500 text-sm mt-1">
              {sessions.length} total · {totalOpen} open · {totalResolved} resolved
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-brand-500 font-semibold">
                  · <FaBell size={10} className="animate-pulse" /> {pendingCount} pending
                </span>
              )}
              {liveCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-500 font-semibold">
                  · <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> {liveCount} live
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => refreshSessions(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500 transition disabled:opacity-50"
          >
            <FaRedo size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total",    value: sessions.length, color: "text-gray-900 dark:text-white",           border: "border-gray-100 dark:border-slate-800" },
            { label: "Open",     value: totalOpen,       color: totalOpen > 0 ? "text-brand-500" : "text-gray-900 dark:text-white", border: "border-gray-100 dark:border-slate-800" },
            { label: "Pending",  value: pendingCount,    color: pendingCount > 0 ? "text-brand-500" : "text-gray-900 dark:text-white", border: pendingCount > 0 ? "border-brand-200 dark:border-brand-900/40" : "border-gray-100 dark:border-slate-800" },
            { label: "Live",     value: liveCount,       color: liveCount > 0 ? "text-emerald-500" : "text-gray-900 dark:text-white", border: liveCount > 0 ? "border-emerald-200 dark:border-emerald-900/40" : "border-gray-100 dark:border-slate-800" },
            { label: "Resolved", value: totalResolved,   color: "text-emerald-600 dark:text-emerald-400",  border: "border-gray-100 dark:border-slate-800" },
          ].map(({ label, value, color, border }) => (
            <div key={label} className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 text-center ${border}`}>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* New pending alert */}
        {newAlert && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 animate-pulse">
            <FaBell size={14} className="text-brand-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">
              New live chat request — a user is waiting for your response!
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-full p-1 w-fit mb-6">
          {[
            ["all",      "All",      ""],
            ["open",     "Open",     totalOpen > 0 ? ` (${totalOpen})` : ""],
            ["pending",  "Pending",  pendingCount > 0 ? ` (${pendingCount})` : ""],
            ["live",     "Live",     liveCount > 0 ? ` (${liveCount})` : ""],
            ["resolved", "Resolved", ""],
          ].map(([val, base, count]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                filter === val
                  ? val === "pending"
                    ? "bg-brand-500 text-white"
                    : val === "live"
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-900 dark:bg-brand-500 text-white dark:text-gray-900"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {base}{count}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
            <FaSpinner className="animate-spin text-2xl text-brand-500" />
            <span className="text-sm">Loading sessions…</span>
          </div>
        ) : visibleSessions.length === 0 ? (
          <div className="text-center py-24 text-gray-400 dark:text-slate-500">
            <FaComments size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
              {filter === "pending"
                ? "No sessions awaiting approval"
                : filter === "live"
                  ? "No active live chats"
                  : "No chat sessions yet"}
            </p>
            <p className="text-xs">
              {filter === "pending"
                ? "Users who request a human agent will appear here for you to accept."
                : filter === "live"
                  ? "Accepted live chats will appear here."
                  : "Conversations from the website chat will appear here."}
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Session list */}
            <div className="lg:col-span-1 space-y-2">
              {visibleSessions.map((s) => (
                <div
                  key={s.sessionId}
                  onClick={() => setActive(s)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    active?.sessionId === s.sessionId
                      ? s.humanAccepted && !s.resolved
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/10"
                        : s.humanRequested && !s.humanAccepted && !s.resolved
                          ? "border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/10"
                          : "border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/10"
                      : s.humanAccepted && !s.resolved
                        ? "border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800"
                        : s.humanRequested && !s.humanAccepted && !s.resolved
                          ? "border-brand-200 dark:border-brand-900/40 bg-white dark:bg-slate-900 hover:border-brand-300 dark:hover:border-brand-800"
                          : s.resolved
                            ? "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60"
                            : "border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-200 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        s.humanAccepted && !s.resolved
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : s.humanRequested && !s.resolved
                            ? "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                            : "bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400"
                      }`}>
                        {s.name ? s.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {s.name || "Anonymous"}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                          {s.email || "No contact info"}
                        </p>
                      </div>
                    </div>
                    {/* Status badges */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {s.humanRequested && !s.humanAccepted && !s.resolved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 px-1.5 py-0.5 rounded-full">
                          <FaBell size={8} className="animate-pulse" /> Pending
                        </span>
                      )}
                      {s.humanAccepted && !s.resolved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> Live
                        </span>
                      )}
                      {s.resolved && (
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Closed</span>
                      )}
                      {!s.resolved && !s.humanRequested && (
                        <span className="w-2 h-2 rounded-full bg-brand-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400 dark:text-slate-500">{s.messages?.length || 0} messages</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{fmtDate(s.lastActivity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Conversation detail */}
            <div className="lg:col-span-2">
              {!active ? (
                <div className="h-full flex items-center justify-center text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-12">
                  <div className="text-center">
                    <FaComments size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a session to view the conversation</p>
                  </div>
                </div>
              ) : (
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden ${
                  active.humanAccepted && !active.resolved
                    ? "border-emerald-200 dark:border-emerald-900/40"
                    : active.humanRequested && !active.humanAccepted && !active.resolved
                      ? "border-brand-200 dark:border-brand-900/40"
                      : "border-gray-100 dark:border-slate-800"
                }`}>

                  {/* Pending banner — user waiting, admin hasn't accepted yet */}
                  {active.humanRequested && !active.humanAccepted && !active.resolved && (
                    <div className="px-5 py-3 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-100 dark:border-brand-900/30 flex items-center gap-3">
                      <FaBell size={14} className="text-brand-500 animate-pulse flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                          This user is waiting for a live agent
                        </p>
                        <p className="text-xs text-brand-600 dark:text-brand-500 mt-0.5">
                          Accept the chat to start the live session — the user will be notified instantly.
                        </p>
                      </div>
                      <button
                        onClick={() => acceptChat(active.sessionId)}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white transition flex-shrink-0"
                      >
                        <FaHandshake size={11} /> Accept Chat
                      </button>
                    </div>
                  )}

                  {/* Live banner — chat accepted */}
                  {active.humanAccepted && !active.resolved && (
                    <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                          Live chat in progress
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                          You are connected with this user. Reply below — messages appear instantly.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Detail header */}
                  <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {active.name || "Anonymous"}
                        </p>
                        {/* Polling indicator */}
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          Watching
                        </span>
                        {/* State badge */}
                        {active.humanRequested && !active.humanAccepted && !active.resolved && (
                          <span className="text-[10px] font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 px-1.5 py-0.5 rounded-full">
                            Pending
                          </span>
                        )}
                        {active.humanAccepted && !active.resolved && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-full">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-0.5">
                        {active.email && (
                          <a href={`mailto:${active.email}`} className="text-xs text-brand-500 flex items-center gap-1 hover:underline">
                            <FaEnvelope size={9} />{active.email}
                          </a>
                        )}
                        {active.phone && (
                          <a
                            href={`https://wa.me/${active.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={active.phone}
                            className="text-xs text-emerald-500 flex items-center gap-1 hover:underline"
                          >
                            <FaWhatsapp size={9} />WhatsApp
                          </a>
                        )}
                        {!active.email && !active.phone && (
                          <span className="text-xs text-gray-400 dark:text-slate-500">No contact info captured</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Accept button — also available in header when pending */}
                      {active.humanRequested && !active.humanAccepted && !active.resolved && (
                        <button
                          onClick={() => acceptChat(active.sessionId)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white transition"
                        >
                          <FaHandshake size={10} /> Accept
                        </button>
                      )}
                      <button
                        onClick={() => toggleResolved(active.sessionId, active.resolved)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition ${
                          active.resolved
                            ? "border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-400"
                            : active.humanAccepted
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        <FaCheckCircle size={10} />
                        {active.resolved ? "Reopen" : active.humanAccepted ? "End Chat" : "Resolve"}
                      </button>
                      <button
                        onClick={() => handleDelete(active.sessionId)}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                    {(active.messages || []).map((msg, i) => {
                      const isUser   = msg.role === "user";
                      const isAdmin  = msg.role === "admin";
                      const isSystem = msg.role === "bot" && msg.content.startsWith("🔴");
                      // System "ended" messages shown centered
                      if (isSystem) {
                        return (
                          <div key={i} className="flex justify-center my-2">
                            <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                          {isAdmin && (
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1">
                              <FaUserShield size={11} />
                            </div>
                          )}
                          <div>
                            {isAdmin && (
                              <p className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 mb-1 ml-0.5">
                                You (Admin)
                              </p>
                            )}
                            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isUser
                                ? "bg-brand-500 text-white rounded-tr-sm"
                                : isAdmin
                                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-gray-800 dark:text-slate-200 border border-indigo-100 dark:border-indigo-800 rounded-tl-sm"
                                  : "bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-tl-sm"
                            }`}>
                              {!isAdmin && (
                                <p className="text-[10px] font-semibold mb-1 opacity-60 uppercase tracking-wide">
                                  Eazy
                                </p>
                              )}
                              {renderText(msg.content)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Resolved banner — shown when chat has been ended (by either side) */}
                  {active.resolved && (
                    <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-500 dark:text-slate-400 font-medium flex-1">
                        This conversation has ended
                      </p>
                      <button
                        onClick={() => toggleResolved(active.sessionId, true)}
                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition"
                      >
                        Reopen
                      </button>
                    </div>
                  )}

                  {/* Reply box — locked until admin accepts the chat */}
                  {active.humanRequested && !active.humanAccepted && !active.resolved ? (
                    <div className="border-t border-brand-100 dark:border-brand-900/30 p-4 bg-brand-50/40 dark:bg-brand-900/5">
                      <div className="flex items-center gap-3 justify-center py-2">
                        <FaBell size={13} className="text-brand-500 animate-pulse" />
                        <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
                          Accept the chat above to start replying
                        </p>
                        <button
                          onClick={() => acceptChat(active.sessionId)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white transition"
                        >
                          <FaHandshake size={10} /> Accept
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`border-t p-4 ${
                      active.humanAccepted && !active.resolved
                        ? "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/5"
                        : "border-gray-50 dark:border-slate-800"
                    }`}>
                      <form onSubmit={sendReply} className="flex gap-2">
                        <input
                          type="text"
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder={
                            active.humanAccepted && !active.resolved
                              ? "Reply to this user (live chat)…"
                              : "Reply to this user…"
                          }
                          disabled={sending || active.resolved}
                          className="flex-1 text-sm px-3.5 py-2.5 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={!reply.trim() || sending || active.resolved}
                          className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 transition disabled:opacity-40 flex-shrink-0"
                        >
                          {sending
                            ? <FaSpinner size={12} className="animate-spin" />
                            : <FaPaperPlane size={12} />}
                        </button>
                      </form>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-2 text-center">
                        Your reply will appear in the user&apos;s chat widget instantly
                      </p>
                    </div>
                  )}

                  <div className="px-5 py-2.5 border-t border-gray-50 dark:border-slate-800 text-xs text-gray-400 dark:text-slate-500">
                    Started {fmtDate(active.createdAt)} · Last active {fmtDate(active.lastActivity)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
