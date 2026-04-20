"use client";

import React, { useEffect } from "react";
import { X, Scale, ArrowRight, Activity, Percent } from "lucide-react";
import { InsightExplanation } from "@/lib/services/analytics";

interface InsightExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: InsightExplanation | undefined;
}

export const InsightExplanationModal: React.FC<InsightExplanationModalProps> = ({ isOpen, onClose, explanation }) => {
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

  if (!isOpen || !explanation) return null;

  const isIncrease = explanation.change.startsWith('+');

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
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex justify-between items-center p-10 pb-6 border-b border-white/5 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Insight Logic</h3>
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
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{explanation.trigger}</span>
            </div>
            <p className="text-sm font-bold text-zinc-200 leading-relaxed italic">
              "{explanation.reason}"
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Previous Period</span>
                <span className="text-2xl font-bold text-white tracking-tight">{explanation.previous}</span>
              </div>
              <div className="hidden md:block text-zinc-700">
                <ArrowRight className="w-6 h-6" />
              </div>
              <div className="flex-1 md:text-right">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Current Period</span>
                <span className="text-2xl font-bold text-white tracking-tight">{explanation.current}</span>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border flex items-center justify-between ${isIncrease ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <div className="flex items-center gap-3">
                <Percent className={`w-5 h-5 ${isIncrease ? 'text-rose-400' : 'text-emerald-400'}`} />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Relative Delta</span>
              </div>
              <span className={`text-2xl font-black ${isIncrease ? 'text-rose-400' : 'text-emerald-400'}`}>
                {explanation.change}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center mt-4">
            Standard Comparison Cycle: 7 Days
          </p>
        </div>
      </div>
    </div>
  );
};
