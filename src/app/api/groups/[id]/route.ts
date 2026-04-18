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

    // Verify membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: decoded.userId }
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        contributions: true,
        expenses: true
      }
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Fetch user emails
    const userIds = [...new Set([
      ...group.members.map(m => m.userId),
      ...group.contributions.map(c => c.userId),
      ...group.expenses.map(e => e.createdBy)
    ])];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true }
    });

    const userMap = users.reduce((acc: any, user) => {
      acc[user.id] = user.email;
      return acc;
    }, {});

    const totalContributions = group.contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalExpenses = group.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPool = totalContributions - totalExpenses;

    // 🔥 ADD 1: SETTLEMENT LOGIC
    const memberIds = group.members.map(m => m.userId);
    const equalShare = memberIds.length > 0 ? totalExpenses / memberIds.length : 0;

    const contributionMap: Record<string, number> = {};
    group.contributions.forEach(c => {
      contributionMap[c.userId] = (contributionMap[c.userId] || 0) + c.amount;
    });

    const settlements = memberIds.map(userId => {
      const paid = contributionMap[userId] || 0;
      const owes = equalShare - paid;

      return {
        userId,
        email: userMap[userId],
        paid,
        owes: Math.round(owes)
      };
    });

    // 🔥 ADD 2: ACTIVITY FEED
    const activity = [
      ...group.contributions.map(c => ({
        type: "CONTRIBUTION",
        userId: c.userId,
        email: userMap[c.userId],
        amount: c.amount,
        createdAt: c.createdAt
      })),
      ...group.expenses.map(e => ({
        type: "EXPENSE",
        userId: e.createdBy,
        email: userMap[e.createdBy],
        amount: e.amount,
        title: e.title,
        createdAt: e.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Existing structure + safe additions
    const enrichedGroup = {
      ...group,
      totalPool,

      // 🔥 NEW FIELDS (safe additions)
      settlements,
      activity,

      members: group.members.map(m => ({ ...m, email: userMap[m.userId] })),
      contributions: group.contributions.map(c => ({ ...c, email: userMap[c.userId] })),
      expenses: group.expenses.map(e => ({ ...e, email: userMap[e.createdBy] }))
    };

    return NextResponse.json(enrichedGroup);

  } catch (error: any) {
    console.error("Group Detail Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}