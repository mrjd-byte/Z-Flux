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

    const { visible } = await req.json();

    if (typeof visible !== "boolean") {
      return NextResponse.json({ error: "Invalid data type" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { socialScoreVisible: visible },
      select: { socialScoreVisible: true }
    });

    return NextResponse.json({ 
      message: visible ? "Score is now visible to friends" : "Score is now hidden from friends",
      socialScoreVisible: user.socialScoreVisible 
    });

  } catch (error: any) {
    console.error("Visibility Toggle Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
