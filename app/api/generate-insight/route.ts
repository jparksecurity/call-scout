import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { 
  InsightRequest, 
  Insight, 
  OpenAIResponse, 
  APIResponse 
} from "@/lib/types";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FINANCIAL_ANALYST_PROMPT = `
You are a financial expert providing live, on-the-spot commentary during an earnings call. Each speaker line will come in as plain text.
Your job:
 Only respond if the line delivers new, concrete, and material insight in any of the following 6 areas:
Company Performance: Clear data or change in revenue, margins, costs, KPIs, or guidance
Strategic Vision: Specific shift in direction, product, business model, or market entry (not just ambition)
Execution Risk: Mention of delays, cost overruns, scaling issues, ops breakdowns
Macro Impact: Direct effects from rates, regulation, inflation, geopolitical tension
Competitive Landscape: Named rivals, pricing battles, market share, disruptive threat
Sentiment & Framing: Revealing tone shift (e.g. defensiveness, hype cycle, internal pressure)

Criteria for responding:
Only comment on meaningful insights that provide new, concrete, material information affecting the company's bottom line, strategy, or market position. Avoid repeating earlier points without new context.
Skip any motivational language, broad optimism, or statements with no clear financial, operational, or strategic impact.
Do not include category labels such as "Execution Risk" or "Sentiment & Framing" at the beginning of the annotation. Provide direct commentary without extra labels.
Skip entirely if the statement is a repetition of earlier points, overly vague, obvious or generic to any listener, or does not materially affect the company.

For each statement given, ask yourself: "Is it worth commenting on?" If yes, provide a short, punchy insight. If no, don't provide anything. Use prior context only if it clearly improves the interpretation. Max 1-2 sentences. Think like a fast analyst narrating what's really going on beneath the words.

Respond in JSON format:
{
  "hasInsight": boolean,
  "insight": "your analysis here or null if no insight"
}
`;

/**
 * Generates an AI-powered insight using OpenAI GPT-4o-mini.
 */
async function generateAIInsight(
  request: InsightRequest
): Promise<Insight | null> {
  try {
    const contextMessage = `
Context from previous conversation:
${request.conversationHistory}

Current statement to analyze:
"${request.currentSentence}"
`;

    const completion = await openai.chat.completions.create({
      model: "o4-mini",
      messages: [
        {
          role: "system",
          content: FINANCIAL_ANALYST_PROMPT,
        },
        {
          role: "user",
          content: contextMessage,
        },
      ],
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      return null;
    }

    const aiResponse: OpenAIResponse = JSON.parse(response);

    if (!aiResponse.hasInsight || !aiResponse.insight) {
      return null;
    }

    const insight: Insight = {
      segmentId: request.segmentId,
      createdAt: new Date().toISOString(),
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: aiResponse.insight,
    };

    return insight;
  } catch (error) {
    console.error("OpenAI API Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      segmentId: request.segmentId,
    });
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: InsightRequest = await request.json();

    // Validate required fields
    if (
      !body.currentSentence ||
      !body.timestamp ||
      !body.segmentId
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: currentSentence, timestamp, segmentId",
        },
        { status: 400 }
      );
    }

    const insight = await generateAIInsight(body);
    const processingTime = Date.now() - startTime;

    const response: APIResponse = {
      success: true,
      insight: insight || undefined,
      meta: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("Insight Generation Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      processingTimeMs: processingTime,
    });

    return NextResponse.json(
      {
        error: "Internal server error",
        meta: {
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "ai-insight-generator",
    timestamp: new Date().toISOString(),
    model: "gpt-4o-mini",
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
  });
}
