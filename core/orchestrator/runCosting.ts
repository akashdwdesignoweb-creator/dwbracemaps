import { buildCostingEstimationPrompt } from "../prompts/costingEstimation";
import { GeminiLLM } from "./geminiLLM";

export async function runCosting(
    idea: string,
    panels: any[],
    maps: Record<string, any>
): Promise<any> {
    const llm = new GeminiLLM();
    const prompt = buildCostingEstimationPrompt(idea, panels, maps);

    const raw = await llm.complete(prompt);
    return JSON.parse(raw);
}
