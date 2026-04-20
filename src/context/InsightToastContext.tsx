"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";

export type Insight = {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  priority: "HIGH" | "MEDIUM" | "LOW";
  route?: string;
};

type InsightToastContextType = {
  queue: Insight[];
  currentToast: Insight | null;
  addInsight: (insight: Omit<Insight, "id">) => void;
  popInsight: () => void;
  clearCurrent: () => void;
};

const InsightToastContext = createContext<InsightToastContextType | undefined>(undefined);

export function InsightToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Insight[]>([]);
  const [currentToast, setCurrentToast] = useState<Insight | null>(null);
  const shownSet = useRef<Set<string>>(new Set());

  const addInsight = useCallback((newInsight: Omit<Insight, "id">) => {
    if (shownSet.current.has(newInsight.message)) return;

    const insight: Insight = {
      ...newInsight,
      id: Math.random().toString(36).substr(2, 9)
    };

    shownSet.current.add(newInsight.message);

    setQueue((prev) => {
      if (insight.priority === "HIGH") {
        return [insight, ...prev];
      }
      return [...prev, insight];
    });
  }, []);

  const popInsight = useCallback(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [next, ...rest] = prev;
      setCurrentToast(next);
      return rest;
    });
  }, []);

  const clearCurrent = useCallback(() => {
    setCurrentToast(null);
  }, []);

  return (
    <InsightToastContext.Provider value={{ queue, currentToast, addInsight, popInsight, clearCurrent }}>
      {children}
    </InsightToastContext.Provider>
  );
}

export function useInsightToast() {
  const context = useContext(InsightToastContext);
  if (context === undefined) {
    throw new Error("useInsightToast must be used within an InsightToastProvider");
  }
  return context;
}
