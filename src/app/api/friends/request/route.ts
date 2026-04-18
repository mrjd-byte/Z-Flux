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

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({
      where: { email }
    });

    if (!receiver) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (receiver.id === decoded.userId) {
      return NextResponse.json({ error: "You cannot send a request to yourself" }, { status: 400 });
    }

    // Check if they are already friends
    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: decoded.userId,
          friendId: receiver.id
        }
      }
    });

    if (existingFriend) {
      return NextResponse.json({ error: "You are already friends" }, { status: 400 });
    }

    // Check for existing pending request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId: decoded.userId,
        receiverId: receiver.id,
        status: "PENDING"
      }
    });

    if (existingRequest) {
      return NextResponse.json({ error: "Request already sent" }, { status: 400 });
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: decoded.userId,
        receiverId: receiver.id,
        status: "PENDING"
      }
    });

    // Notify receiver
    const sender = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { email: true } });
    await prisma.notification.create({
      data: {
        userId: receiver.id,
        type: "FRIEND_REQUEST",
        message: `${sender?.email.split("@")[0]} sent you a friend request.`
      }
    });

    return NextResponse.json(friendRequest, { status: 201 });
  } catch (error: any) {
    console.error("Friend Request Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
