export interface MindMapNode {
  id: string;
  label: string;
  children: MindMapNode[];
}

export interface PanelMindMap {
  panel: {
    id: string;
    title: string;
    root: MindMapNode;
  };
  complexity: "Low" | "Medium" | "High";
}
