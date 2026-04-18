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

    const memberships = await prisma.groupMember.findMany({
      where: { userId: decoded.userId },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true }
            }
          }
        }
      }
    });

    const groups = memberships.map(m => ({
      ...m.group,
      memberCount: m.group._count.members
    }));

    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error("Group List Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
