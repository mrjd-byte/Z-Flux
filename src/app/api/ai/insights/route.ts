import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { generateInsights } from "@/lib/services/insights";

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

    const insights = await generateInsights(decoded.userId);

    return NextResponse.json({ insights }, { status: 200 });

  } catch (error: any) {
    console.error("AI Insights API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
