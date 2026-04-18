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

    const { groupId, email } = await req.json();

    if (!groupId || !email) {
      return NextResponse.json({ error: "Group ID and Email are required" }, { status: 400 });
    }

    // Verify current user is a member of the group
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: decoded.userId }
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    // Find the user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔥 TASK 1: RESTRICT GROUP INVITES TO FRIENDS ONLY
    const isFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: decoded.userId, friendId: userToAdd.id },
          { userId: userToAdd.id, friendId: decoded.userId }
        ]
      }
    });

    if (!isFriend) {
      return NextResponse.json({ error: "User is not your friend. Only friends can be invited to groups." }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await prisma.groupMember.findFirst({
      where: { groupId, userId: userToAdd.id }
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    const newMember = await prisma.groupMember.create({
      data: {
        groupId,
        userId: userToAdd.id
      }
    });

    // Notify user they were added to a group
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: userToAdd.id,
        type: "GROUP_INVITE",
        message: `You were added to the group "${group?.name}".`
      }
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    console.error("Group Add Member Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
