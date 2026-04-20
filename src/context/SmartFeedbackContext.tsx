"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { SmartMessageInput, generateSmartMessage, FeedbackType } from "@/lib/utils/smart-feedback";

interface FeedbackData {
  id: string;
  type: FeedbackType;
  title: string;
  message: string;
  impactLine?: string;
}

interface SmartFeedbackContextType {
  feedback: FeedbackData | null;
  triggerFeedback: (input: SmartMessageInput) => void;
  clearFeedback: () => void;
}

const SmartFeedbackContext = createContext<SmartFeedbackContextType | undefined>(undefined);

export function SmartFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);

  const triggerFeedback = useCallback((input: SmartMessageInput) => {
    const { title, message, impactLine } = generateSmartMessage(input);
    
    setFeedback({
      id: Math.random().toString(36).substr(2, 9),
      type: input.type,
      title,
      message,
      impactLine
    });
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return (
    <SmartFeedbackContext.Provider value={{ feedback, triggerFeedback, clearFeedback }}>
      {children}
    </SmartFeedbackContext.Provider>
  );
}

export function useSmartFeedback() {
  const context = useContext(SmartFeedbackContext);
  if (context === undefined) {
    throw new Error("useSmartFeedback must be used within a SmartFeedbackProvider");
  }
  return context;
}
