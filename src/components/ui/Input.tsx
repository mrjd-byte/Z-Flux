import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label className="text-base font-semibold text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full ${icon ? 'pl-11' : 'px-4'} py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all ${error ? "border-red-500/50 focus:ring-red-500/40 focus:border-red-500/40" : ""
              } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
