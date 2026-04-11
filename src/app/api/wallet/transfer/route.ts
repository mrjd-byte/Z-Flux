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

    const senderId = decoded.userId;
    const body = await req.json();
    const receiverWalletId = body.walletId;
    const amount = Number(body.amount);

    console.log(`[DEBUG] Transfer Attempt: SenderID=${senderId}, ReceiverWalletID=${receiverWalletId}, Amount=${amount}`);

    // 1. Basic Validation
    if (!receiverWalletId || isNaN(amount) || amount <= 0) {
      console.log(`[DEBUG] Validation failed: amount=${amount}, receiverWalletId=${receiverWalletId}`);
      return NextResponse.json({ error: "Invalid wallet ID or amount" }, { status: 400 });
    }

    // 2. Fetch Sender
    const sender = await prisma.user.findUnique({
      where: { id: senderId }
    });

    if (!sender) {
      console.log(`[DEBUG] Sender not found: ${senderId}`);
      return NextResponse.json({ error: "Sender wallet not found" }, { status: 404 });
    }

    // 3. Fetch Receiver
    const receiver = await prisma.user.findUnique({
      where: { walletId: receiverWalletId }
    });

    if (!receiver) {
      console.log(`[DEBUG] Receiver not found: ${receiverWalletId}`);
      return NextResponse.json({ error: "Receiver wallet not found" }, { status: 404 });
    }

    if (sender.walletId === receiverWalletId) {
      return NextResponse.json({ error: "Cannot send to your own wallet" }, { status: 400 });
    }

    // 4. Fetch wallets explicitly (FIXED)
    const senderWallet = await prisma.wallet.findFirst({
      where: { userId: sender.id }
    });

    const receiverWallet = await prisma.wallet.findFirst({
      where: { userId: receiver.id }
    });

    if (!senderWallet) {
      return NextResponse.json({ error: "Sender wallet not found" }, { status: 404 });
    }

    if (!receiverWallet) {
      return NextResponse.json({ error: "Receiver wallet not found" }, { status: 404 });
    }

    console.log(`[DEBUG] Sender Balance: ${senderWallet.balance}`);

    if (senderWallet.balance < amount) {
      console.log(`[DEBUG] Insufficient balance: Required=${amount}, Available=${senderWallet.balance}`);
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // 5. Atomic Transaction
    await prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.user.update({
        where: { id: sender.id },
        data: { walletBalance: { decrement: amount } }
      });

      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amount } }
      });

      // Add to receiver
      await tx.user.update({
        where: { id: receiver.id },
        data: { walletBalance: { increment: amount } }
      });

      await tx.wallet.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: amount } }
      });

      // Sender transaction
      await tx.transaction.create({
        data: {
          userId: sender.id,
          amount,
          type: "TRANSFER_OUT",
          description: `Transfer to ${receiverWalletId}`,
          category: "Transfer",
          toWalletId: receiverWalletId,
          walletId: senderWallet.id
        }
      });

      // Receiver transaction
      await tx.transaction.create({
        data: {
          userId: receiver.id,
          amount,
          type: "TRANSFER_IN",
          description: `Transfer from ${sender.walletId}`,
          category: "Transfer",
          fromWalletId: sender.walletId,
          walletId: receiverWallet.id
        }
      });
    });

    console.log(`[DEBUG] Transfer Successful: ${amount} from ${sender.walletId} to ${receiverWalletId}`);

    return NextResponse.json({ success: true, message: "Transfer successful" }, { status: 200 });

  } catch (error: any) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}