import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardAnalytics } from "@/lib/services/analytics";

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

    const dashboardData = await getDashboardAnalytics(userId);

    // Social Milestone Logging: If score is Excellent, log to activity feed (only once per day)
    const { score } = dashboardData.financialHealth;
    if (score >= 80) {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const existingActivity = await prisma.activity.findFirst({
        where: {
          userId,
          type: "SCORE_UPDATE",
          createdAt: { gte: today }
        }
      });

      if (!existingActivity) {
        await prisma.activity.create({
          data: {
            userId,
            type: "SCORE_UPDATE",
            message: `Achievement Unlocked: Reached an Excellent Financial Health Score of ${score}!`
          }
        });
      }
    }

    return NextResponse.json(dashboardData, { status: 200 });

  } catch (error: any) {
    if (error.message === "Data not found") {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
