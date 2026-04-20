"use client";

import React from "react";
import { Sparkles, Info, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Insight } from "@/context/InsightToastContext";

export function InsightToast({ insight, onClose }: { insight: Insight; onClose: () => void }) {
  const router = useRouter();

  const getIcon = () => {
    switch (insight.type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      default:
        return <Info className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleLink = () => {
    if (insight.route) {
      router.push(insight.route);
      onClose();
    }
  };

  return (
    <div 
      className={`
        fixed bottom-6 right-6 z-[100] w-[320px] 
        bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 
        shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer hover:border-indigo-500/30 transition-all 
        animate-in fade-in slide-in-from-bottom-5 duration-500 overflow-hidden group
      `}
      onClick={handleLink}
    >
      {/* Background glow layer */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">AI Insight</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 hover:bg-white/5 rounded-md text-zinc-600 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-4 items-start">
          <div className="mt-1 flex-shrink-0">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-100 leading-tight tracking-tight">
              {insight.message}
            </p>
            {insight.route && (
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2 group-hover:text-indigo-400 transition-colors">
                View Details →
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
