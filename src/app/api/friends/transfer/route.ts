import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const currentUserId = decoded.userId;
    const { friendId, amount } = await req.json();

    if (!friendId || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Find the friend
    const friendRepo = await prisma.user.findUnique({
      where: { id: friendId },
      include: { wallets: true }
    });

    if (!friendRepo) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 });
    }

    const friendWallet = friendRepo.wallets[0] || (friendRepo.walletId ? await prisma.wallet.findUnique({ where: { id: friendRepo.walletId } }) : null);
    
    // Find current user wallet
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      include: { wallets: true }
    });
    const userWallet = user?.wallets[0] || (user?.walletId ? await prisma.wallet.findUnique({ where: { id: user.walletId } }) : null);

    if (!userWallet || !friendWallet) {
      return NextResponse.json({ error: "Wallet not found for one of the participants" }, { status: 404 });
    }

    if (userWallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const absAmount = Math.abs(amount);

    await prisma.$transaction(async (tx) => {
      // 1. Deduct from user
      await tx.user.update({
        where: { id: currentUserId },
        data: { walletBalance: { decrement: absAmount } }
      });
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: absAmount } }
      });

      // 2. Add to friend
      await tx.user.update({
        where: { id: friendId },
        data: { walletBalance: { increment: absAmount } }
      });
      await tx.wallet.update({
        where: { id: friendWallet.id },
        data: { balance: { increment: absAmount } }
      });

      // 3. Create transaction records
      // Sender record
      await tx.transaction.create({
        data: {
          userId: currentUserId,
          walletId: userWallet.id,
          amount: absAmount,
          type: "TRANSFER",
          category: "TRANSFER",
          subtype: "FRIEND_TRANSFER",
          senderId: currentUserId,
          receiverId: friendId,
          description: `Sent to ${friendRepo.email.split('@')[0]}`,
          toWalletId: friendWallet.id
        }
      });

      // Receiver record
      await tx.transaction.create({
        data: {
          userId: friendId,
          walletId: friendWallet.id,
          amount: absAmount,
          type: "TRANSFER",
          category: "TRANSFER",
          subtype: "FRIEND_TRANSFER",
          senderId: currentUserId,
          receiverId: friendId,
          description: `Received from ${user?.email.split('@')[0]}`,
          fromWalletId: userWallet.id
        }
      });
      
      // 4. Log activity
      await tx.activity.create({
        data: {
          userId: currentUserId,
          type: "TRANSFER",
          message: `Transferred ₹${absAmount} to ${friendRepo.email.split('@')[0]}`
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
