export function buildPanelDesignPrompt(idea: string, panel: any) {
  return `
You are writing a FUNCTIONAL APPLICATION SPEC. 

Panel: ${panel.title}

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
- Navigation between screens should be described inside
  button or action nodes, not by nesting screens.
- Treat each user-visible page or step as a separate Screen.
- Do NOT merge multiple screens into one.
- If the user navigates forward or backward, it is a new Screen.

GRANULARITY LEVEL: EXTREME (CRITICAL)
Your goal is to provide a COMPLETE BLUEPRINT for the developer.
- DO NOT summarize. DO NOT be brief.
- List EVERY single UI element (Buttons, Input Fields, Dropdowns, Toggles, Links).
- Include Placeholder text for inputs (e.g., "Enter your email...").
- Include Validation States (e.g., "Error: Invalid email format").
- Include Empty States (e.g., "No items found. Start by adding one.").
- Include Loading States (e.g., "Skeleton loader while fetching data").
- Include Edge Cases (e.g., "Forgot Password flow", "Network Error retry").

LANGUAGE RULES:
- Use clear business language for labels.
- Describe the visual state and the action clearly.
- Example: "Submit Button (Disabled until form is valid)"
- Example: "Password Input (Hidden characters, 'Show' toggle)"

the more detailed it is the best. Dont miss anything.

IDEA:
${idea}
`;
}
