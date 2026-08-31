import { generateChatText } from "@/configs/AiModel";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60s for AI chat on Vercel
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { prompt } = await req.json();

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  try {
    const result = await generateChatText(prompt);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch AI response.",
      },
      { status: 500 }
    );
  }
}
