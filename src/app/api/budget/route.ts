import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const decoded: any = verifyToken(token);
  return decoded?.userId || null;
}

export async function GET(req: Request) {
  try {
    const userId = authenticate(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const budgets = await prisma.budget.findMany({
      where: { userId }
    });

    // Time math
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = endOfMonth.getDate() - now.getDate();
    const safeDaysLeft = daysLeft > 0 ? daysLeft : 1;

    // Fetch this month's transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        type: { in: ["EXPENSE", "DEBIT"] }
      }
    });

    const spentMap: Record<string, number> = {};
    for (const tx of transactions) {
      const cat = tx.category || "General";
      spentMap[cat] = (spentMap[cat] || 0) + tx.amount;
    }

    const payload = budgets.map(b => {
      const spent = spentMap[b.category] || 0;
      const remaining = b.amount - spent;
      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const dailyAllowance = remaining > 0 ? remaining / safeDaysLeft : 0;

      return {
        id: b.id,
        category: b.category,
        limit: b.amount,
        spent,
        remaining,
        percentage: Number(percentage.toFixed(1)),
        dailyAllowance: Number(dailyAllowance.toFixed(2))
      };
    });

    return NextResponse.json({ budgets: payload, daysLeft }, { status: 200 });
  } catch (error) {
    console.error("GET /api/budget error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = authenticate(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { category, amount } = await req.json();

    if (!category || amount === undefined) {
      return NextResponse.json({ error: "Missing category or amount" }, { status: 400 });
    }

    const numAmount = Number(amount);

    const existingBudget = await prisma.budget.findFirst({
      where: { userId, category }
    });

    let budget;
    if (existingBudget) {
      budget = await prisma.budget.update({
        where: { id: existingBudget.id },
        data: { amount: numAmount }
      });
    } else {
      budget = await prisma.budget.create({
        data: {
          userId,
          category,
          amount: numAmount
        }
      });
    }

    return NextResponse.json({ message: "Budget saved", budget }, { status: 201 });
  } catch (error) {
    console.error("POST /api/budget error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
