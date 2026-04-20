"use client";

import React, { useEffect, useRef } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Handshake, Target, CheckCircle2 } from "lucide-react";
import { FeedbackType } from "@/lib/utils/smart-feedback";

interface SmartFeedbackModalProps {
  title: string;
  message: string;
  impactLine?: string;
  type: FeedbackType;
  onClose: () => void;
}

export function SmartFeedbackModal({ title, message, impactLine, type, onClose }: SmartFeedbackModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const getIcon = () => {
    switch (type) {
      case "POSITIVE": return <TrendingUp className="w-12 h-12 text-emerald-400" />;
      case "NEGATIVE": return <AlertTriangle className="w-12 h-12 text-rose-400" />;
      case "TRANSFER": return <Handshake className="w-12 h-12 text-indigo-400" />;
      case "MILESTONE": return <Target className="w-12 h-12 text-amber-400" />;
      case "PLAN": return <CheckCircle2 className="w-12 h-12 text-sky-400" />;
      default: return <Sparkles className="w-12 h-12 text-indigo-400" />;
    }
  };

  const getGlowColor = () => {
    switch (type) {
      case "POSITIVE": return "bg-emerald-500";
      case "NEGATIVE": return "bg-rose-500";
      case "TRANSFER": return "bg-indigo-500";
      case "MILESTONE": return "bg-amber-500";
      default: return "bg-sky-500";
    }
  };

  const playTone = () => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(type === "NEGATIVE" ? 220 : 440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(type === "NEGATIVE" ? 110 : 880, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // Audio might be blocked by browser policy
    }
  };

  useEffect(() => {
    playTone();
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-2xl animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-[550px] bg-[#0a0a0a]/90 border border-white/10 rounded-[32px] p-12 overflow-hidden shadow-2xl animate-modal-bounce"
      >
        {/* Cinematic Glows */}
        <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 ${getGlowColor()}`} />
        <div className={`absolute -bottom-24 -left-24 w-64 h-64 blur-[100px] opacity-10 ${getGlowColor()}`} />

        <div className="relative flex flex-col items-center text-center space-y-8">
          {/* Icon Container */}
          <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-500">
            {getIcon()}
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white tracking-tight">{title}</h2>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-[400px]">
              {message}
            </p>
          </div>

          {impactLine && (
            <div className="px-5 py-2 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                {impactLine}
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full h-16 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Got it
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-bounce {
          0% {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          70% {
            opacity: 1;
            transform: scale(1.02) translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .animate-modal-bounce {
          animation: modal-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
