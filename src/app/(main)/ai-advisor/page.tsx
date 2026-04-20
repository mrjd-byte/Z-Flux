"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, Send, AlertTriangle, ShieldAlert, CheckCircle2, Plus, MessageSquare } from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type InsightData = {
  message: string;
  type: "danger" | "warning" | "good";
};

type ChatMessage = { role: string; content: string };
type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
};

export default function AIAdvisorPage() {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);

  const [chatMessage, setChatMessage] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, isTyping]);

  // ✅ LOAD SESSIONS
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/chat/session", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.sessions && data.sessions.length > 0) {
            setSessions(data.sessions);
            setActiveSessionId(data.sessions[0].id);
          } else {
            // Initializing default session on first open if empty
            createNewSession();
          }
        }
      } catch (err) {
        console.error("Failed to load sessions", err);
      }
    };

    fetchSessions();
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const chatLog = activeSession ? activeSession.messages : [];

  const createNewSession = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(prev => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
      }
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  // 🔥 FETCH INSIGHTS
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/ai/insights", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (res.ok) setInsights(data.insights || []);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatMessage.trim() || isTyping || !activeSessionId) return;

    const currentMessage = chatMessage;
    setChatMessage("");
    setIsTyping(true);

    const isFirstUserMessage = chatLog.filter(m => m.role === "user").length === 0;
    let newTitle = activeSession?.title || "New Chat";

    if (isFirstUserMessage) {
      newTitle = currentMessage.length > 25 ? currentMessage.slice(0, 25) + "..." : currentMessage;
    }

    const optimisticUserMessage = { role: "user", content: currentMessage };
    let newMessages = [...(activeSession?.messages || []), optimisticUserMessage];

    // Optimistic UI Update for User Message
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: newTitle,
          messages: newMessages
        };
      }
      return s;
    }));

    const token = localStorage.getItem("token");

    // Background sync of user message and potentially title
    fetch(`/api/chat/session/${activeSessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: newMessages, title: isFirstUserMessage ? newTitle : undefined })
    }).catch(console.error);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: currentMessage })
      });

      if (res.ok) {
        const data = await res.json();
        const optimisticAIMessage = { role: "ai", content: data.response };
        newMessages = [...newMessages, optimisticAIMessage];

        // UI Update for AI Message
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: newMessages };
          }
          return s;
        }));

        // Background sync of AI response
        fetch(`/api/chat/session/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: newMessages })
        }).catch(console.error);

      } else {
        const errorMsg = { role: "ai", content: "Error connecting to AI advisor." };
        newMessages = [...newMessages, errorMsg];

        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: newMessages } : s));

        fetch(`/api/chat/session/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: newMessages })
        }).catch(console.error);
      }

    } catch {
      const unreachableMsg = { role: "ai", content: "Service unreachable." };
      newMessages = [...newMessages, unreachableMsg];

      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: newMessages } : s));

      fetch(`/api/chat/session/${activeSessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: newMessages })
      }).catch(console.error);
    } finally {
      setIsTyping(false);
    }
  };

  const renderIcon = (insight: InsightData) => {
    if (insight.type === "danger") return <ShieldAlert className="w-5 h-5 text-red-500" />;
    if (insight.type === "warning") return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#050505]">
      {/* CHAT HEADER (FIXED) */}
      <div className="p-6 border-b border-white/5 flex justify-between bg-white/[0.02] flex-shrink-0">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Financial Advisor Chat
          </h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest ml-6">
            {activeSession ? activeSession.title : "Active Intelligence"}
          </p>
        </div>
        <div className="text-emerald-400 text-[10px] flex items-center gap-2 font-black uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Secure Sync
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0 bg-black/10">
        {/* LEFT SIDEBAR (HISTORY) - Hidden on mobile */}
        <div className="hidden lg:flex w-72 flex-shrink-0 flex-col border-r border-white/5 bg-white/[0.01]">
          <div className="p-4 border-b border-white/5">
            <Button
              onClick={createNewSession}
              variant="primary"
              className="w-full !rounded-xl text-sm py-2.5"
            >
              <Plus className="w-4 h-4 mr-2" /> New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 group ${session.id === activeSessionId
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                  : "text-zinc-500 hover:bg-white/5"
                  }`}
              >
                <MessageSquare className={`w-4 h-4 shrink-0 ${session.id === activeSessionId ? "text-indigo-400" : "text-zinc-500"}`} />
                <span className="text-sm truncate font-bold">{session.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MESSAGES AREA (SCROLLABLE) */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
            {chatLog.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                <Sparkles className="w-12 h-12 text-indigo-500 mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-white mb-2">Ask your financial advisor</h3>
                <p className="text-zinc-500 text-sm max-w-xs">Get insights on your spending, savings milestones, or budget strategy.</p>
              </div>
            )}

            {chatLog.map((log, i) => (
              <div key={i} className={`flex ${log.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] md:max-w-[70%] p-5 rounded-2xl text-base leading-relaxed ${log.role === "user"
                  ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl shadow-indigo-600/10 font-medium"
                  : "bg-white/5 text-zinc-300 border border-white/10 shadow-sm"
                  }`}>
                  {log.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-widest mr-2">AI Analyzing</span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA (FIXED BOTTOM) */}
          <div className="p-6 bg-black/40 backdrop-blur-3xl border-t border-white/5">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Ask about your financial health..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-base placeholder:text-zinc-600"
              />
              <Button
                disabled={isTyping || !chatMessage.trim()}
                className="w-14 h-14 flex items-center justify-center !p-0 rounded-2xl"
              >
                <Send size={20} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}