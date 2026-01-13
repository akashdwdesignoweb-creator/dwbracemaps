export function buildPanelDiscoveryPrompt(idea: string, references?: Array<{ type: 'url' | 'file', content: string, name: string }>): string {
  let referenceText = "";
  if (references && references.length > 0) {
    referenceText = "\nREFERENCE MATERIAL:\n";
    references.forEach(ref => {
      referenceText += `\n[${ref.type.toUpperCase()}] ${ref.name}:\n${ref.content}\n`;
    });
  }

  return `
You are a Senior Product Manager designing a multi-application platform.

Your task is to identify HIGH-LEVEL APPLICATION PANELS based on USER ROLES,
not internal systems or technical modules.

IMPORTANT DEFINITIONS:
- A "Panel" means a distinct user-facing application or interface
  (web app, mobile app, dashboard) for a specific user role.
- Do NOT create panels for internal systems like IAM, Analytics,
  Blockchain, Governance, etc.
- Those are FEATURES, not panels.

ALLOWED PANEL TYPES (examples):
- User App
- Admin Panel
- Driver App
- Vendor / Seller Panel
- Support / Ops Panel
- Super Admin Panel

RULES:
1. Panels MUST map to a primary user role like user panel , admin panel etc depending on the app.
2. Panels MUST represent a distinct UI or app experience.
3. Each panel should own multiple features later.
4. Keep panels minimal and practical (usually 3–7 panels).
5. Do NOT design features or actions.
6. Each panel should relate with each other as they are panels of a single application

CRITICAL:
For "core_responsibility", provide a FULL END-TO-END DESCRIPTION in EASY BUSINESS LANGUAGE.
- Explain EVERY feature that the panel would have.
- Do not be brief. Be descriptive and visualize the value for the user.
- This text will be shown to the user to explain what this part of the app does.

OUTPUT STRICT JSON ONLY:
{
  "panels": [
    {
      "id": string,
      "title": string,
      "primary_users": string[],
      "core_responsibility": string
    }
  ]
}

IDEA:
${idea}

${referenceText}
`;
}
