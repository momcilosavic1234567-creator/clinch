import type { PageSnapshot } from "./types";

export type BusinessType =
  | "healthcare"
  | "software"
  | "ecommerce"
  | "hospitality"
  | "lodging"
  | "agency"
  | "unknown";

export interface BusinessProfile {
  type: BusinessType;
  ctaFix: string;
  contactFix: string;
}

interface TypeRule {
  type: Exclude<BusinessType, "unknown">;
  signature: RegExp[];
  strong: RegExp[];
  weak: RegExp[];
  tech?: string[];
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
    signature: [
      /\bsaas\b/,
      /\bsoftware\b/,
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
    signature: [
      /\badd to (?:cart|bag)\b/,
      /\bshopping (?:cart|bag|basket)\b/,
      /\b(?:shop now|buy now)\b/,
      /\b(?:sold out|out of stock|in stock)\b/,
    ],
    strong: [
      /\b(?:online store|shop|store)\b/,
      /\bcheckout\b/,
      /\bfree shipping\b/,
      /\b(?:collection|apparel|jewel(?:l)?ery|merchandise)\b/,
    ],
    weak: [
      /\b(?:cart|returns?|size guide)\b/,
      /\b(?:sale|new arrivals)\b/,
      /\b(?:shipping|delivery)\b/,
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
];

const UNKNOWN: BusinessProfile = {
  type: "unknown",
  ctaFix:
    "Add one clear next step for visitors — a contact link, a phone number, or an inquiry form — and repeat it above the fold and at the end of the page.",
  contactFix:
    "Put a phone number, an email address, or a contact link in the header, footer, and a dedicated contact page.",
};

export const UNKNOWN_PROFILE = UNKNOWN;

const PROFILES: Record<Exclude<BusinessType, "unknown">, BusinessProfile> = {
  healthcare: {
    type: "healthcare",
    ctaFix:
      "Add one primary action above the fold — “Book an appointment” — that opens the booking page or dials the practice.",
    contactFix:
      "Put the phone number, booking link, and practice address in the header, footer, and a dedicated contact or appointments page.",
  },
  software: {
    type: "software",
    ctaFix:
      "Add one primary action above the fold — “Start a free trial” or “Book a demo” — that leads to a signup form or a demo booking.",
    contactFix:
      "Add a contact link, a sales email, and a demo booking path to the header and footer.",
  },
  ecommerce: {
    type: "ecommerce",
    ctaFix:
      "Add one primary action above the fold — “Shop the collection” or “Add to cart” — that leads into the product catalogue.",
    contactFix:
      "Add a support contact, shipping and returns links, and a visible email or chat path to the header and footer.",
  },
  lodging: {
    type: "lodging",
    ctaFix:
      "Add one primary action above the fold — “Book a room” or “Check availability” — that opens the booking engine.",
    contactFix:
      "Put the phone number, address, check-in times, and a booking link in the header, footer, and a contact page.",
  },
  hospitality: {
    type: "hospitality",
    ctaFix:
      "Add one primary action above the fold — “Book a table” or “Check availability” — that opens the reservation flow.",
    contactFix:
      "Put the phone number, address, opening hours, and a reservation link in the header, footer, and a contact page.",
  },
  agency: {
    type: "agency",
    ctaFix:
      "Add one primary action above the fold — “Start a project” or “Request a quote” — that opens an inquiry form.",
    contactFix:
      "Add a project inquiry link, an email address, and a contact page to the header and footer.",
  },
};

const TITLE_SIGNATURE_WEIGHT = 8;
const SIGNATURE_WEIGHT = 5;
const STRONG_WEIGHT = 2;
const WEAK_WEIGHT = 1;
const TECH_WEIGHT = 5;
const MIN_SCORE = 5;

function collectText(pages: PageSnapshot[]): {
  title: string;
  primary: string;
  secondary: string;
  all: string;
  tech: Set<string>;
} {
  const titles: string[] = [];
  const primary: string[] = [];
  const secondary: string[] = [];
  const tech = new Set<string>();

  for (const page of pages) {
    const extracted = page.extracted;
    titles.push(extracted.title, extracted.ogTitle);
    primary.push(extracted.metaDescription, extracted.ogDescription);
    secondary.push(
      extracted.path.replace(/[/_-]+/g, " "),
      ...extracted.ctas,
      ...extracted.internalLinks.map((link) => link.text),
      ...extracted.externalLinks.map((link) => link.text),
      ...extracted.formFields.map((field) => field.name ?? field.type),
    );
    for (const marker of extracted.techMarkers) tech.add(marker);
  }

  const normalize = (parts: string[]) =>
    parts.join(" ").toLowerCase().replace(/\s+/g, " ").trim();

  const titleText = normalize(titles);
  const primaryText = normalize(primary);
  const weakText = normalize(secondary);
  const allText = `${titleText} ${primaryText} ${weakText}`;

  return {
    title: titleText,
    primary: primaryText,
    secondary: weakText,
    all: allText,
    tech,
  };
}

function countHits(patterns: RegExp[], text: string): number {
  return patterns.filter((pattern) => pattern.test(text)).length;
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
      if (pattern.test(text.title)) {
        signatures += 1;
        signatureScore += TITLE_SIGNATURE_WEIGHT;
      } else if (pattern.test(text.all)) {
        signatures += 1;
        signatureScore += SIGNATURE_WEIGHT;
      }
    }

    const strong = countHits(rule.strong, text.all);
    const weak = countHits(rule.weak, text.secondary);
    const techHit =
      rule.tech?.some((marker) => text.tech.has(marker)) ?? false;

    const score =
      signatureScore +
      strong * STRONG_WEIGHT +
      weak * WEAK_WEIGHT +
      (techHit ? TECH_WEIGHT : 0);

    // A name is not enough: a lone supporting word or a lone weak label must
    // never decide the business type. Signatures and platform markers are
    // specific enough to stand alone.
    const supported =
      signatures > 0 || strong >= 2 || (strong > 0 && weak > 0) || techHit;

    if (!supported || score < MIN_SCORE) continue;

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
