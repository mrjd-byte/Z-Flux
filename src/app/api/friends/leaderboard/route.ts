import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
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

    // 🔥 TASK 2: FIX SOCIAL LEADERBOARD (SHOW ALL FRIENDS)
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { userId },
          { friendId: userId }
        ]
      }
    });

    // Extract unique friend IDs
    const friendIds = friendships.map(f => 
       f.userId === userId ? f.friendId : f.userId
    );

    // Include current user and fetch unique user profiles
    const allIds = [...new Set([...friendIds, userId])];
    
    const candidates = await prisma.user.findMany({
      where: { 
        id: { in: allIds },
        socialScoreVisible: true // respect privacy except for self
      },
      select: { id: true, email: true, socialScoreVisible: true }
    });

    // Ensure current user is always included regardless of visiblity toggle (for themselves)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, socialScoreVisible: true }
    });

    const uniqueCandidates = Array.from(new Map([...candidates, currentUser!].map(u => [u.id, u])).values());

    const leaderboardItems = await Promise.all(
      uniqueCandidates.map(async (u) => {
        try {
          const analytics = await getDashboardAnalytics(u.id);
          return {
            name: u.email.split("@")[0],
            email: u.email,
            score: analytics.financialHealth.score,
            isCurrentUser: u.id === userId
          };
        } catch (err) {
          // If a friend's analytics fail (e.g. no wallet), return a 0 score
          return {
            name: u.email.split("@")[0],
            email: u.email,
            score: 0,
            isCurrentUser: u.id === userId
          };
        }
      })
    );

    // Sort by score DESC
    leaderboardItems.sort((a, b) => b.score - a.score);

    // Add rank
    const rankedData = leaderboardItems.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    return NextResponse.json(rankedData);
  } catch (error: any) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
