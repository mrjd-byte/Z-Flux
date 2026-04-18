import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: groupId } = await params;
    const userId = decoded.userId;

    // Fetch group details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        contributions: true,
        expenses: true
      }
    });

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const memberCount = group.members.length;
    if (memberCount === 0) return NextResponse.json({ mySummary: { type: "neutral", amount: 0 }, settlements: [] });

    // 1. Calculate Total Spent
    const totalSpent = group.expenses.reduce((sum, e) => sum + e.amount, 0);
    const sharePerPerson = totalSpent / memberCount;

    // 2. Calculate individual contributions
    const contributionsByUser: Record<string, number> = {};
    group.contributions.forEach(c => {
      contributionsByUser[c.userId] = (contributionsByUser[c.userId] || 0) + c.amount;
    });

    // 3. Fetch user names
    const users = await prisma.user.findMany({
      where: { id: { in: group.members.map(m => m.userId) } },
      select: { id: true, email: true }
    });
    const userMap = users.reduce((acc, u) => {
      acc[u.id] = u.email.split("@")[0];
      return acc;
    }, {} as Record<string, string>);

    // 4. Calculate Net Balances
    const balances = group.members.map(m => ({
      userId: m.userId,
      name: m.userId === userId ? "You" : userMap[m.userId],
      balance: (contributionsByUser[m.userId] || 0) - sharePerPerson
    }));

    // 5. Debt Simplification Algorithm (Greedy)
    const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b }));
    const creditors = balances.filter(b => b.balance > 0.01).map(b => ({ ...b }));

    // Sort to settle largest debts first
    debtors.sort((a, b) => a.balance - b.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const settlements: { from: string; to: string; amount: number }[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      if (amount > 0.01) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Number(amount.toFixed(2))
        });
      }

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) dIdx++;
      if (Math.abs(creditor.balance) < 0.01) cIdx++;
    }

    // 6. My Summary
    const myBalance = (contributionsByUser[userId] || 0) - sharePerPerson;
    const mySummary = {
        type: Math.abs(myBalance) < 0.01 ? "neutral" : myBalance > 0 ? "creditor" : "debtor",
        amount: Math.abs(Number(myBalance.toFixed(2)))
    };

    return NextResponse.json({ mySummary, settlements });

  } catch (error: any) {
    console.error("Settlement API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
