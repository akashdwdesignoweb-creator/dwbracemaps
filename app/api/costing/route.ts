import { NextResponse } from "next/server";
import { runCosting } from "@/core/orchestrator/runCosting";

export async function POST(req: Request) {
    try {
        const { idea, panels, maps } = await req.json();

        if (!idea || !panels) {
            return NextResponse.json({ error: "Missing idea or panels" }, { status: 400 });
        }

        const costing = await runCosting(idea, panels, maps || {});

        return NextResponse.json(costing);
    } catch (error: any) {
        console.error("Costing Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
