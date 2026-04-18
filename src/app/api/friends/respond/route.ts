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

    const { requestId, status } = await req.json(); // status: "ACCEPTED" or "REJECTED"

    if (!requestId || !["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    });

    if (!friendRequest || friendRequest.receiverId !== decoded.userId) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (friendRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request is already processed" }, { status: 400 });
    }

    if (status === "REJECTED") {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });
      return NextResponse.json({ message: "Request rejected" });
    }

    // ACCEPTED: Create mutual friendship entries
    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" }
      }),
      prisma.friend.create({
        data: {
          userId: friendRequest.senderId,
          friendId: friendRequest.receiverId
        }
      }),
      prisma.friend.create({
        data: {
          userId: friendRequest.receiverId,
          friendId: friendRequest.senderId
        }
      })
    ]);

    // Log activities
    const sender = await prisma.user.findUnique({ where: { id: friendRequest.senderId }, select: { email: true } });
    const receiver = await prisma.user.findUnique({ where: { id: friendRequest.receiverId }, select: { email: true } });

    await prisma.activity.createMany({
      data: [
        {
          userId: friendRequest.senderId,
          type: "FRIEND_ADDED",
          message: `You and ${receiver?.email.split("@")[0]} are now friends!`
        },
        {
          userId: friendRequest.receiverId,
          type: "FRIEND_ADDED",
          message: `You and ${sender?.email.split("@")[0]} are now friends!`
        }
      ]
    });

    return NextResponse.json({ message: "Friend request accepted" });
  } catch (error: any) {
    console.error("Friend Respond Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
