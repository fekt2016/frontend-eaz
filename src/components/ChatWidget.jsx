"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FaComments, FaTimes, FaPaperPlane, FaWhatsapp,
  FaRedo, FaUserShield, FaSpinner, FaClock, FaHeadset,
} from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeMessage } from "@/lib/sanitize";
import { getCookie, setCookie, removeCookie } from "@/lib/cookies";

// ─── Cookie-based session helpers ─────────────────────────────────────────────
function getSessionId() {
  if (typeof document === "undefined") return "";
  let id = getCookie("ew_session");
  if (!id) {
    id = `ew_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    setCookie("ew_session", id, { days: 30 });
  }
  return id;
}

// chat states: "bot" | "pending" | "live" | "ended"
function getChatState(sid) {
  if (!sid) return "bot";
  return getCookie(`ew_state_${sid}`) || "bot";
}
function saveChatState(sid, state) {
  if (!sid) return;
  setCookie(`ew_state_${sid}`, state, { days: 30 });
}
function getEndedBy(sid) {
  return getCookie(`ew_endedby_${sid}`) || "admin";
}
function saveEndedBy(sid, by) {
  setCookie(`ew_endedby_${sid}`, by, { days: 30 });
}
function clearSessionCookies(sid) {
  removeCookie("ew_session");
  removeCookie(`ew_state_${sid}`);
  removeCookie(`ew_endedby_${sid}`);
}

// ─── Welcome message ──────────────────────────────────────────────────────────
function buildWelcome(user) {
  const first = user?.name?.split(" ")[0];
  return {
    role: "bot",
    content: first
      ? `Welcome back, **${first}**! 👋 I'm **Eazy**, EazWorld's assistant. How can I help you today?`
      : "Hi there! 👋 I'm **Eazy**, EazWorld's assistant. How can I help you today?",
    suggestions: ["Our Services", "Pricing", "Book a Consultation"],
    id: "welcome",
  };
}

// ─── Markdown bold renderer ───────────────────────────────────────────────────
function renderText(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

// ─── Message bubbles ──────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap bg-brand-500 text-white">
          {renderText(msg.content)}
        </div>
      </div>
    );
  }
  if (msg.role === "admin") {
    return (
      <div className="flex justify-start mb-3">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1">
          <FaUserShield size={12} />
        </div>
        <div className="max-w-[82%]">
          <p className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 mb-1 ml-1">EazWorld Team</p>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap bg-indigo-50 dark:bg-indigo-900/30 text-gray-800 dark:text-slate-200 border border-indigo-100 dark:border-indigo-800 shadow-sm">
            {renderText(msg.content)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2 mt-1">E</div>
      <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 shadow-sm">
        {renderText(msg.content)}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2 mt-1">E</div>
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map((d) => (
            <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Live chat request form ───────────────────────────────────────────────────
function HumanRequestForm({ user, onSubmit, onCancel }) {
  const isLoggedIn = !!user;
  const [name,    setName]    = useState(user?.name  || "");
  const [email,   setEmail]   = useState(user?.email || "");
  const [phone,   setPhone]   = useState(user?.phone || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const canSubmit = message.trim() && (isLoggedIn || (name.trim() && email.trim()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    await onSubmit({
      name:    name.trim()  || user?.name  || "",
      email:   email.trim() || user?.email || "",
      phone:   phone.trim() || user?.phone || "",
      message: message.trim(),
    });
    setSending(false);
  };

  return (
    <div className="flex-shrink-0 border-t border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-950/30 px-4 pt-3 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaUserShield size={13} className="text-indigo-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Connect to live support</p>
        </div>
        <button onClick={onCancel} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition">
          <FaTimes size={12} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        {!isLoggedIn && (
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" required
              className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" required
              className="text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition" />
          </div>
        )}
        {isLoggedIn && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
            <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp number (optional)"
          className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition" />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do you need help with? *"
          required rows={2} autoFocus
          className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition resize-none" />
        <button type="submit" disabled={!canSubmit || sending}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition disabled:opacity-50">
          {sending ? <FaSpinner size={12} className="animate-spin" /> : <FaUserShield size={12} />}
          {sending ? "Sending request…" : "Request Live Support"}
        </button>
      </form>
    </div>
  );
}

// ─── Admin shortcut badge ─────────────────────────────────────────────────────
function AdminChatBadge() {
  return (
    <Link href="/dashboard/chats"
      className="fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all">
      <FaUserShield size={14} /><span>Admin Chats</span>
    </Link>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { user, loading: authLoading } = useAuth();

  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState(() => [buildWelcome(null)]);
  const [input, setInput]             = useState("");
  const [typing, setTyping]           = useState(false);
  const [suggestions, setSuggestions] = useState(buildWelcome(null).suggestions);
  const [unread, setUnread]           = useState(0);

  // ── Chat state machine: "bot" | "pending" | "live" | "ended" ───────────────
  const [chatState, setChatStateLocal] = useState("bot");
  const [endedBy, setEndedBy]         = useState(null);
  const [confirmEnd, setConfirmEnd]   = useState(false);
  const [showHumanForm, setShowHumanForm] = useState(false);

  const bottomRef       = useRef(null);
  const inputRef        = useRef(null);
  const sessionId       = useRef("");
  const lastPollTime    = useRef(null);
  const pollIntervalRef = useRef(null);
  const welcomeSet      = useRef(false);

  // helper that updates both state and cookie
  const transitionTo = useCallback((newState) => {
    setChatStateLocal(newState);
    saveChatState(sessionId.current, newState);
  }, []);

  // ── Mount: restore session state from server + cookies ─────────────────────
  useEffect(() => {
    const id = getSessionId();
    sessionId.current = id;

    fetch(`/api/v1/chat/sessions/${id}/messages`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404 || r.status === 403) {
          // Stale or unauthorized session — clear cookies and start fresh
          clearSessionCookies(id);
          sessionId.current = getSessionId(); // generates new ID
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (!json || !json.success) return;
        const { humanRequested, humanAccepted, resolved } = json.meta || {};
        const stored = getChatState(id);

        let restored = "bot";
        if (resolved)                restored = "ended";
        else if (humanAccepted)      restored = "live";
        else if (humanRequested)     restored = "pending";
        else if (stored !== "bot")   restored = stored;

        if (resolved && stored === "ended") {
          setEndedBy(getEndedBy(id));
        }

        if (restored !== "bot") {
          setChatStateLocal(restored);
          welcomeSet.current = true;

          if (Array.isArray(json.data) && json.data.length > 0) {
            setMessages(json.data.map((m, i) => ({ role: m.role, content: m.content, id: m._id || `h${i}` })));
            setSuggestions([]);
            const last = json.data[json.data.length - 1];
            lastPollTime.current = last?.createdAt ?? new Date(Date.now() - 60_000).toISOString();
          } else {
            lastPollTime.current = new Date(Date.now() - 60_000).toISOString();
          }
        }
      })
      .catch(() => {
        const stored = getChatState(id);
        if (stored && stored !== "bot") setChatStateLocal(stored);
      });
  }, []);

  // ── Personalise welcome (only for fresh sessions) ─────────────────────────
  useEffect(() => {
    if (authLoading || welcomeSet.current) return;
    welcomeSet.current = true;
    const w = buildWelcome(user);
    setMessages([w]);
    setSuggestions(w.suggestions);
  }, [authLoading, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  // ── Unified poll: runs in "pending" and "live" states ─────────────────────
  const poll = useCallback(async () => {
    if (!sessionId.current) return;
    try {
      const since = lastPollTime.current ? `?since=${encodeURIComponent(lastPollTime.current)}` : "";
      const res  = await fetch(`/api/v1/chat/sessions/${sessionId.current}/messages${since}`, { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success) return;

      const { humanAccepted, resolved } = json.meta || {};

      if (chatState === "pending" && humanAccepted) {
        transitionTo("live");
        lastPollTime.current = new Date().toISOString();
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "✅ An agent has joined! You can now chat directly with our team. Type your message below.", id: `b_accept_${Date.now()}` },
        ]);
        return;
      }

      if (chatState === "live" && resolved) {
        transitionTo("ended");
        setEndedBy("admin");
        saveEndedBy(sessionId.current, "admin");
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        // Show any new messages from DB (includes the system "ended" message) + fallback
        const newMsgs = json.data || [];
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id).filter(Boolean));
          const fresh = newMsgs.filter((m) => !ids.has(m._id));
          const base = fresh.length
            ? [...prev, ...fresh.map((m) => ({ role: m.role, content: m.content, id: m._id }))]
            : prev;
          return [
            ...base,
            { role: "bot", content: "This conversation has been closed. Thank you for chatting with **EazWorld**! 😊\n\nFeel free to start a new chat anytime.", id: `b_end_${Date.now()}` },
          ];
        });
        return;
      }

      if (chatState === "live" && json.data?.length) {
        const newAdmin = json.data.filter((m) => m.role === "admin");
        if (!newAdmin.length) return;
        setMessages((prev) => {
          const ids   = new Set(prev.map((m) => m.id).filter(Boolean));
          const fresh = newAdmin.filter((m) => !ids.has(m._id));
          if (!fresh.length) return prev;
          if (!open) setUnread((n) => n + fresh.length);
          return [...prev, ...fresh.map((m) => ({ role: "admin", content: m.content, id: m._id }))];
        });
        lastPollTime.current = newAdmin[newAdmin.length - 1].createdAt;
      }
    } catch { /* silent */ }
  }, [chatState, open, transitionTo]);

  useEffect(() => {
    if (chatState === "pending" || chatState === "live") {
      if (!lastPollTime.current) lastPollTime.current = new Date().toISOString();
      poll();
      pollIntervalRef.current = setInterval(poll, 4000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, [chatState, poll]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = sanitizeMessage(text, 2000);
    if (!trimmed) return;
    setSuggestions([]);
    setMessages((prev) => [...prev, { role: "user", content: trimmed, id: `u_${Date.now()}` }]);
    setInput("");

    const payload = {
      sessionId: sessionId.current,
      message:   trimmed,
      ...(user?.name  && { name:  user.name }),
      ...(user?.email && { email: user.email }),
      ...(user?.phone && { phone: user.phone }),
    };

    if (chatState === "live") {
      fetch("/api/v1/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
      return;
    }

    setTyping(true);
    try {
      const res  = await fetch("/api/v1/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      await new Promise((r) => setTimeout(r, 600));
      setTyping(false);
      if (json.success && json.data?.response) {
        setMessages((prev) => [...prev, { role: "bot", content: json.data.response, id: `b_${Date.now()}` }]);
        setSuggestions(json.data.suggestions || []);
      }
      if (!open) setUnread((n) => n + 1);
    } catch {
      setTyping(false);
      setMessages((prev) => [...prev, { role: "bot", content: "Sorry, I'm having trouble connecting right now. Please WhatsApp us at +233 244 388 190.", id: `b_${Date.now()}` }]);
      setSuggestions(["WhatsApp Us", "Try Again"]);
    }
  }, [chatState, open, user]);

  // ── "Talk to a Human" — show form ─────────────────────────────────────────
  const handleTalkToHuman = useCallback(() => {
    setSuggestions([]);
    setMessages((prev) => [...prev, { role: "bot", content: "Sure! Please fill in your details below and our team will review your request. 👇", id: `b_${Date.now()}` }]);
    setShowHumanForm(true);
  }, []);

  // ── Form submitted → session enters "pending" ─────────────────────────────
  const handleHumanFormSubmit = useCallback(async ({ name, email, phone, message }) => {
    const cleanName    = sanitizeName(name);
    const cleanEmail   = sanitizeEmail(email);
    const cleanPhone   = sanitizePhone(phone);
    const cleanMessage = sanitizeMessage(message, 2000);

    setShowHumanForm(false);
    setMessages((prev) => [...prev, { role: "user", content: cleanMessage, id: `u_${Date.now()}` }]);

    await fetch("/api/v1/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId.current, message: "[User requested to speak with a human agent]", name: cleanName, email: cleanEmail, phone: cleanPhone }),
    }).catch(() => {});

    await fetch("/api/v1/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId.current, message: cleanMessage, name: cleanName, email: cleanEmail, phone: cleanPhone }),
    }).catch(() => {});

    transitionTo("pending");
    lastPollTime.current = new Date().toISOString();

    const first = name?.split(" ")[0] || "there";
    setMessages((prev) => [...prev, {
      role: "bot",
      content: `Thanks **${first}**! ✅ Your request has been sent to our team.\n\nPlease wait while an agent reviews and accepts your chat. This usually takes just a few minutes during business hours (Mon–Fri, 8am–6pm GMT).`,
      id: `b_pending_${Date.now()}`,
    }]);
  }, [transitionTo]);

  // ── User ends the live chat ────────────────────────────────────────────────
  const handleEndChat = useCallback(async () => {
    setConfirmEnd(false);
    transitionTo("ended");
    setEndedBy("user");
    saveEndedBy(sessionId.current, "user");
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    fetch("/api/v1/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId.current, message: "[User ended the conversation]" }),
    }).catch(() => {});

    setMessages((prev) => [...prev, { role: "bot", content: "You've ended this conversation. Thanks for chatting with **EazWorld**! 😊\n\nFeel free to start a new chat anytime.", id: `b_end_${Date.now()}` }]);
  }, [transitionTo]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    const oldId = sessionId.current;
    clearSessionCookies(oldId);

    sessionId.current    = getSessionId();
    lastPollTime.current = null;
    welcomeSet.current   = false;

    setChatStateLocal("bot");
    setEndedBy(null);
    setConfirmEnd(false);
    setShowHumanForm(false);

    const w = buildWelcome(user);
    setMessages([w]);
    setSuggestions(w.suggestions);
    setInput("");
  };

  // ── Suggestion chips ───────────────────────────────────────────────────────
  const handleSuggestion = (s) => {
    if (["Talk to a Human", "Talk to Human", "Speak to a Human"].includes(s)) { handleTalkToHuman(); return; }
    if (["WhatsApp Us", "WhatsApp Now"].includes(s)) { window.open("https://wa.me/233244388190", "_blank"); return; }
    if (["Book Consultation", "Book a Consultation", "Book Free Consultation", "Book Consultation Now"].includes(s)) { window.location.href = "/book-consultation"; return; }
    if (["View Portfolio", "View Full Portfolio"].includes(s)) { window.location.href = "/portfolio"; return; }
    if (["Our Services", "View Services"].includes(s)) { window.location.href = "/services"; return; }
    if (s === "Hosting Plans") { window.location.href = "/hosting"; return; }
    if (s === "Register a Domain") { window.location.href = "/domains"; return; }
    if (["Get Directions", "Our Location"].includes(s)) { window.location.href = "/visit-us"; return; }
    if (s === "Try Again") { setSuggestions([]); return; }
    sendMessage(s);
  };

  if (authLoading) return null;
  if (user?.role === "admin") return <AdminChatBadge />;

  const isLoggedIn = !!user;
  const isPending  = chatState === "pending";
  const isLive     = chatState === "live";
  const isEnded    = chatState === "ended";
  const isBot      = chatState === "bot";

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-paper dark:bg-ink">

          {/* Header */}
          <div className="bg-gray-900 dark:bg-slate-900 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
                  {isLive || isPending ? <FaUserShield size={14} /> : "E"}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${
                  isLive ? "bg-emerald-400" : isPending ? "bg-brand-400 animate-pulse" : isEnded ? "bg-gray-400" : "bg-emerald-400"
                }`} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {isLive ? "EazWorld Team" : isPending ? "EazWorld Support" : "Eazy"}
                </p>
                <p className="text-gray-400 text-xs">
                  {isLive    ? "Live · Replies arrive here automatically"
                  : isPending ? "Waiting for an agent to accept…"
                  : isEnded  ? "Conversation ended"
                  : isLoggedIn ? `Logged in as ${user.email}`
                  : "EazWorld Assistant · Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="p-1.5 rounded-lg text-emerald-400 hover:bg-slate-800 transition">
                <FaWhatsapp size={16} />
              </a>
              <button onClick={handleReset} title="New conversation" className="p-1.5 rounded-lg text-gray-400 hover:bg-slate-800 transition">
                <FaRedo size={12} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-slate-800 transition">
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {/* Status banners */}
          {isPending && (
            <div className="px-4 py-2.5 bg-brand-50 dark:bg-brand-900/20 border-b border-brand-100 dark:border-brand-900/30 flex items-center gap-2.5">
              <FaClock size={11} className="text-brand-500 flex-shrink-0 animate-pulse" />
              <p className="text-[11px] text-brand-700 dark:text-brand-400 font-medium">
                Waiting for an agent to accept your chat request…
              </p>
            </div>
          )}
          {isLive && (
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FaUserShield size={11} className="text-indigo-500 flex-shrink-0" />
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                  Live support — replies arrive here automatically
                </p>
              </div>
              <button onClick={() => setConfirmEnd(true)} className="flex-shrink-0 text-[10px] font-semibold text-red-400 hover:text-red-600 transition whitespace-nowrap">
                End Chat
              </button>
            </div>
          )}
          {isEnded && (
            <div className="px-4 py-2 bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                {endedBy === "admin" ? "Chat ended by EazWorld team" : "You ended this chat"}
              </p>
            </div>
          )}
          {isLoggedIn && isBot && (
            <div className="px-4 py-1.5 bg-brand-50 dark:bg-brand-900/10 border-b border-brand-100 dark:border-brand-900/20 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <p className="text-[11px] text-brand-700 dark:text-brand-400 font-medium truncate">
                Chatting as <span className="font-bold">{user.name}</span>
              </p>
            </div>
          )}

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
            style={{ maxHeight: showHumanForm ? "180px" : "360px" }}
          >
            {messages.map((msg, i) => <MessageBubble key={msg.id || i} msg={msg} />)}
            {typing && <TypingIndicator />}
            {isPending && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-brand-400 flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1">
                  <FaClock size={11} />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 text-xs text-brand-700 dark:text-brand-400">
                  Waiting for an agent to accept your request…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips (bot mode only) */}
          {suggestions.length > 0 && !typing && isBot && !showHumanForm && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 flex-shrink-0">
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSuggestion(s)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* ── Human request form ── */}
          {showHumanForm && isBot && (
            <HumanRequestForm
              user={user}
              onSubmit={handleHumanFormSubmit}
              onCancel={() => { setShowHumanForm(false); }}
            />
          )}

          {/* ── End-chat confirmation ── */}
          {confirmEnd && isLive && (
            <div className="flex-shrink-0 border-t border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">End this conversation?</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">The chat will be closed. You can always start a new one.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmEnd(false)}
                  className="flex-1 text-sm py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-paper dark:hover:bg-slate-800 transition font-medium">
                  Cancel
                </button>
                <button onClick={handleEndChat}
                  className="flex-1 text-sm py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition">
                  Yes, End Chat
                </button>
              </div>
            </div>
          )}

          {/* ── Chat ended footer ── */}
          {isEnded && (
            <div className="flex-shrink-0 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex gap-2">
              <button onClick={handleReset} className="flex-1 text-sm py-2 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-400 transition">
                Start New Chat
              </button>
              <a href="https://wa.me/233244388190" target="_blank" rel="noopener noreferrer"
                className="flex-1 text-sm py-2 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition text-center">
                WhatsApp Us
              </a>
            </div>
          )}

          {/* ── Normal input (bot mode) ── */}
          {isBot && !showHumanForm && !isEnded && (
            <div className="flex-shrink-0 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {/* Input row */}
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex items-center gap-2 px-3 py-2.5">
                <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…" disabled={typing}
                  className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-400 transition disabled:opacity-50" />
                <button type="submit" disabled={!input.trim() || typing}
                  className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white hover:bg-brand-400 transition disabled:opacity-40 flex-shrink-0">
                  <FaPaperPlane size={13} />
                </button>
              </form>
              {/* Persistent "Talk to a Human" button — always visible in bot mode */}
              <div className="px-3 pb-3">
                <button
                  onClick={handleTalkToHuman}
                  className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                >
                  <FaHeadset size={11} />
                  Talk to a Human
                </button>
              </div>
            </div>
          )}

          {/* ── Live chat input ── */}
          {isLive && !confirmEnd && (
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Message the team…"
                className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-400 transition" />
              <button type="submit" disabled={!input.trim()}
                className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white hover:bg-brand-400 transition disabled:opacity-40 flex-shrink-0">
                <FaPaperPlane size={13} />
              </button>
            </form>
          )}

          {/* ── Pending: input locked ── */}
          {isPending && (
            <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
              <div className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-paper dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed select-none">
                Waiting for agent to accept…
              </div>
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <FaSpinner size={13} className="text-gray-400 animate-spin" />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-400 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="Open chat">
        {open ? <FaTimes size={20} /> : <FaComments size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
