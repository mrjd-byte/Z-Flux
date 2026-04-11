import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as { userId: string } | null;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId: decoded.userId },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ sessions }, { status: 200 });

  } catch (error: any) {
    console.error("Chat Session GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as { userId: string } | null;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const defaultMessages = [
      { role: "ai", content: "Hi! I'm your Z-Flux AI Advisor. How can I help you manage your finances today?" }
    ];

    const session = await prisma.chatSession.create({
      data: {
        userId: decoded.userId,
        title: "New Chat",
        messages: defaultMessages
      }
    });

    return NextResponse.json({ session }, { status: 201 });

  } catch (error: any) {
    console.error("Chat Session POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
