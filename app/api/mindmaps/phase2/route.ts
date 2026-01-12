import { NextResponse } from "next/server";
import { runPhase2 } from "@/core/orchestrator/runPhase2";

export async function POST(req: Request) {
  const { idea, panel } = await req.json();
  const map = await runPhase2(idea, panel);
  return NextResponse.json(map);
}
