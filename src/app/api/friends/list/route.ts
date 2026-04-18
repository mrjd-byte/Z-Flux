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

    // Fetch friends
    const friends = await prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            email: true,
            createdAt: true
          }
        }
      }
    });

    // Fetch pending incoming requests
    const pendingIncoming = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "PENDING"
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    // Fetch sent requests
    const sentRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: userId
      },
      include: {
        receiver: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      friends: friends.map(f => ({
        id: f.id,
        friendId: f.friend.id,
        email: f.friend.email,
        since: f.createdAt
      })),
      pendingIncoming: pendingIncoming.map(r => ({
        id: r.id,
        senderId: r.sender.id,
        email: r.sender.email,
        at: r.createdAt
      })),
      sentRequests: sentRequests.map(r => ({
        id: r.id,
        receiverId: r.receiver.id,
        email: r.receiver.email,
        status: r.status,
        at: r.createdAt
      }))
    });
  } catch (error: any) {
    console.error("Friends List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
