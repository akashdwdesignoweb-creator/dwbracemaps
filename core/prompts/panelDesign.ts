export function buildPanelDesignPrompt(idea: string, panel: any, allPanels: any[] = []) {
  // Create a summary of other panels for context
  const panelsContext = allPanels.map(p => `- ${p.title}: ${p.core_responsibility}`).join('\n');

  return `
SYSTEM:
You are an expert product manager and UX architect designing a detailed sitemap/mindmap for a specific panel in a web application.
Your goal is to output a hierarchical structure that perfectly mimics the depth and detail of a professional functional specification.

CONTEXT:
Original User Idea: ${idea}
Current Panel: ${panel.title} (Responsibility: ${panel.core_responsibility})
All Panels in System:
${panelsContext}

TASK:
Generate a recursive mindmap structure for this panel.
The structure must go from:
Root -> High-Level Section -> Feature/Sub-section -> Detailed User Stories/Fields.
You can add a node if you think it is necessary.

STYLE GUIDE (CRITICAL):
1. **Detailed Descriptions**: Leaf nodes should often contain detailed text blocks.
   - Start with "On going to this section..." or "User will be able to..."
   - Use numbered lists for fields (e.g., "1. Product Name\n2. Product Category").
   - Mention interactions like "**Click on Add Content**".
2. **Hierarchy**: Group related features under logical parent nodes (e.g., "Manage" under "Content Management").
3. **No Fluff**: Every node must add value.

OUTPUT FORMAT (STRICT JSON):
Your output must be a valid JSON object with a single root node.
Structure:
{
  "root": {
    "label": "String (Node Title/Text)",
    "children": [
      { "label": "...", "children": [...] }
    ]
  }
}

- "label": The text to display inside the node. Can be multi-line.
- "children": Array of child nodes. Recursive.

EXAMPLE OUTPUT STRUCTURE:
{
  "root": {
    "label": "User Management",
    "children": [
      {
        "label": "User Details",
        "children": [
            {
                "label": "After going to this section... view details:\\n1. Name\\n2. Email\\n3. Status"
            }
        ]
      },
      {
        "label": "Manage",
        "children": [
            { "label": "1. Block User\\n2. Reset Password" }
        ]
      }
    ]
  }
}

Begin. Output JSON only.
`;
}

