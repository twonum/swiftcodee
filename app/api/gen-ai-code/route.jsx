import { generateCodeJson } from "@/configs/AiModel";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60s for AI code generation on Vercel
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { prompt } = await req.json();

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  try {
    const result = await generateCodeJson(prompt);
    return NextResponse.json({
      projectTitle: result.projectTitle || "",
      explanation: result.explanation || "",
      files: result.files && typeof result.files === "object" ? result.files : {},
      generatedFiles: Array.isArray(result.generatedFiles) ? result.generatedFiles : [],
    });
  } catch (error) {
    console.error("Gen AI Code API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate code.",
      },
      { status: 500 }
    );
  }
}
