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

    // Grab dynamic user context
    const analytics = await getDashboardAnalytics(decoded.userId);

    const systemPrompt = `You are Z-Flux, a minimal, concise, and professional financial AI advisor.
Keep all responses extremely short, punchy, and highly actionable (1-3 sentences max).
Focus strictly on personal finance, wealth management, and budgeting. Do not hallucinate capabilities you don't possess.

User Financial Context:
- Monthly Income: $${analytics.monthlyIncome}
- Wallet Balance: $${analytics.walletBalance}
- Total Escalate Expenses This Month: $${analytics.totalExpenses}
- Net Remaining Buffer: $${analytics.remainingBudget}

Provide highly relevant actionable advice tailored perfectly to this structural context based strictly on their prompt.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Graceful fallback for non-production structural tests
      return NextResponse.json({ 
         response: "System Notice: OPENAI_API_KEY is missing in your environment configuration. Add your key to .env to enable active AI LLM suggestions spanning your data!"
      }, { status: 200 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
       console.error("OpenAI Error:", err);
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
