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
  // Calculate total income (using the actual transactions vs just user monthly income)
  let totalIncome = 0; 
  
  const categoryMap: Record<string, number> = {};
  const trendMap: Record<string, number> = {};

  for (const tx of allTransactions) {
    const isExpense = tx.type === "DEBIT" || tx.type === "EXPENSE";
    const isIncome = tx.type === "CREDIT" || tx.type === "INCOME";

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

  const remainingBudget = user.monthlyIncome - totalExpenses;

  // Processed analytic presentation object
  return {
    walletBalance: user.walletBalance,
    monthlyIncome: user.monthlyIncome,
    totalIncomeComputed: totalIncome,
    totalExpenses,
    remainingBudget,
    categoryBreakdown,
    expenseTrend,
    recentTransactions,
  };
}
