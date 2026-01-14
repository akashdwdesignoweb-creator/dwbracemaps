import { NextResponse } from "next/server";
import { generateMapDescription } from "@/core/orchestrator/generateMapDescription";

export async function POST(req: Request) {
    try {
        const { map } = await req.json();

        if (!map) {
            return NextResponse.json({ error: "Missing map data" }, { status: 400 });
        }

        const description = await generateMapDescription(map);

        return NextResponse.json({ description });
    } catch (error) {
        console.error("Error generating description:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
