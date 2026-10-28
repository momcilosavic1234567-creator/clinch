import type { BusinessType, PageSnapshot } from "./types";

export type { BusinessType };

export interface BusinessProfile {
  type: BusinessType;
  label: string;
  confident: boolean;
  ctaFix: string;
  contactFix: string;
}

interface TypeRule {
  type: Exclude<BusinessType, "unknown">;
  signature: RegExp[];
  strong: RegExp[];
  weak: RegExp[];
  tech?: string[];
  // Words like "software" are too broad to infer from navigation alone; the
  // site has to describe itself that way in its title, description, or CTA.
  requiresSignature?: boolean;
  // Retail vocabulary (checkout, collections, returns) appears on agencies and
  // case studies too; a cart/stock mechanic, or a platform marker plus
  // storefront copy, is needed before calling a site an online shop.
  requiresStorefront?: boolean;
}

const RULES: TypeRule[] = [
  {
    type: "healthcare",
    signature: [
      /\b(?:dentists?|dentistry|dental|orthodont\w*)\b/,
      /\b(?:med ?spa|chiropract\w*|physiotherap\w*)\b/,
      /\b(?:veterinary|veterinarians?)\b/,
    ],
    strong: [
      /\b(?:clinics?|physicians?|doctors?)\b/,
      /\b(?:patients?)\b/,
      /\b(?:medical|healthcare|health care)\b/,
      /\b(?:therapy|therapists?|dermatolog\w*|optometr\w*)\b/,
      /\b(?:pediatric|paediatric|surgeons?|surgery)\b/,
      /\b(?:urgent care)\b/,
    ],
    weak: [
      /\b(?:appointments?|booking)\b/,
      /\b(?:treatments?)\b/,
      /\b(?:new patients?)\b/,
    ],
  },
  {
    type: "software",
    requiresSignature: true,
    signature: [
      /\bsaas\b/,
      // "software engineer" is a job title, not a product category.
      /\bsoftware\b(?!\s+(?:engineers?|engineering|developers?|development))/,
      /\b(?:free trial|start your free trial)\b/,
      /\b(?:book|request|schedule) a demo\b/,
    ],
    strong: [/\bapi\b/, /\b(?:open source|self-hosted)\b/, /\bplatform\b/],
    weak: [
      /\b(?:dashboard|integrations?)\b/,
      /\b(?:sign ?up|pricing|docs|documentation)\b/,
      /\b(?:demo|trial|product tour)\b/,
    ],
  },
  {
    type: "ecommerce",
    requiresStorefront: true,
    signature: [
      /\badd to (?:cart|bag)\b/,
      /\bshopping (?:cart|bag|basket)\b/,
      /\b(?:shop now|buy now)\b/,
      /\b(?:sold out|out of stock|in stock)\b/,
    ],
    strong: [
      // "store" and "shop" alone are too common in case-study titles and client
      // names to prove a shop; the storefront phrases carry that weight instead.
      /\b(?:online store|storefront|shop online|shop now|buy now)\b/,
      /\bcheckout\b/,
      /\bfree shipping\b/,
      /\b(?:collections?|apparel|jewel(?:l)?ery|merchandise)\b/,
    ],
    weak: [
      /\b(?:cart|returns?|size guide)\b/,
      /\b(?:sale|new arrivals)\b/,
      /\b(?:shipping|delivery)\b/,
      /\b(?:store|shop)\b/,
    ],
    tech: ["Shopify"],
  },
  {
    type: "lodging",
    signature: [
      /\b(?:hotels?|motels?|guest house|bed and breakfast|b&b|hostels?|resorts?|lodge)\b/,
      /\b(?:book a room|check availability)\b/,
    ],
    strong: [/\b(?:suites?|check-in|check-out)\b/],
    weak: [
      /\b(?:rooms?|reservations?)\b/,
      /\b(?:amenities|concierge|breakfast included)\b/,
    ],
  },
  {
    type: "hospitality",
    signature: [
      /\b(?:restaurants?|bistro|trattoria|osteria|pizzerias?)\b/,
      /\b(?:cafes?|coffee shop|wine bar|brewery|brewpub)\b/,
      /\b(?:book a table|fine dining)\b/,
    ],
    strong: [/\b(?:cuisine|menu du jour|chef|tasting menu)\b/],
    weak: [
      /\b(?:menu|reservations?)\b/,
      /\b(?:order online|dine|dining|happy hour)\b/,
      /\b(?:walk-?ins|takeaway|takeout)\b/,
    ],
  },
  {
    type: "agency",
    signature: [
      /\b(?:creative|design|digital|web|branding|marketing|advertising|seo) (?:agency|studio)\b/,
      /\b(?:software|app|product) (?:development|engineering) (?:agency|company|studio)\b/,
      /\b(?:design|digital|brand|innovation|creative|product|technology) (?:and [a-z]+ )?(?:consultancy|consulting)\b/,
    ],
    strong: [
      /\bagency\b/,
      /\b(?:branding|brand identit(?:y|ies)|brand strategy)\b/,
      /\b(?:portfolio|case stud(?:y|ies)|our work|selected work)\b/,
      /\b(?:web design|web development|design studio|creative studio|digital studio)\b/,
      /\b(?:freelanc(?:e|er|ers|ing))\b/,
      /\b(?:digital marketing|seo services|content strategy)\b/,
    ],
    weak: [
      /\b(?:projects?|clients?|studio)\b/,
      /\b(?:start a project|get a quote|request a quote)\b/,
      /\b(?:work with us|let'?s talk)\b/,
    ],
  },
  {
    type: "portfolio",
    signature: [
      /\b(?:personal|design|photography|illustration|writing) portfolio\b/,
      /\bhire me\b/,
      /\b(?:freelance|independent) (?:[a-z]+ )?(?:designer|developer|photographer|illustrator|writer|copywriter|consultant)\b/,
      /\b(?:product|ux|ui|interior|graphic|brand|web|motion) designer\b/,
    ],
    strong: [
      /\b(?:photographer|illustrator|copywriter|motion designer|3d artist|visual artist)\b/,
      /\b(?:personal website|personal site|about me|my story)\b/,
      /\bavailable for (?:freelance|work|commissions|projects)\b/,
    ],
    weak: [
      /\b(?:portfolio|gallery|commissions?)\b/,
      /\b(?:projects?|case stud(?:y|ies))\b/,
    ],
  },
];

const UNKNOWN: BusinessProfile = {
  type: "unknown",
  label: "General website",
  confident: false,
  ctaFix:
    "Add one clear next step for visitors — a contact link, a phone number, or an inquiry form — and repeat it above the fold and at the end of the page.",
  contactFix:
    "Put a phone number, an email address, or a contact link in the header, footer, and a dedicated contact page.",
};

export const UNKNOWN_PROFILE = UNKNOWN;

const PROFILES: Record<Exclude<BusinessType, "unknown">, BusinessProfile> = {
  healthcare: {
    type: "healthcare",
    label: "Healthcare & clinics",
    confident: true,
    ctaFix:
      "Add one primary action above the fold — “Book an appointment” — that opens the booking page or dials the practice.",
    contactFix:
      "Put the phone number, booking link, and practice address in the header, footer, and a dedicated contact or appointments page.",
  },
  software: {
    type: "software",
    label: "Software & SaaS",
    confident: true,
    ctaFix:
      "Add one primary action above the fold — “Start a free trial” or “Book a demo” — that leads to a signup form or a demo booking.",
    contactFix:
      "Add a contact link, a sales email, and a demo booking path to the header and footer.",
  },
  ecommerce: {
    type: "ecommerce",
    label: "E-commerce",
    confident: true,
    ctaFix:
      "Add one primary action above the fold — “Shop the collection” or “Add to cart” — that leads into the product catalogue.",
    contactFix:
      "Add a support contact, shipping and returns links, and a visible email or chat path to the header and footer.",
  },
  lodging: {
    type: "lodging",
    label: "Hotels & lodging",
    confident: true,
    ctaFix:
      "Add one primary action above the fold — “Book a room” or “Check availability” — that opens the booking engine.",
    contactFix:
      "Put the phone number, address, check-in times, and a booking link in the header, footer, and a contact page.",
  },
  hospitality: {
    type: "hospitality",
    label: "Restaurants & hospitality",
    confident: true,
    ctaFix:
      "Add one primary action above the fold — “Book a table” or “Check availability” — that opens the reservation flow.",
    contactFix:
      "Put the phone number, address, opening hours, and a reservation link in the header, footer, and a contact page.",
  },
  agency: {
    type: "agency",
    label: "Agencies & studios",
    confident: true,
    ctaFix:
      "Add one primary action above the fold — “Start a project” or “Request a quote” — that opens an inquiry form.",
    contactFix:
      "Add a project inquiry link, an email address, and a contact page to the header and footer.",
  },
  portfolio: {
    type: "portfolio",
    label: "Portfolios & personal sites",
    confident: true,
    ctaFix:
      "Add one primary action above the fold — “Hire me” or “Get in touch” — that opens your contact form or email.",
    contactFix:
      "Put an email address, a short contact form, and links to your profiles in the header, footer, and a contact page.",
  },
};

const TITLE_SIGNATURE_WEIGHT = 8;
const SIGNATURE_WEIGHT = 5;
const STRONG_WEIGHT = 2;
const WEAK_WEIGHT = 1;
const TECH_WEIGHT = 5;
const MIN_SCORE = 5;

function collectText(pages: PageSnapshot[]): {
  titleParts: string[];
  claimParts: string[];
  secondaryParts: string[];
  allParts: string[];
  tech: Set<string>;
} {
  const titles: string[] = [];
  const claims: string[] = [];
  const secondary: string[] = [];
  const tech = new Set<string>();

  for (const page of pages) {
    const extracted = page.extracted;
    titles.push(extracted.title, extracted.ogTitle);
    claims.push(
      extracted.metaDescription,
      extracted.ogDescription,
      ...extracted.ctas,
    );
    secondary.push(
      extracted.path.replace(/[/_-]+/g, " "),
      ...extracted.internalLinks.map((link) => link.text),
      ...extracted.externalLinks.map((link) => link.text),
      ...extracted.formFields.map((field) => field.name ?? field.type),
    );
    for (const marker of extracted.techMarkers) tech.add(marker);
  }

  const normalize = (value: string | null | undefined) =>
    (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const clean = (parts: Array<string | null | undefined>) =>
    parts.map(normalize).filter(Boolean);

  // Matching each field on its own avoids phrases invented by concatenation,
  // e.g. a “Personal software” link next to a “Product engineers” link.
  const titleParts = clean(titles);
  const claimParts = clean(claims);
  const secondaryParts = clean(secondary);

  return {
    titleParts,
    claimParts,
    secondaryParts,
    allParts: [...titleParts, ...claimParts, ...secondaryParts],
    tech,
  };
}

function countHits(patterns: RegExp[], parts: string[]): number {
  return patterns.filter((pattern) =>
    parts.some((part) => pattern.test(part)),
  ).length;
}

interface Candidate {
  type: Exclude<BusinessType, "unknown">;
  score: number;
  signatures: number;
  support: number;
}

export function detectBusinessProfile(
  pages: PageSnapshot[],
): BusinessProfile {
  const text = collectText(pages);
  const candidates: Candidate[] = [];

  for (const rule of RULES) {
    let signatures = 0;
    let signatureScore = 0;
    for (const pattern of rule.signature) {
      if (text.titleParts.some((part) => pattern.test(part))) {
        signatures += 1;
        signatureScore += TITLE_SIGNATURE_WEIGHT;
      } else if (text.claimParts.some((part) => pattern.test(part))) {
        signatures += 1;
        signatureScore += SIGNATURE_WEIGHT;
      }
    }

    const strong = countHits(rule.strong, text.allParts);
    const strongInClaims = countHits(rule.strong, [
      ...text.titleParts,
      ...text.claimParts,
    ]);
    const weak = countHits(rule.weak, text.secondaryParts);
    const techHit =
      rule.tech?.some((marker) => text.tech.has(marker)) ?? false;

    // Link labels and paths alone are too incidental to name a company's
    // business; a title, description, or CTA has to support the category.
    const claimEvidence = signatures > 0 || strongInClaims > 0;
    // A platform marker (e.g. Shopify) corroborates a shop but cannot create one.
    const techCorroborated = techHit && claimEvidence;

    if (rule.requiresStorefront) {
      const mechanics = countHits(rule.signature, text.allParts);
      const hasStorefront =
        mechanics > 0 || (techHit && strongInClaims > 0);
      if (!hasStorefront) continue;
    }

    const score =
      signatureScore +
      strong * STRONG_WEIGHT +
      weak * WEAK_WEIGHT +
      (techCorroborated ? TECH_WEIGHT : 0);

    // A name is not enough: a lone supporting word or a lone weak label must
    // never decide the business type. Signatures stand on their own, while a
    // platform marker only corroborates claim-level evidence.
    const supported =
      claimEvidence &&
      (signatures > 0 || strong >= 2 || weak > 0 || techCorroborated);

    if (!supported || score < MIN_SCORE) continue;
    if (rule.requiresSignature && signatures === 0) continue;

    candidates.push({
      type: rule.type,
      score,
      signatures,
      support: signatures + strong + weak + (techHit ? 1 : 0),
    });
  }

  if (candidates.length === 0) return UNKNOWN;

  const topScore = Math.max(...candidates.map((item) => item.score));
  const scored = candidates.filter((item) => item.score === topScore);
  const topSignatures = Math.max(...scored.map((item) => item.signatures));
  const signed = scored.filter((item) => item.signatures === topSignatures);
  const topSupport = Math.max(...signed.map((item) => item.support));
  const resolved = signed.filter((item) => item.support === topSupport);

  // Two verticals with equal evidence make the recommendation a guess.
  if (resolved.length !== 1) return UNKNOWN;

  return PROFILES[resolved[0].type];
}
