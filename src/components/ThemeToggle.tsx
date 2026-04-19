"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95 shadow-sm group"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5 transition-transform group-hover:-rotate-12" />
      ) : (
        <Sun className="w-5 h-5 transition-transform group-hover:rotate-45" />
      )}
    </button>
  );
}
