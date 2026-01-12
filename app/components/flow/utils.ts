import { MindMapNode } from "@/core/types/mindmap";
import { Node, Edge } from "reactflow";

let nodeIndex = 0;

export function convertMindMapToFlow(root: MindMapNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function traverse(
    node: MindMapNode,
    parentId: string | null,
    depth: number,
    xOffset: number
  ) {
    const id = `node_${nodeIndex++}`;

    nodes.push({
      id,
      data: { label: node.label },
      position: {
        x: depth * 300,
        y: xOffset,
      },
      type: "default",
    });

    if (parentId) {
      edges.push({
        id: `edge_${parentId}_${id}`,
        source: parentId,
        target: id,
      });
    }

    node.children?.forEach((child, i) => {
      traverse(child, id, depth + 1, xOffset + i * 120);
    });
  }

  traverse(root, null, 0, 0);

  return { nodes, edges };
}
