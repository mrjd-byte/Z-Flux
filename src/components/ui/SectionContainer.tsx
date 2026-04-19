import React from "react";

interface SectionContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  subtitle?: React.ReactNode;
}

export function SectionContainer({ 
  children, 
  className = "", 
  title, 
  subtitle, 
  ...props 
}: SectionContainerProps) {
  return (
    <div className={`space-y-8 ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="space-y-2">
          {title && <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>}
          {subtitle && <p className="text-zinc-400 font-medium tracking-wide">{subtitle}</p>}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
