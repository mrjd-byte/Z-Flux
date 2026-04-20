import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Helper to authenticate
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

    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get("friendId");

    const where: any = { userId };
    if (friendId) {
      where.OR = [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId }
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Backward fix: Ensure amounts are positive
    const sanitizedTransactions = transactions.map(tx => ({
      ...tx,
      amount: Math.abs(tx.amount)
    }));

    return NextResponse.json({ transactions: sanitizedTransactions });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = authenticate(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, type, category } = await req.json();

    if (!amount || !type || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");

      const numericAmount = Math.abs(Number(amount));
      const isCredit = type === "CREDIT" || type === "INCOME" || type === "SALARY_TO_WALLET" || type === "TRANSFER_IN";

      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount: numericAmount,
          type,
          category,
          senderId: isCredit ? null : userId,
          receiverId: isCredit ? userId : null,
          description: type === "SALARY_TO_WALLET" ? "Salary Transfer to Wallet" : `User added ${category}`,
        }
      });

      // 2. Adjust Wallet Balance (ATOMIC)
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { 
          balance: isCredit 
            ? { increment: numericAmount } 
            : { decrement: numericAmount } 
        },
      });

      // 3. Keep User.walletBalance in sync (ATOMIC)
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: isCredit
            ? { increment: numericAmount }
            : { decrement: numericAmount }
        }
      });

      return { transaction, balance: updatedWallet.balance };
    });

    return NextResponse.json({ message: "Transaction added successfully", result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/transactions error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
