import { NextResponse } from "next/server";
import { runPhase1 } from "@/core/orchestrator/runPhase1";
import { GeminiLLM } from "@/core/orchestrator/geminiLLM";

export async function POST(req: Request) {
  const { idea } = await req.json();

  const llm = new GeminiLLM();
  const panels = await runPhase1(idea, llm);

  return NextResponse.json({ panels });
}
