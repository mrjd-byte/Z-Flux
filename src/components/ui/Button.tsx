import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {

  const baseStyles = "inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/25",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full",
    ghost: "text-zinc-400 hover:text-white hover:bg-white/5 rounded-full",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.1)]",
    success: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]"
  };

  const sizes = {
    sm: "px-4 py-2 text-base",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-base",
    icon: "p-2"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
