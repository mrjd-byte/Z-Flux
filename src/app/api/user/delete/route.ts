import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
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

    // Use a transaction to ensure all-or-nothing deletion
    await prisma.$transaction(async (tx) => {
      // 1. Delete manual relations that don't have schema-level cascade deletes for User
      await tx.groupMember.deleteMany({
        where: { userId: userId }
      });

      await tx.groupContribution.deleteMany({
        where: { userId: userId }
      });

      await tx.groupExpense.deleteMany({
        where: { createdBy: userId }
      });

      // 2. Delete the user (this will trigger cascade deletes for:
      // Wallets, Transactions, Budgets, ChatSessions, FriendRequests, Friends, Notifications, Activities)
      await tx.user.delete({
        where: { id: userId }
      });
    });

    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Account Deletion Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
