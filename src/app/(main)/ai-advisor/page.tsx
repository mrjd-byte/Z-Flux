"use client";

import { useState, useEffect } from "react";
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
    <SectionContainer
      title="AI Financial Advisor"
      subtitle="Personalized AI insights for your financial health"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: INSIGHTS & HISTORY */}
        <div className="space-y-8">
          {/* INSIGHTS */}
          <GlassCard className="p-0 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider">Automated Insights</h3>
            </div>

            <div className="p-6 flex flex-col gap-6 min-h-[200px]">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-indigo-500" />
                </div>
              ) : insights.length > 0 ? (
                insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-3 p-6 bg-white/5 rounded-xl border border-white/10 items-start">
                    <div className="mt-0.5">{renderIcon(insight)}</div>
                    <p className="text-base text-zinc-300 leading-relaxed font-medium">{insight.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-base text-center py-12 italic font-medium">No strategic insights generated yet.</div>
              )}
            </div>
          </GlassCard>

          {/* HISTORY */}
          <GlassCard className="p-0 flex flex-col max-h-[500px] overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Chat Sessions</h3>
              <Button
                onClick={createNewSession}
                variant="primary"
                className="!px-3 !py-1.5 !rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Start New
              </Button>
            </div>
            <div className="p-3 overflow-y-auto space-y-1.5 custom-scrollbar min-h-[200px]">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 group ${session.id === activeSessionId
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                    : "text-zinc-500 hover:bg-white/5"
                    }`}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${session.id === activeSessionId ? "text-indigo-400" : "text-zinc-500 group-hover:text-indigo-400"}`} />
                  <span className="text-base truncate font-semibold">{session.title}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* CHAT */}
        <GlassCard className="lg:col-span-2 p-0 flex flex-col h-[600px] lg:h-auto lg:min-h-[600px] overflow-hidden">

          {/* CHAT HEADER */}
          <div className="p-6 border-b border-white/5 flex justify-between bg-white/[0.02]">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Financial Advisor Chat
              </h3>
              <p className="text-xs text-zinc-500 font-medium ml-6">{activeSession ? activeSession.title : "Personalized guidance"}</p>
            </div>
            <div className="text-emerald-400 text-xs flex items-center gap-2 font-black uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              Secure Connection
            </div>
          </div>

          {/* CHAT LOG */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
            {chatLog.map((log, i) => (
              <div key={i} className={`flex ${log.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-6 rounded-2xl text-base leading-relaxed ${log.role === "user"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-white/5 text-zinc-300 border border-white/10 shadow-sm"
                  }`}>
                  {log.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl p-6 text-base border border-white/10 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="p-6 bg-white/[0.02] border-t border-white/5">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Ask your advisor about your spending..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-base placeholder:text-zinc-600 focus:border-indigo-500/50"
              />
              <Button
                disabled={isTyping || !chatMessage.trim()}
                className="w-12 h-12 flex flex-col items-center justify-center !p-0"
              >
                <Send size={18} />
              </Button>
            </form>
          </div>

        </GlassCard>
      </div>
    </SectionContainer>
  );
}