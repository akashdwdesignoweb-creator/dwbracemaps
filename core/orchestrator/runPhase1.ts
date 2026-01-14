import { buildPanelDiscoveryPrompt } from "../prompts/panelDiscovery";
import { PanelDefinition } from "../types/panel";

export async function runPhase1(
  idea: string,
  llm: { complete(prompt: string): Promise<string> },
  references?: Array<{ type: 'url' | 'file', content: string, name: string }>
): Promise<{ panels: PanelDefinition[], title: string }> {
  const prompt = buildPanelDiscoveryPrompt(idea, references);
  const raw = await llm.complete(prompt);
  const parsed = JSON.parse(raw);
  return {
    panels: parsed.panels,
    title: parsed.project_title || "My Project" // Fallback
  };
}
