import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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

    // 1. Get friend IDs
    const friends = await prisma.friend.findMany({
      where: { userId },
      select: { friendId: true }
    });
    const friendIds = friends.map(f => f.friendId);

    // 2. Get group member IDs (members of all groups I'm in)
    const myGroups = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true }
    });
    const groupIds = myGroups.map(g => g.groupId);

    const groupPeers = await prisma.groupMember.findMany({
      where: { groupId: { in: groupIds } },
      select: { userId: true }
    });
    const peerIds = groupPeers.map(p => p.userId);

    // Combine IDs
    const socialCircleIds = [...new Set([userId, ...friendIds, ...peerIds])];

    // 3. Fetch activities
    const activities = await prisma.activity.findMany({
      where: { userId: { in: socialCircleIds } },
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    const enrichedActivities = activities.map(a => ({
      ...a,
      userName: a.userId === userId ? "You" : a.user.email.split("@")[0]
    }));

    return NextResponse.json({ activities: enrichedActivities });
  } catch (error: any) {
    console.error("Activity Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
