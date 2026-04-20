"use client";

import React, { useEffect } from "react";
import { X, TrendingUp, TrendingDown, Info, ShieldCheck, Activity } from "lucide-react";
import { ScoreExplanation } from "@/lib/services/analytics";

interface ScoreExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: ScoreExplanation;
}

export const ScoreExplanationModal: React.FC<ScoreExplanationModalProps> = ({ isOpen, onClose, explanation }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Overlay for outside click */}
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose} 
      />
      
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a0a0a] rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 relative z-10 custom-scrollbar"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex justify-between items-center p-10 pb-6 border-b border-white/5 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Vitality Breakdown</h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all border border-white/5"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 pt-0 relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Logic: Deterministic Scoring</span>
            </div>
            <p className="text-sm font-bold text-zinc-200 leading-relaxed italic">
              "Your Vitality Index is calculated using real-time spending ratios and budget adherence metrics."
            </p>
          </div>

          <div className="space-y-3">
            {explanation.breakdown.map((item, idx) => {
              const isPositive = item.impact >= 0;
              return (
                <div key={idx} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/[0.07] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">{item.label}</h4>
                      <p className="text-sm font-bold text-white mt-0.5">{item.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-zinc-500 block uppercase tracking-widest mb-1">{item.value}</span>
                    <span className={`text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{item.impact}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
            <span className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em]">Final Computed Vitality</span>
            <span className="text-3xl font-bold text-white tracking-tighter">{explanation.finalScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
