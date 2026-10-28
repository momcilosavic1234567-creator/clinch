export const AGENCY_INTRO = {
  dossierCount: 1,
  priceEur: 49,
  turnaroundHours: 48,
} as const;

export const AGENCY_PILOT = {
  dossierCount: 5,
  priceEur: 300,
  perDossierEur: 60,
  turnaroundHours: 48,
} as const;

export const AGENCY_DELIVERABLES = [
  "A seven-page A4 dossier with your logo, accent, sender, and booking link",
  "Two outreach emails, a follow-up, a call opener, and three talking points",
  "A 30/60/90 plan with effort and impact on every fix",
  "The page-by-page evidence behind every finding",
  "A JSON file for your CRM, proposal, or internal notes",
] as const;

export const AGENCY_INPUTS = [
  "One public prospect URL for the pilot, or five for the package",
  "Your logo (PNG or JPG) or a clean wordmark",
  "Accent colour as a hex value",
  "Sender name and reply-to email",
  "A booking link for the call to action",
] as const;
