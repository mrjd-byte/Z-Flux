import { prisma } from "@/lib/prisma";

export async function generateInsights(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const budgets = await prisma.budget.findMany({ where: { userId } });

  // Current month bounds
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
      type: { in: ["EXPENSE", "DEBIT"] }
    }
  });

  const spentMap: Record<string, number> = {};
  let totalExpenses = 0;

  for (const tx of transactions) {
    const cat = tx.category || "General";
    spentMap[cat] = (spentMap[cat] || 0) + tx.amount;
    totalExpenses += tx.amount;
  }

  const insights: string[] = [];

  // Rules Engine
  for (const budget of budgets) {
    const spent = spentMap[budget.category] || 0;
    const limit = budget.amount;

    if (limit <= 0) continue;

    const percentage = spent / limit;

    if (percentage > 1) {
      insights.push(
        `🚨 Overspent: You have exceeded your ${budget.category} budget by ₹${(spent - limit).toFixed(2)}.`
      );
    } else if (percentage > 0.8) {
      insights.push(
        `⚠️ Warning: You have used ${(percentage * 100).toFixed(0)}% of your ${budget.category} budget.`
      );
    }
  }

  // Savings Low Engine
  const savings = user.monthlyIncome - totalExpenses;
  const savingsTarget = user.monthlyIncome * 0.2; // 20% safe generic target
  
  if (user.monthlyIncome > 0) {
    if (savings < savingsTarget) {
      insights.push(
        `💡 Tip: Your savings for this month are falling below 20% of your income. Evaluate non-essential purchases.`
      );
    }
    
    if (savings < 0) {
       insights.push(
        `🛑 Alert: You are operating at a net loss this month. You have spent ₹${Math.abs(savings).toFixed(2)} more than your income.`
       );
    }
  }

  // Baseline standard
  if (insights.length === 0) {
    insights.push(`✅ Great job! Your spending is well within balanced limits this month.`);
  }

  return insights;
}
