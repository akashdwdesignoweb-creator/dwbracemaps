export function buildCostingEstimationPrompt(idea: string, panels: any[], maps: Record<string, any>) {
  const panelsContext = panels.map(p => {
    const map = maps[p.id];
    return `- ${p.title}: ${p.core_responsibility}\n  Complexity based on Map: ${map ? "High (Detailed mindmap generated)" : "Standard"}`;
  }).join('\n');

  return `
SYSTEM:
You are a Senior Technical Project Manager and Estimator.
Your goal is to provide a realistic estimation of development hours for a software project based on its high-level panels and detailed functional requirements.

CONTEXT:
Project Idea: ${idea}
Panels & Scope:
${panelsContext}

TASK:
Estimate the number of hours required for each role across the entire project and provide a breakdown per panel.
Roles to consider:
1. Backend Development
2. Frontend Development
3. QA / Testing
4. UI/UX Design

ESTIMATION GUIDELINES:
- Be realistic. A simple panel might take 40-80 hours total. A complex one 120-200+ hours.
- Backend hours should cover API design, database schema, and logic.
- Frontend hours should cover UI implementation and state management.
- QA should be roughly 20-25% of development hours.
- Design should be roughly 15-20% of development hours.

OUTPUT FORMAT (STRICT JSON):
{
  "total_hours": number,
  "role_breakdown": {
    "backend": number,
    "frontend": number,
    "qa": number,
    "design": number
  },
  "panel_breakdown": [
    {
      "panel_id": string,
      "panel_title": string,
      "total_hours": number,
      "roles": {
        "backend": number,
        "frontend": number,
        "qa": number,
        "design": number
      }
    }
  ],
  "estimated_weeks": number // Assuming a team of 3 developers
}

Begin. Output JSON only.
`;
}
