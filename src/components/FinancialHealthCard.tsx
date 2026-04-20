"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, TrendingUp, ShoppingBag, Target, AlertCircle } from "lucide-react";

interface FinancialHealthProps {
  data: {
    score: number;
    label: string;
    aiSummary: string;
    topCategory: string;
    prediction: string;
    scoreExplanation?: any;
  };
}
import { ScoreExplanationModal } from "./ScoreExplanationModal";

const FinancialHealthCard: React.FC<FinancialHealthProps> = ({ data }) => {
  const [progress, setProgress] = useState(0);
  const [isXaiOpen, setIsXaiOpen] = useState(false);

  useEffect(() => {
    // Animate the progress circle on mount
    const timer = setTimeout(() => {
      setProgress(data.score);
    }, 100);
    return () => clearTimeout(timer);
  }, [data.score]);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getLabelColor = (label: string) => {
    switch (label.toLowerCase()) {
      case "excellent":
      case "good":
        return "text-green-400 bg-green-500/10 border-green-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
      case "moderate":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
      case "poor":
        return "text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
      default:
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "stroke-green-400";
    if (score >= 60) return "stroke-blue-400";
    if (score >= 40) return "stroke-yellow-400";
    return "stroke-red-400";
  };

  return (
    <div className="mt-12 relative overflow-hidden p-10 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl transition-all duration-500 group">
      {/* Background glow for health card */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center lg:items-start text-center lg:text-left">

        {/* Left column: Score Circle */}
        <div className="flex flex-col items-center gap-6 shrink-0">
          <h3 className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
            <Target className="w-4 h-4 text-indigo-400" /> Vitality Index
          </h3>
          <button 
            onClick={() => setIsXaiOpen(true)}
            className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"
          >
            Why?
          </button>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-white/5"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 70}
                style={{
                  strokeDashoffset: (2 * Math.PI * 70) - (progress / 100) * (2 * Math.PI * 70),
                  transition: "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                className={`${getScoreColor(data.score)} stroke-linecap-round filter drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-white tracking-tighter tabular-nums">{data.score}</span>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Units</span>
            </div>
          </div>
          <span className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border backdrop-blur-md shadow-lg ${getLabelColor(data.label)}`}>
            {data.label}
          </span>
        </div>

        {/* Right column: AI Insights */}
        <div className="mt-12flex-1 space-y-8 w-full">
          <div className="relative p-8 bg-gradient-to-br from-indigo-900/20 to-transparent rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <h4 className="text-lg font-bold text-white tracking-tight">AI Advisor Summary</h4>
            </div>
            <p className="text-base text-zinc-300 leading-relaxed font-medium italic opacity-90">
              "{data.aiSummary}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-6 hover:bg-white/10 transition-all group/stat">
              <div className="p-6 bg-indigo-500/10 text-indigo-400 rounded-2xl group-hover/stat:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Top Sector</p>
                <p className="text-xl font-bold text-white tracking-tight">{data.topCategory}</p>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-6 hover:bg-white/10 transition-all group/stat">
              <div className="p-6 bg-emerald-500/10 text-emerald-400 rounded-2xl group-hover/stat:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mb-1">Pulse Outlook</p>
                <p className="text-xl font-bold text-white tracking-tight">{data.prediction.replace('Projected ', '')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {data.scoreExplanation && (
        <ScoreExplanationModal 
          isOpen={isXaiOpen} 
          onClose={() => setIsXaiOpen(false)} 
          explanation={data.scoreExplanation} 
        />
      )}
    </div>
  );
};

export default FinancialHealthCard;
