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
  };
}

const FinancialHealthCard: React.FC<FinancialHealthProps> = ({ data }) => {
  const [progress, setProgress] = useState(0);

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
    <div className="relative overflow-hidden p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-300 group">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        
        {/* Left column: Score Circle */}
        <div className="flex flex-col items-center gap-4 shrink-0">
          <h3 className="text-white/60 text-xs font-medium uppercase tracking-widest flex items-center gap-2">
            <Target className="w-3 h-3" /> Health Score
          </h3>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/5"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                style={{ 
                  strokeDashoffset: strokeDashoffset,
                  transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                className={`${getScoreColor(data.score)} stroke-linecap-round`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white tracking-tighter">{data.score}</span>
              <span className="text-[10px] text-white/40 font-medium">/ 100</span>
            </div>
          </div>
          <span className={`px-4 py-1 rounded-full text-xs font-bold border ${getLabelColor(data.label)}`}>
            {data.label}
          </span>
        </div>

        {/* Right column: AI Insights */}
        <div className="flex-1 space-y-6 w-full">
          <div className="relative p-5 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-white/90">AI Advisor Summary</h4>
            </div>
            <p className="text-sm text-white/70 leading-relaxed italic">
              "{data.aiSummary}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-all">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Top Expense</p>
                <p className="text-sm font-bold text-white">{data.topCategory}</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-all">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">6-Month Outlook</p>
                <p className="text-sm font-bold text-white">{data.prediction.replace('Projected ', '')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default FinancialHealthCard;
