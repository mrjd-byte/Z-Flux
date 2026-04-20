import { prisma } from "@/lib/prisma";

export type ExplanationItem = {
  label: string;
  value: string;
  impact: number;
  message: string;
};

export type ScoreExplanation = {
  breakdown: ExplanationItem[];
  finalScore: number;
};

export type InsightExplanation = {
  trigger: string;
  previous: string;
  current: string;
  change: string;
  reason: string;
};

export async function getDashboardAnalytics(userId: string) {
  // Fetch user and wallet
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const wallet = await prisma.wallet.findFirst({ where: { userId } });

  if (!user || !wallet) {
    throw new Error("Data not found");
  }

  // Proactive Sync: Ensure User.walletBalance matches legacy Wallet.balance if it's 0
  if (user.walletBalance === 0 && wallet.balance > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: wallet.balance }
    });
    user.walletBalance = wallet.balance; // Update local ref
  }

  // Fetch recent transactions (top 5) for quick list overview
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const allTransactions = await prisma.transaction.findMany({
    where: { userId },
  });

  const budgets = await prisma.budget.findMany({
    where: { userId }
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCategoryMap: Record<string, number> = {};
  let monthlyExpenses = 0;
  let totalExpenses = 0;
  let totalIncome = 0;
  let totalSalaryTransferred = 0;
  const categoryMap: Record<string, number> = {};
  const trendMap: Record<string, number> = {};

  for (const tx of allTransactions) {
    const isExpense = tx.senderId ? (userId === tx.senderId) : (tx.type === "DEBIT" || tx.type === "EXPENSE" || tx.type === "TRANSFER_OUT");
    const isIncome = tx.receiverId ? (userId === tx.receiverId) : (tx.type === "CREDIT" || tx.type === "INCOME" || tx.type === "TRANSFER_IN" || tx.type === "SALARY_TO_WALLET");
    const isThisMonth = tx.createdAt >= startOfMonth;

    if (tx.type === "SALARY_TO_WALLET") {
      totalSalaryTransferred += tx.amount;
    }

    if (isExpense) {
      totalExpenses += tx.amount;
      if (isThisMonth) {
        monthlyExpenses += tx.amount;
        const cat = tx.category || "General";
        monthlyCategoryMap[cat] = (monthlyCategoryMap[cat] || 0) + tx.amount;
      }

      // Group by category for pie chart (lifetime)
      const cat = tx.category || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + tx.amount;

      // Group by distinct date for trend line
      const d = new Date(tx.createdAt);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      trendMap[dateStr] = (trendMap[dateStr] || 0) + tx.amount;
    }

    if (isIncome) {
      totalIncome += tx.amount;
    }
  }

  // 🔥 NEW: Weekly Trend Logic
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  let currentWeekExpenses = 0;
  let lastWeekExpenses = 0;
  const currentWeekCategoryMap: Record<string, number> = {};

  for (const tx of allTransactions) {
    const isExpense = tx.senderId ? (userId === tx.senderId) : (tx.type === "DEBIT" || tx.type === "EXPENSE" || tx.type === "TRANSFER_OUT");
    if (isExpense) {
      if (tx.createdAt >= oneWeekAgo) {
        currentWeekExpenses += tx.amount;
        const cat = tx.category || "General";
        currentWeekCategoryMap[cat] = (currentWeekCategoryMap[cat] || 0) + tx.amount;
      } else if (tx.createdAt >= twoWeeksAgo) {
        lastWeekExpenses += tx.amount;
      }
    }
  }

  const weeklyChange = lastWeekExpenses > 0 
    ? ((currentWeekExpenses - lastWeekExpenses) / lastWeekExpenses) * 100 
    : 0;

  const currentWeekTopCategory = Object.keys(currentWeekCategoryMap).length > 0
    ? Object.keys(currentWeekCategoryMap).sort((a, b) => currentWeekCategoryMap[b] - currentWeekCategoryMap[a])[0]
    : "None";

  const categoryBreakdown = Object.keys(categoryMap).map(key => ({
    name: key,
    value: categoryMap[key]
  }));

  const expenseTrend = Object.keys(trendMap)
    .sort((a, b) => new Date(`2000/${a}`).getTime() - new Date(`2000/${b}`).getTime())
    .map(key => ({
      date: key,
      amount: trendMap[key]
    }));

  const savings = user.monthlyIncome - totalSalaryTransferred;
  const remainingBudget = user.monthlyIncome - totalExpenses;

  // 🔥 NEW: Balanced Vitality Index Calculation
  // 1. Calculate Metrics
  const income = user.monthlyIncome || 0;
  const savingsRate = income > 0 ? (income - monthlyExpenses) / income : 0;
  const clampedSavingsRate = Math.max(0, Math.min(1, savingsRate));

  let overspentAmount = 0;
  let totalBudget = 0;
  budgets.forEach(b => {
    totalBudget += b.amount;
    const spent = monthlyCategoryMap[b.category] || 0;
    if (spent > b.amount) {
      overspentAmount += (spent - b.amount);
    }
  });

  const overspentRatio = totalBudget > 0 ? overspentAmount / totalBudget : 0;
  const budgetAdherence = totalBudget > 0 ? (totalBudget - overspentAmount) / totalBudget : 1;
  const clampedAdherence = Math.max(0, Math.min(1, budgetAdherence));

  // 2. Base Score
  let scoreValue = (clampedSavingsRate * 70) + (clampedAdherence * 30);

  // 3. Smart Penalty System
  let penaltyMultiplier = 1;
  if (clampedSavingsRate > 0.4) penaltyMultiplier = 0.4;
  else if (clampedSavingsRate > 0.25) penaltyMultiplier = 0.7;

  scoreValue -= (overspentRatio * 20 * penaltyMultiplier);

  // 4. Bonus System
  if (clampedSavingsRate > 0.5) scoreValue += 5;
  if (clampedAdherence > 0.9) scoreValue += 3;

  // 5. Short explanation string
  let vitalityMessage = "Excellent balance between savings and spending";
  if (overspentRatio > 0.2) vitalityMessage = "Overspending impacting your financial health";
  else if (clampedSavingsRate > 0.35) vitalityMessage = "Savings are strong, offsetting budget overruns";

  // 6. Finalize
  const score = Math.max(0, Math.min(100, Math.round(scoreValue)));

  // 7. XAI: Score Explanation Breakdown
  const breakdown: ExplanationItem[] = [];
  
  // Savings Rate Contribution
  const savingsWeight = Math.round(clampedSavingsRate * 70);
  breakdown.push({
    label: "Savings Rate",
    value: `${(clampedSavingsRate * 100).toFixed(0)}%`,
    impact: savingsWeight,
    message: clampedSavingsRate > 0.35 ? "Strong savings performance" : (clampedSavingsRate > 0.2 ? "Moderate savings" : "Low savings rate")
  });

  // Budget Adherence Contribution
  const adherenceWeight = Math.round(clampedAdherence * 30);
  breakdown.push({
    label: "Budget Control",
    value: overspentAmount > 0 ? "Overspent" : "Within limits",
    impact: adherenceWeight,
    message: overspentAmount > 0 ? "Exceeded budget in specific categories" : "Excellent control over category budgets"
  });

  // Smart Penalty (if any)
  if (overspentRatio > 0) {
    const penalty = Math.round(overspentRatio * 20 * penaltyMultiplier);
    if (penalty > 0) {
      breakdown.push({
        label: "Overspend Penalty",
        value: `₹${overspentAmount.toFixed(0)} excess`,
        impact: -penalty,
        message: penaltyMultiplier < 1 ? "Penalty softened by high savings rate" : "Direct impact from budget overruns"
      });
    }
  }

  // Bonuses
  if (clampedSavingsRate > 0.5) {
    breakdown.push({
      label: "Savings Bonus",
      value: "High Tier",
      impact: 5,
      message: "Reward for exceptional savings discipline"
    });
  }
  if (clampedAdherence > 0.9) {
    breakdown.push({
      label: "Discipline Bonus",
      value: "Top Tier",
      impact: 3,
      message: "Consistent budget adherence reward"
    });
  }

  const scoreExplanation: ScoreExplanation = {
    breakdown,
    finalScore: score
  };

  let label = "Moderate";
  if (score >= 80) label = "Excellent";
  else if (score >= 60) label = "Good";
  else if (score < 40) label = "Poor";

  const topCategory = categoryBreakdown.length > 0 
    ? categoryBreakdown.sort((a, b) => b.value - a.value)[0].name 
    : "None";
  
  const prediction = `Projected ₹${(remainingBudget * 6).toFixed(0)} savings in 6 months`;

  // AI Summary (Low Token Usage)
  let aiSummary = "Financial health looks stable. Keep tracking your expenses to maintain balance.";
  
  try {
    const apiKey = "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";
    
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Z-Flux"
      },
      body: JSON.stringify({
        model: "openrouter/auto:free",
        messages: [
          { 
            role: "system", 
            content: "You are a financial advisor. Give: 1 short summary, 1 risk, 1 suggestion. Max 30 words." 
          },
          { 
            role: "user", 
            content: `User Data: Score: ${score}, Wallet: ₹${user.walletBalance}, Income: ₹${user.monthlyIncome}, Expenses: ₹${totalExpenses}, Remaining: ₹${remainingBudget}` 
          }
        ],
        temperature: 0.5,
        max_tokens: 60
      })
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      aiSummary = aiData.choices[0]?.message?.content || aiSummary;
    }
  } catch (error) {
    console.error("AI Financial Health Error:", error);
  }

  // Processed analytic presentation object
  return {
    walletBalance: user.walletBalance,
    monthlyIncome: user.monthlyIncome,
    totalIncomeComputed: totalIncome,
    totalExpenses,
    savings,
    categoryBreakdown,
    expenseTrend,
    recentTransactions,
    weeklySummary: {
      currentWeekExpenses,
      lastWeekExpenses,
      weeklyChange,
      topCategory: currentWeekTopCategory
    },
    financialHealth: {
      score,
      label,
      aiSummary,
      vitalityMessage,
      scoreExplanation,
      topCategory,
      prediction
    }
  };
}

export async function getFriendSharedActivity(userId: string, friendId: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return transactions.map(tx => ({
    id: tx.id,
    type: "TRANSFER" as const,
    amount: Math.abs(tx.amount),
    senderId: tx.senderId,
    receiverId: tx.receiverId,
    title: tx.senderId === userId ? "Transferred Out" : "Transferred In",
    createdAt: tx.createdAt.toISOString(),
    email: tx.senderId === userId ? "You" : "Friend" 
  }));
}
