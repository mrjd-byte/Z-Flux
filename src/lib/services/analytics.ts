import { prisma } from "@/lib/prisma";

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

  // Fetch all transactions to process aggregations
  const allTransactions = await prisma.transaction.findMany({
    where: { userId },
  });

  let totalExpenses = 0;
  let totalIncome = 0; 
  let totalSalaryTransferred = 0;
  
  const categoryMap: Record<string, number> = {};
  const trendMap: Record<string, number> = {};

  for (const tx of allTransactions) {
    const isExpense = tx.type === "DEBIT" || tx.type === "EXPENSE" || tx.type === "TRANSFER_OUT";
    const isIncome = tx.type === "CREDIT" || tx.type === "INCOME" || tx.type === "TRANSFER_IN" || tx.type === "SALARY_TO_WALLET";

    if (tx.type === "SALARY_TO_WALLET") {
      totalSalaryTransferred += tx.amount;
    }

    if (isExpense) {
      totalExpenses += tx.amount;

      // Group by category for pie chart
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

  // Compute Financial Health Score (pure JS)
  const savingsRate = user.monthlyIncome > 0 ? (remainingBudget / user.monthlyIncome) : 0;
  const balanceWeight = Math.min(user.walletBalance / (user.monthlyIncome || 1), 1);
  const rawScore = (savingsRate * 70) + (balanceWeight * 30);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

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
    financialHealth: {
      score,
      label,
      aiSummary,
      topCategory,
      prediction
    }
  };
}
