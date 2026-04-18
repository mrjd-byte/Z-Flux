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

    const { groupId, title, amount } = await req.json();

    if (!groupId || !title || !amount || amount <= 0) {
      return NextResponse.json({ error: "Group ID, Title, and valid Amount are required" }, { status: 400 });
    }

    // Verify membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: decoded.userId }
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    const expense = await prisma.groupExpense.create({
      data: {
        groupId,
        title,
        amount: parseFloat(amount),
        createdBy: decoded.userId
      }
    });

    // Notify other members
    const group = await prisma.group.findUnique({ 
      where: { id: groupId }, 
      select: { name: true, members: { select: { userId: true } } } 
    });
    const purchaser = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { email: true } });
    
    if (group) {
      const otherMembers = group.members.filter(m => m.userId !== decoded.userId);
      await prisma.notification.createMany({
        data: otherMembers.map(m => ({
          userId: m.userId,
          type: "EXPENSE",
          message: `${purchaser?.email.split("@")[0]} spent ₹${amount} for "${title}" in "${group.name}".`
        }))
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: decoded.userId,
        type: "EXPENSE",
        message: `You spent ₹${amount} for "${title}" in "${group?.name}"`
      }
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error("Group Expense Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
