import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export function GlassCard({ children, className = "", hoverEffect = false, ...props }: GlassCardProps) {
  const hoverClass = hoverEffect ? "hover:border-indigo-500/30 transition-colors group" : "";
  
  return (
    <div 
      className={`p-6 md:p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
