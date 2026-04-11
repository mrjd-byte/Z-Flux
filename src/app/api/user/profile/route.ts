import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUniqueWalletId } from "@/lib/wallet_utils";

export async function GET(req: Request) {
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

    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallets: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const primaryWallet = user.wallets[0];

    // Sync logic: Ensure User.walletBalance matches legacy Wallet.balance if User.walletBalance is 0
    if (primaryWallet && user.walletBalance === 0 && primaryWallet.balance > 0) {
      console.log(`[DEBUG] Syncing legacy balance for user ${userId}: ${primaryWallet.balance}`);
      user = await prisma.user.update({
        where: { id: userId },
        data: { walletBalance: primaryWallet.balance },
        include: { wallets: true }
      });
    }

    // Auto-generate walletId for existing users if missing
    if (!user.walletId) {
      const newWalletId = await ensureUniqueWalletId();
      user = await prisma.user.update({
        where: { id: userId },
        data: { walletId: newWalletId },
        include: { wallets: true }
      });
    }

    const expensesAgg = await prisma.transaction.aggregate({
      where: {
        userId,
        type: { in: ["EXPENSE", "DEBIT", "TRANSFER_OUT"] }
      },
      _sum: { amount: true }
    });

    return NextResponse.json({
      email: user.email,
      income: user.monthlyIncome,
      wallet: user.walletBalance,
      walletId: user.walletId,
      expenses: expensesAgg._sum.amount || 0
    }, { status: 200 });

  } catch (error: any) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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

    if (typeof body.income !== "number") {
      return NextResponse.json({ error: "Invalid income value" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { monthlyIncome: body.income }
    });

    return NextResponse.json({
      success: true,
      income: updatedUser.monthlyIncome
    }, { status: 200 });

  } catch (error: any) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
