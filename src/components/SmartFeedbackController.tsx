"use client";

import React, { useEffect } from "react";
import { useSmartFeedback } from "@/context/SmartFeedbackContext";
import { SmartFeedbackModal } from "./SmartFeedbackModal";

export function SmartFeedbackController() {
  const { feedback, clearFeedback } = useSmartFeedback();

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        clearFeedback();
      }, 4000); // 4-second cinematic display

      return () => clearTimeout(timer);
    }
  }, [feedback, clearFeedback]);

  if (!feedback) return null;

  return (
    <SmartFeedbackModal 
      key={feedback.id}
      title={feedback.title}
      message={feedback.message}
      impactLine={feedback.impactLine}
      type={feedback.type}
      onClose={clearFeedback}
    />
  );
}
