import { GoogleGenAI } from "@google/genai";

export class GeminiLLM {
  private ai: GoogleGenAI;
  private model = "gemini-flash-latest";

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set");
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async complete(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContentStream({
      model: this.model,
      // config: {
      //   thinkingConfig: {
      //     thinkingLevel: 'HIGH',
      //   },
      // },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    let fullText = "";

    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    return this.extractJSON(fullText);
  }

  private extractJSON(text: string): string {
    const fencedJsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (fencedJsonMatch) {
      return fencedJsonMatch[1].trim();
    }

    const fencedMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (fencedMatch) {
      return fencedMatch[1].trim();
    }

    const rawJsonMatch = text.match(/\{[\s\S]*\}/);
    if (rawJsonMatch) {
      return rawJsonMatch[0].trim();
    }

    console.error("RAW GEMINI OUTPUT:\n", text);
    throw new Error("Unable to extract JSON from Gemini output");
  }
}

export {};
