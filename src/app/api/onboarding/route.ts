import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await req.json();
    const { monthlyIncome, budgets, generateSampleData } = body;

    // Run within a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update user
      await tx.user.update({
        where: { id: userId },
        data: {
          monthlyIncome: Number(monthlyIncome),
          isOnboarded: true,
        },
      });

      // 2. Clear existing budgets and set new ones
      await tx.budget.deleteMany({ where: { userId } });
      
      const budgetPromises = budgets.map((b: { category: string, amount: number }) => {
        return tx.budget.create({
          data: {
            userId,
            category: b.category,
            amount: Number(b.amount),
          }
        });
      });
      await Promise.all(budgetPromises);

      // 3. Handle sample data generation
      if (generateSampleData) {
        // Fetch wallet
        const wallet = await tx.wallet.findFirst({ where: { userId } });
        if (wallet) {
          // Categories for generating realistic data
          const categories = ["Food", "Travel", "Shopping", "Bills"];
          let totalSpent = 0;
          
          const sampleTransactions = Array.from({ length: 12 }).map((_, i) => {
            const amount = Math.floor(Math.random() * 50) + 10; // 10 to 60
            const type = "EXPENSE";
            const category = categories[Math.floor(Math.random() * categories.length)];
            totalSpent += amount;
            
            return {
              userId,
              walletId: wallet.id,
              amount,
              type,
              description: `Sample ${category} Expense`,
            };
          });

          await tx.transaction.createMany({
            data: sampleTransactions
          });

          // Also add an income transaction
          const incomeAmount = monthlyIncome || 2000;
          await tx.transaction.create({
            data: {
              userId,
              walletId: wallet.id,
              amount: incomeAmount,
              type: "INCOME",
              description: "Initial Balance (Sample Data)"
            }
          });

          // Update Wallet Balance (ATOMIC)
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: incomeAmount - totalSpent } }
          });
        }
      }
    });

    return NextResponse.json({ message: "Onboarding successful" }, { status: 200 });
  } catch (error: any) {
    console.error("Onboarding logic error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
