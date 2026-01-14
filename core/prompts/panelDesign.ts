export function buildPanelDesignPrompt(idea: string, panel: any, allPanels: any[] = []) {
  // Create a summary of other panels for context
  const panelsContext = allPanels.map(p => `- ${p.title}: ${p.core_responsibility}`).join('\n');

  return `
SYSTEM:
You are expanding a software panel that is part of a larger system.
Do NOT invent features unrelated to the original idea.

CONTEXT:
Original user idea:
${idea}

All panels in the system:
${panelsContext}

TASK:
Generate detailed features ONLY for the following panel:
${panel.title} (Responsibility: ${panel.core_responsibility})

RULES:
- Stay consistent with the original idea
- Do not duplicate features from other panels
- Explicitly reference interactions with other panels when needed
- Output structured JSON only

OUTPUT FORMAT (STRICT JSON):
{
  "Panel": string,
  "Screens": [
    {
      "ScreenName": string,
      "Description": string,
      "Interactions": [
        {
          "Action": string,
          "Spec": string
        }
      ]
    }
  ]
}

SCREEN SEPARATION RULES (VERY IMPORTANT):
- All Screens must be direct children of the Panel.
- Screens must NEVER be nested inside other Screens.
- Navigation between screens should be described inside action nodes.
- Treat each user-visible page or step as a separate Screen.

GRANULARITY LEVEL: EXTREME (CRITICAL)
- List EVERY single UI element (Buttons, Input Fields, Dropdowns, Toggles, Links).
- Include Placeholder text, Validation States, Empty States, Loading States, Edge Cases.
- Use clear business language.
`;
}
