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

    const systemPrompt = `You are a strict financial advisor.
Give short, actionable advice using real numbers.
Avoid generic suggestions. Max 2 sentences.

User Financial Context:
- Monthly Income: $${analytics.monthlyIncome}
- Wallet Balance: $${analytics.walletBalance}
- Total Expenses This Month: $${analytics.totalExpenses}
- Net Remaining Buffer: $${analytics.remainingBudget}

Provide highly relevant actionable advice tailored perfectly to this structural context based strictly on their prompt.`;

    const apiKey = "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";
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