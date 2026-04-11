"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Send, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

type InsightData = {
  message: string;
  type: "danger" | "warning" | "good";
};

export default function AIAdvisorPage() {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultMessage = {
    role: "ai",
    content: "Hi! I'm your Z-Flux AI Advisor. How can I help you manage your finances today?"
  };

  const [chatMessage, setChatMessage] = useState("");

  const [chatLog, setChatLog] = useState<{ role: string; content: string }[]>([]);

  const [isTyping, setIsTyping] = useState(false);

  // ✅ LOAD CHAT (FIXED)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("zflux_chat");

    if (!saved) {
      setChatLog([defaultMessage]);
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (!parsed.length) {
        setChatLog([defaultMessage]);
        return;
      }

      // Ensure first message is always AI intro
      if (parsed[0].content !== defaultMessage.content) {
        setChatLog([defaultMessage, ...parsed]);
      } else {
        setChatLog(parsed);
      }

    } catch {
      setChatLog([defaultMessage]);
    }
  }, []);

  // ✅ SAVE CHAT
  useEffect(() => {
    if (chatLog.length > 0) {
      localStorage.setItem("zflux_chat", JSON.stringify(chatLog));
    }
  }, [chatLog]);

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

    if (!chatMessage.trim() || isTyping) return;

    const currentMessage = chatMessage;

    setChatLog(prev => [...prev, { role: "user", content: currentMessage }]);

    setChatMessage("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");

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

        setChatLog(prev => [...prev, { role: "ai", content: data.response }]);
      } else {
        setChatLog(prev => [...prev, { role: "ai", content: "Error connecting to AI advisor." }]);
      }

    } catch {
      setChatLog(prev => [...prev, { role: "ai", content: "Service unreachable." }]);
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

        {/* INSIGHTS */}
        <div className="space-y-6">
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
        </div>

        {/* CHAT */}
        <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 flex flex-col h-[600px]">

          {/* HEADER */}
          <div className="p-4 border-b border-white/10 flex justify-between">
            <div>
              <h3 className="text-white font-semibold">Ask your Advisor</h3>
              <p className="text-xs text-white/50">Personalized guidance</p>
            </div>
            <div className="text-green-400 text-xs">Online</div>
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

            {isTyping && <div className="text-white/50 text-sm">Typing...</div>}
          </div>

          {/* INPUT */}
          <div className="p-4 border-t border-white/10">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 bg-black/20 border border-white/10 rounded-full px-4 py-2 text-white"
              />
              <button className="bg-blue-600 px-4 rounded-full">
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}