import { MindMapNode } from "../types/mindmap";

export function resolvePanelRoot(rawMap: any): MindMapNode {
  // Case 1: New Recursive Format (Preferred)
  if (rawMap?.root) {
    return assignIds(rawMap.root);
  }

  // Case 2: Legacy Screens Format (Fallback)
  if (Array.isArray(rawMap?.Screens)) {
    return {
      id: "root",
      label: rawMap.Panel || "Panel",
      children: rawMap.Screens.map((screen: any, i: number) => ({
        id: `screen_${i}`,
        label: screen.ScreenName,
        children: [
          {
            id: `screen_${i}_desc`,
            label: screen.Description || "",
            children: (screen.Interactions || []).map((act: any, j: number) => ({
              id: `screen_${i}_act_${j}`,
              label: act.Action,
              children: []
            }))
          }
        ]
      }))
    };
  }

  console.error("Unknown MindMap format:", rawMap);
  return { id: "root-error", label: "Error Parsing Map", children: [] };
}

// Helper to assign unique IDs recursively
function assignIds(node: any, prefix = "node"): MindMapNode {
  const id = `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    label: node.label || "Untitled",
    children: (node.children || []).map((child: any, i: number) =>
      assignIds(child, `${id}_${i}`)
    ),
  };
}
