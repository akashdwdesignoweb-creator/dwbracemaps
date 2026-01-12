import { buildPanelDiscoveryPrompt } from "../prompts/panelDiscovery";
import { PanelDefinition } from "../types/panel";

export async function runPhase1(
  idea: string,
  llm: { complete(prompt: string): Promise<string> }
): Promise<PanelDefinition[]> {
  const prompt = buildPanelDiscoveryPrompt(idea);
  const raw = await llm.complete(prompt);
  const parsed = JSON.parse(raw);
  return parsed.panels;
}
