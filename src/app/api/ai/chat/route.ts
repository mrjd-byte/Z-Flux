import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/services/analytics";

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

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const analytics = await getDashboardAnalytics(decoded.userId);

    const budgetsRes = await fetch(`http://localhost:3000/api/budget`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const budgetsData = await budgetsRes.json();
    const budgets = budgetsData.budgets || [];

    const systemPrompt = `You are Z-Flux, an intelligent personal finance advisor.

Your job is to answer the user's question DIRECTLY using their real financial data.

STRICT RULES:
- Always respond to the exact question asked (do NOT ignore it)
- Use the user's financial numbers to justify your answer
- Be concise (2–4 sentences max)
- Be practical, not generic
- If the user asks about a category (like shopping, food, travel), focus ONLY on that category
- If the user asks "can I afford X", give a clear YES/NO with reasoning
- If risky, suggest a safer alternative or adjustment

User Financial Context:
- Monthly Income: $${analytics.monthlyIncome}
- Wallet Balance: $${analytics.walletBalance}
- Total Expenses This Month: $${analytics.totalExpenses}
- Remaining Budget: $${analytics.remainingBudget}

Category Budgets:
${budgets.map((b: any) => `
${b.category}:
- Limit: $${b.limit}
- Spent: $${b.spent}
- Remaining: $${b.remaining}
- Usage: ${b.percentage}%
`).join("")}


If category remaining < 0 → clearly say it's over budget and by how much.
Respond like a sharp fintech advisor, not a textbook.`;



    const apiKey = "";
    console.log("API KEY:", apiKey);

    if (!apiKey) {
      return NextResponse.json({
        response: "System Notice: OPENAI_API_KEY is missing in your environment configuration. Add your key to .env to enable active AI LLM suggestions spanning your data!"
      }, { status: 200 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",   // ✅ REQUIRED
        "X-Title": "Z-Flux"                        // ✅ REQUIRED
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",              // ✅ FIXED
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter Error:", err);
      return NextResponse.json({ error: "Failed to fetch from LLM API" }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "I'm having trouble analyzing that right now.";

    return NextResponse.json({ response: reply }, { status: 200 });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
