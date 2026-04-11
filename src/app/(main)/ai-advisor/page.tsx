"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Send, Lightbulb, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

type InsightData = {
  message: string;
  type: "danger" | "warning" | "good";
};

export default function AIAdvisorPage() {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat Mock State
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState<{ role: string, content: string }[]>([
    { role: "ai", content: "Hi! I'm your Z-Flux AI Advisor. How can I help you manage your finances today?" }
  ]);

  const [isTyping, setIsTyping] = useState(false);

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
    setChatLog((prev) => [...prev, { role: "user", content: currentMessage }]);
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
         setChatLog((prev) => [...prev, { role: "ai", content: data.response }]);
      } else {
         setChatLog((prev) => [...prev, { role: "ai", content: "Error connecting to AI advisor." }]);
      }
    } catch(err) {
       setChatLog((prev) => [...prev, { role: "ai", content: "Service completely unreachable." }]);
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
      
      <div className="flex items-center gap-3">
         <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20">
           <Sparkles className="w-6 h-6 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
         </div>
         <h1 className="text-3xl font-bold text-white tracking-tight">AI Advisor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Span: Insights & Recommendations */}
        <div className="lg:col-span-1 space-y-6">
           <div className="relative overflow-hidden bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
             <div className="p-4 border-b border-white/10 relative z-10">
               <h3 className="font-semibold text-white tracking-tight">Summary Insights</h3>
             </div>
             <div className="p-4 flex flex-col gap-3 min-h-[200px] relative z-10">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : insights.length > 0 ? (
                  insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)]">
                       <div className="mt-0.5">{renderIcon(insight)}</div>
                       <p className="text-sm text-white/70 leading-relaxed">
                         {insight.message}
                       </p>
                    </div>
                  ))
                ) : (
                  <div className="text-white/50 text-sm italic items-center flex justify-center h-full">No active insights found.</div>
                )}
             </div>
           </div>
        </div>

        {/* Right Span: Static Chat UI */}
        <div className="lg:col-span-2 relative overflow-hidden bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col h-[600px] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
           <div className="p-4 border-b border-white/10 flex items-center justify-between relative z-10">
              <div>
                <h3 className="font-semibold text-white tracking-tight">Ask your Advisor</h3>
                <p className="text-xs text-white/50">Get personalized financial guidance instantly.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-green-400 bg-green-500/10 ring-1 ring-green-500/20 px-2.5 py-1 rounded-full">
                 <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                 Online
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 custom-scrollbar">
              {chatLog.map((log, index) => (
                <div key={index} className={`flex ${log.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                    log.role === "user" 
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-blue-500/20" 
                      : "bg-white/5 text-white rounded-bl-sm border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)]"
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

           <div className="p-4 border-t border-white/10 relative z-10">
             <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Ask a question about your spending..."
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  disabled={isTyping}
                  className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-white/30 disabled:opacity-50 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!chatMessage.trim() || isTyping}
                  className="absolute right-2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:from-blue-600 disabled:to-indigo-600 transition shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
             </form>
           </div>
        </div>

      </div>
    </div>
  );
}
