"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, Send, Lightbulb, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function AIAdvisorPage() {
  const [insights, setInsights] = useState<string[]>([]);
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

  const renderIcon = (text: string) => {
    if (text.includes("Overspent") || text.includes("loss")) return <ShieldAlert className="w-5 h-5 text-red-500" />;
    if (text.includes("Warning")) return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    if (text.includes("Tip")) return <Lightbulb className="w-5 h-5 text-blue-500" />;
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  };

  const parseText = (text: string) => {
    // Strip emojis from the backend payload for a cleaner standard card appearance
    return text.replace(/^[🚨⚠️💡🛑✅]\s*/, "");
  };

  return (
    <div className="max-w-5xl space-y-6">
      
      <div className="flex items-center gap-3">
         <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
           <Sparkles className="w-6 h-6" />
         </div>
         <h1 className="text-2xl font-bold dark:text-white">AI Advisor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Span: Insights & Recommendations */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
               <h3 className="font-semibold text-gray-900 dark:text-white">Summary Insights</h3>
             </div>
             <div className="p-4 flex flex-col gap-3 min-h-[200px]">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : insights.length > 0 ? (
                  insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-750/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                       <div className="mt-0.5">{renderIcon(insight)}</div>
                       <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                         {parseText(insight)}
                       </p>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm italic items-center flex justify-center h-full">No active insights found.</div>
                )}
             </div>
           </div>
        </div>

        {/* Right Span: Static Chat UI */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[600px] overflow-hidden">
           <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Ask your Advisor</h3>
                <p className="text-xs text-gray-500">Get personalized financial guidance instantly.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                 Online
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatLog.map((log, index) => (
                <div key={index} className={`flex ${log.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                    log.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-sm" 
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-600"
                  }`}>
                    {log.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 text-sm rounded-bl-sm border border-gray-200 dark:border-gray-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
           </div>

           <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
             <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Ask a question about your spending..."
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  disabled={isTyping}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={!chatMessage.trim() || isTyping}
                  className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition"
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
