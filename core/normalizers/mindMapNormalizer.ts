import { MindMapNode } from "../types/mindmap";

export function normalizeMindMap(root: MindMapNode): MindMapNode {
  return normalizeNode(root);
}

function normalizeNode(node: MindMapNode): MindMapNode {
  const children = Array.isArray(node.children) ? node.children : [];

  // Merge fragmented spec nodes (leaf-only children)
  if (children.length > 1 && children.every(isLeafNode)) {
    return {
      ...node,
      children: [mergeSpecNodes(node, children)],
    };
  }

  return {
    ...node,
    children: children.map(normalizeNode),
  };
}

function isLeafNode(node: MindMapNode): boolean {
  return !node.children || node.children.length === 0;
}

/**
 * Always returns a safe string label
 */
function resolveLabel(node: any): string {
  if (typeof node?.label === "string" && node.label.trim()) {
    return node.label;
  }

  if (typeof node?.title === "string" && node.title.trim()) {
    return node.title;
  }

  if (typeof node?.name === "string" && node.name.trim()) {
    return node.name;
  }

  return "Unnamed Interaction";
}

function mergeSpecNodes(
  parent: MindMapNode,
  nodes: MindMapNode[]
): MindMapNode {
  let label = `${resolveLabel(parent)}:\n`;

  nodes.forEach((n, index) => {
    const text = resolveLabel(n)
      .replace(/\n+/g, " ")
      .trim();

    label += `${index + 1}. ${text}\n`;
  });

  return {
    id: `${parent.id}_spec`,
    label: label.trim(),
    children: [],
  };
}
