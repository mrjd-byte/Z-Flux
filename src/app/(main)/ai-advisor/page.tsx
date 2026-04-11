"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Send, AlertTriangle, ShieldAlert, CheckCircle2, Plus, MessageSquare } from "lucide-react";

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
    <div className="max-w-5xl space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-white">AI Advisor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: INSIGHTS & HISTORY */}
        <div className="space-y-6">
          {/* INSIGHTS */}
          <div className="bg-white/5 rounded-2xl border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">Summary Insights</h3>
            </div>

            <div className="p-4 flex flex-col gap-3 min-h-[200px]">
              {loading ? (
                <div className="flex justify-center items-center">
                  <Loader2 className="animate-spin text-blue-500" />
                </div>
              ) : insights.length > 0 ? (
                insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    {renderIcon(insight)}
                    <p className="text-sm text-white/70">{insight.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-white/50 text-sm text-center">No insights</div>
              )}
            </div>
          </div>

          {/* HISTORY */}
          <div className="bg-white/5 rounded-2xl border border-white/10 flex flex-col max-h-[400px]">
             <div className="p-4 border-b border-white/10 flex items-center justify-between">
               <h3 className="font-semibold text-white">Chat History</h3>
               <button onClick={createNewSession} className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5">
                 <Plus className="w-3.5 h-3.5" /> New
               </button>
             </div>
             <div className="p-2 overflow-y-auto space-y-1 custom-scrollbar min-h-[150px]">
                {sessions.map(session => (
                   <button 
                     key={session.id}
                     onClick={() => setActiveSessionId(session.id)}
                     className={`w-full text-left px-3 py-3 rounded-xl transition-all flex items-center gap-3 ${
                       session.id === activeSessionId ? "bg-white/10 text-white ring-1 ring-white/20" : "text-white/60 hover:bg-white/5 hover:text-white"
                     }`}
                   >
                     <MessageSquare className={`w-4 h-4 shrink-0 ${session.id === activeSessionId ? "text-blue-400" : ""}`} />
                     <span className="text-sm truncate w-full font-medium">{session.title}</span>
                   </button>
                ))}
             </div>
          </div>
        </div>

        {/* CHAT */}
        <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 flex flex-col h-[600px] lg:h-auto lg:min-h-[600px]">

          {/* HEADER */}
          <div className="p-4 border-b border-white/10 flex justify-between">
            <div>
              <h3 className="text-white font-semibold">Ask your Advisor</h3>
              <p className="text-xs text-white/50">{activeSession ? activeSession.title : "Personalized guidance"}</p>
            </div>
            <div className="text-green-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              Online
            </div>
          </div>

          {/* CHAT LOG */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatLog.map((log, i) => (
              <div key={i} className={`flex ${log.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                  log.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-white border border-white/10"
                }`}>
                  {log.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 rounded-2xl p-4 text-sm rounded-bl-sm border border-white/10 flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 bg-black/20 border border-white/10 rounded-full px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button disabled={isTyping || !chatMessage.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 rounded-full text-white transition-opacity">
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}