"use client";

import React, { useEffect } from "react";
import { useInsightToast } from "@/context/InsightToastContext";
import { InsightToast } from "./InsightToast";

export function InsightToastController() {
  const { queue, currentToast, popInsight, clearCurrent } = useInsightToast();

  useEffect(() => {
    // 10 second cycle for new toasts
    const interval = setInterval(() => {
      if (!currentToast && queue.length > 0) {
        popInsight();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [queue, currentToast, popInsight]);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    if (currentToast) {
      const timer = setTimeout(() => {
        clearCurrent();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [currentToast, clearCurrent]);

  if (!currentToast) return null;

  return <InsightToast insight={currentToast} onClose={clearCurrent} />;
}
