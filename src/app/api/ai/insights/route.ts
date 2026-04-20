import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDashboardAnalytics, InsightExplanation } from "@/lib/services/analytics";

type InsightType = "danger" | "warning" | "good";
type StructuredInsight = { 
  message: string; 
  type: InsightType;
  explanation?: InsightExplanation;
};

function getInsightExplanation(prev: number, current: number): InsightExplanation {
  const change = prev > 0 ? ((current - prev) / prev) * 100 : 0;
  return {
    trigger: "Weekly Trend Analysis",
    previous: `₹${prev.toFixed(2)}`,
    current: `₹${current.toFixed(2)}`,
    change: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
    reason: Math.abs(change) > 15 ? "Significant variation detected" : "Normal weekly variation"
  };
}

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

    const analytics = await getDashboardAnalytics(decoded.userId);
    const rawSignals: StructuredInsight[] = [];

    // Rule 1: Expense to Income Ratio
    if (analytics.monthlyIncome > 0) {
      if (analytics.totalExpenses > analytics.monthlyIncome) {
        rawSignals.push({ message: `You are overspending by ₹${(analytics.totalExpenses - analytics.monthlyIncome).toFixed(2)} compared to your income.`, type: "danger" });
      } else if (analytics.totalExpenses > analytics.monthlyIncome * 0.8) {
        rawSignals.push({ message: `You have spent over 80% of your monthly income. Be careful.`, type: "warning" });
      } else if (analytics.totalExpenses < analytics.monthlyIncome * 0.5) {
        rawSignals.push({ message: `You're saving well this month, spending is less than 50% of your income.`, type: "good" });
      }
    }

    // Rule 2: Safe Daily Spend
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const remainingDays = endOfMonth.getDate() - now.getDate() + 1;
    if (analytics.savings > 0 && remainingDays > 0) {
      const dailySafe = analytics.savings / remainingDays;
      rawSignals.push({ message: `Your safe daily allocation to wallet is ₹${dailySafe.toFixed(2)} for the remaining ${remainingDays} days.`, type: "good" });
    }

    // Rule 3: High Category Check
    if (analytics.categoryBreakdown.length > 0) {
      const topCategory = [...analytics.categoryBreakdown].sort((a, b) => b.value - a.value)[0];
      if (topCategory.value > analytics.monthlyIncome * 0.4) {
         rawSignals.push({ message: `Your spending on ${topCategory.name} is unusually high at ₹${topCategory.value.toFixed(2)}.`, type: "warning" });
      }
    }

    // 🔥 NEW: Weekly Trend Signals
    if (analytics.weeklySummary) {
      const { currentWeekExpenses, lastWeekExpenses, weeklyChange, topCategory } = analytics.weeklySummary;
      if (weeklyChange > 10) {
        rawSignals.push({ 
          message: `Spending increased by ${weeklyChange.toFixed(0)}% this week compared to last.`, 
          type: "danger",
          explanation: getInsightExplanation(lastWeekExpenses, currentWeekExpenses)
        });
      } else if (weeklyChange < -10) {
        rawSignals.push({ 
          message: `Great job! You spent ${(Math.abs(weeklyChange)).toFixed(0)}% less this week.`, 
          type: "good",
          explanation: getInsightExplanation(lastWeekExpenses, currentWeekExpenses)
        });
      }
      rawSignals.push({ message: `Your top expense this week is ${topCategory} (₹${currentWeekExpenses.toFixed(2)}).`, type: "warning" });
    }

    const apiKey = "";
    
    if (!apiKey) {
      return NextResponse.json({ insights: rawSignals.slice(0, 3) }, { status: 200 });
    }

    const systemPrompt = `Convert these financial signals into 2-3 short, sharp, highly actionable insights. Use numbers. Be direct.
Return EXCLUSIVELY a JSON array responding exactly to this structure:
[
  { "message": "short insight text", "type": "danger|warning|good" }
]
CRITICAL: If the input signal has an "explanation" field, you MUST preserve it exactly in your output for that specific insight.
Do not return any markdown tags or wrapper strings.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Z-Flux"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(rawSignals) }
        ],
        temperature: 0.3,
      })
    });

    if (!response.ok) {
       console.error("LLM Error:", await response.text());
       return NextResponse.json({ insights: rawSignals.slice(0, 3) }, { status: 200 });
    }

    const data = await response.json();
    let aiInsights = rawSignals.slice(0, 3);
    
    try {
      const reply = data.choices[0]?.message?.content || "";
      aiInsights = JSON.parse(reply.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      console.error("Failed to parse AI JSON:", e);
    }

    return NextResponse.json({ insights: aiInsights.slice(0, 3) }, { status: 200 });

  } catch (error: any) {
    console.error("AI Insights API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
