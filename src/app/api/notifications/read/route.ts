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

    const { notificationId } = await req.json();

    if (notificationId) {
      // Mark specific as read
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: decoded.userId },
        data: { read: true }
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: decoded.userId, read: false },
        data: { read: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notifications Read Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
