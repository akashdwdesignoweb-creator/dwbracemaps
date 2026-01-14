export function buildMapDescriptionPrompt(mindMapJson: any) {
  return `
You are an expert technical writer and product manager.

Your task is to analyze the following JSON structure representing a generic "Mind Map" or "Process Flow" for a specific feature of an application, and write a comprehensive, high-quality functional description.

CONTEXT (MIND MAP DATA):
${JSON.stringify(mindMapJson, null, 2)}

INSTRUCTIONS:
1. Analyze the structure to understand the feature's flow, screens, actions, and logic.
2. Write a "Functional Specification" or "Feature Walkthrough" based *only* on this map.
3. The tone should be professional, clear, and "premium" (like a high-end SaaS product documentation).
4. Do NOT mention "JSON", "Node", or "Edge". Talk about "Screens", "Steps", "Actions", and "User Flow".
5. Structure the output clearly using Standard Markdown.

FORMATTING RULES:
- Use ## for main sections.
- Use ### for subsections.
- Use **Tables** for listing interactions, data fields, or properties. This is CRITICAL.
- Use *Bullet points* for lists.
- Avoid large walls of text; break it down.

OUTPUT FORMAT (STRICT JSON):
{
  "description": "your markdown formatted description here..."
}
`;
}
