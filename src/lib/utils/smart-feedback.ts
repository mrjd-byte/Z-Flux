/**
 * Z-Flux Smart Feedback Engine
 * Deterministic, playful, and data-driven feedback messages.
 */

export type FeedbackType = "POSITIVE" | "NEGATIVE" | "TRANSFER" | "MILESTONE" | "PLAN";

export interface SmartMessageInput {
  type: FeedbackType;
  amount?: number;
  category?: string;
  friendName?: string;
  savingsImpact?: number;
  scoreImpact?: number;
}

const POSITIVE_TEMPLATES = [
  "Nice move! You just saved ₹{amount} 📈",
  "That was efficient spending. Score increased! ⚡",
  "Discipline level: rising. You're in control 🚀",
  "Optimization complete. Your future self is smiling 💰"
];

const NEGATIVE_TEMPLATES = [
  "You pushed ₹{amount} over budget boundaries ⚠️",
  "This might slow down your savings trajectory 📉",
  "Small spend, but big impact over time 💸",
  "Budget alert: The flux is getting a bit heavy ⚓"
];

const TRANSFER_TEMPLATES = [
  "Sent ₹{amount} to {friendName}. Friendship intact 😄",
  "Transfer successful. Nexus updated with {friendName} 🤝",
  "Direct exchange complete. Flow looks seamless 💰",
  "Balance updated. {friendName} has received the protocol 🔗"
];

const MILESTONE_TEMPLATES = [
  "New High Score! Vitality levels are peaking 🏆",
  "Savings Milestone: You're crushing it today 🎖️",
  "Boundary reached. Financial clarity achieved 💎"
];

const TAUNT_TEMPLATES = [
  "Future you might question this one, but we recover 💪",
  "A little impulsive... but let's balance it out 🤔",
  "That wasn't very budget-friendly, was it? 😅",
  "Budget: 'Am I a joke to you?' 🤡"
];

export function generateSmartMessage(input: SmartMessageInput) {
  const { type, amount = 0, friendName = "Someone", category = "General", scoreImpact = 0 } = input;
  
  let templates = type === "POSITIVE" ? POSITIVE_TEMPLATES : 
                  (type === "NEGATIVE" ? NEGATIVE_TEMPLATES : 
                  (type === "TRANSFER" ? TRANSFER_TEMPLATES : MILESTONE_TEMPLATES));
  
  // High Overspend Taunt Logic (Threshold: ₹1000)
  if (type === "NEGATIVE" && amount > 1000) {
    if (Math.random() > 0.5) {
      templates = TAUNT_TEMPLATES;
    }
  }

  // Pick random template
  const rawTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  // Replace placeholders
  const message = rawTemplate
    .replace("{amount}", amount.toLocaleString())
    .replace("{friendName}", friendName)
    .replace("{category}", category);

  // Title logic
  const titleMap: Record<FeedbackType, string> = {
    POSITIVE: "Smart Move",
    NEGATIVE: "Budget Alert",
    TRANSFER: "Protocol Complete",
    MILESTONE: "Milestone Reached",
    PLAN: "Plan Applied"
  };

  const title = titleMap[type];

  // Impact line
  let impactLine = "";
  if (scoreImpact !== 0) {
    const sign = scoreImpact > 0 ? "+" : "";
    impactLine = `${sign}${scoreImpact} Vitality Points`;
  } else if (input.savingsImpact && input.savingsImpact > 0) {
    impactLine = `₹${input.savingsImpact} closer to target`;
  }

  return { title, message, impactLine };
}
