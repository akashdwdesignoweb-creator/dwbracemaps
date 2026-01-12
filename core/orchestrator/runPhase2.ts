import { buildPanelDesignPrompt } from "../prompts/panelDesign";
import { GeminiLLM } from "./geminiLLM";
import { PanelMindMap } from "../types/mindmap";
import { resolvePanelRoot } from "./resolvePanelRoot";

export async function runPhase2(
  idea: string,
  panel: any
): Promise<PanelMindMap> {
  const llm = new GeminiLLM();
  const prompt = buildPanelDesignPrompt(idea, panel);

  const raw = await llm.complete(prompt);
  const rawMap = JSON.parse(raw);

  const root = resolvePanelRoot(rawMap);

  return {
    panel: {
      id: panel.id,
      title: panel.title,
      root,
    },
    complexity: "High",
  };
}
