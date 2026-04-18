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

    const { groupId, amount } = await req.json();

    if (!groupId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Group ID and valid Amount are required" }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: decoded.userId }
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    // 🔥 TASK 3: CONNECT GROUP CONTRIBUTIONS TO WALLET + TRANSACTIONS
    const contributionResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch wallet explicitly
      const wallet = await tx.wallet.findFirst({ where: { userId: decoded.userId } });
      if (!wallet) throw new Error("Wallet not found");
      if (wallet.balance < parseFloat(amount)) throw new Error("Insufficient balance in wallet");

      // 2. Deduct from User & Wallet
      await tx.user.update({
        where: { id: decoded.userId },
        data: { walletBalance: { decrement: parseFloat(amount) } }
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: parseFloat(amount) } }
      });

      // 3. Create Group Contribution
      const contrib = await tx.groupContribution.create({
        data: {
          groupId,
          userId: decoded.userId,
          amount: parseFloat(amount)
        }
      });

      // 4. Create Transaction Record
      await tx.transaction.create({
        data: {
          userId: decoded.userId,
          walletId: wallet.id,
          amount: parseFloat(amount),
          type: "GROUP_CONTRIBUTION",
          category: "Group",
          description: `Added contribution to group`
        }
      });

      return contrib;
    });

    const contribution = contributionResult;

    // Notify other members
    const group = await prisma.group.findUnique({ 
      where: { id: groupId }, 
      select: { name: true, members: { select: { userId: true } } } 
    });
    const donor = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { email: true } });
    
    if (group) {
      const otherMembers = group.members.filter(m => m.userId !== decoded.userId);
      await prisma.notification.createMany({
        data: otherMembers.map(m => ({
          userId: m.userId,
          type: "CONTRIBUTION",
          message: `${donor?.email.split("@")[0]} contributed ₹${amount} to "${group.name}".`
        }))
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: decoded.userId,
        type: "CONTRIBUTION",
        message: `You added ₹${amount} to "${group?.name}"`
      }
    });

    return NextResponse.json(contribution, { status: 201 });
  } catch (error: any) {
    console.error("Group Contribution Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
