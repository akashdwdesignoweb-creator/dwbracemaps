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
- Login, Sign Up, Forgot Password, OTP Verification, and Reset Password
  MUST be created as separate Screens, even if they belong to Authentication.
- Do NOT merge multiple screens into one.
- If the user navigates forward or backward, it is a new Screen.

RULES:
- A Screen = an app page
- An Interaction = a real button, link, or menu action
- Spec must describe exactly what happens on click
- Write in implementation-ready detail
- No abstract terms

LANGUAGE RULES (VERY IMPORTANT):
- Use simple business language.
- Avoid technical or developer terms.
- Describe behavior from a user or system point of view.
- Use phrases like:
  • "The user enters..."
  • "The system checks..."
  • "The app shows..."
  • "The user is redirected to..."
- Do NOT mention APIs, databases, gateways, or services.

If an interaction includes multiple steps, split them into
separate child nodes written in simple, non-technical language.

IDEA:
${idea}
`;
}
