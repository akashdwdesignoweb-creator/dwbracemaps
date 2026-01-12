import { MindMapNode } from "../types/mindmap";

export function resolvePanelRoot(rawMap: any): MindMapNode {
  // Case 1: Old format (keep for backward compatibility)
  if (rawMap?.panel?.root) {
    return rawMap.panel.root;
  }

  // ✅ Case 2: Screen-first format (NEW, preferred)
  if (Array.isArray(rawMap?.Screens)) {
    return {
      id: "root",
      label: rawMap.Panel || "Application Flow",
      children: rawMap.Screens.map((screen: any, i: number) => ({
        id: `screen_${i}`,
        label: `${screen.ScreenName}\n${screen.Description ?? ""}`,
        children: (screen.Interactions || []).map(
          (interaction: any, j: number) => ({
            id: `screen_${i}_action_${j}`,
            label: interaction.Action || interaction.Button || "Interaction",
            children: [
              {
                id: `screen_${i}_action_${j}_spec`,
                label: interaction.Spec || interaction.Description || "",
                children: [],
              },
            ],
          })
        ),
      })),
    };
  }

  console.error("UNSUPPORTED PHASE-2 OUTPUT:", rawMap);
  throw new Error("Unable to resolve panel root from Gemini output");
}
