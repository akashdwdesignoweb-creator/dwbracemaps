import { buildMapDescriptionPrompt } from "../prompts/mapDescription";
import { GeminiLLM } from "./geminiLLM";

export async function generateMapDescription(mindMap: any): Promise<string> {
    const llm = new GeminiLLM();
    const prompt = buildMapDescriptionPrompt(mindMap);

    const raw = await llm.complete(prompt);

    try {
        const parsed = JSON.parse(raw);
        return parsed.description || "Failed to generate description.";
    } catch (e) {
        console.error("Failed to parse description generation response", e);
        // Fallback: return raw if it looks like text, or a generic error
        return raw.length > 50 ? raw : "Error interpreting AI response.";
    }
}
