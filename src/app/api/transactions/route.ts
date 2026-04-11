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

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ transactions });
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

      const numericAmount = Number(amount);
      const isCredit = type === "CREDIT" || type === "INCOME";

      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount: numericAmount,
          type,
          category,
          description: `User added ${category}`,
        }
      });

      // 2. Adjust Wallet Balance
      const newBalance = isCredit 
        ? wallet.balance + numericAmount 
        : wallet.balance - numericAmount;

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      return { transaction, balance: updatedWallet.balance };
    });

    return NextResponse.json({ message: "Transaction added successfully", result }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/transactions error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
