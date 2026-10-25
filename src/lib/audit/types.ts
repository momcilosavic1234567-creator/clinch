export const CATEGORIES = [
  "seo",
  "accessibility",
  "performance",
  "security",
  "conversion",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<
  Category,
  { label: string; weight: number; blurb: string }
> = {
  seo: {
    label: "Search visibility",
    weight: 0.25,
    blurb: "Can the right people find this site?",
  },
  accessibility: {
    label: "Accessibility",
    weight: 0.2,
    blurb: "Can everyone use it?",
  },
  performance: {
    label: "Performance",
    weight: 0.2,
    blurb: "Does it feel fast enough to keep visitors?",
  },
  security: {
    label: "Security & trust",
    weight: 0.15,
    blurb: "Does the site protect the people using it?",
  },
  conversion: {
    label: "Conversion readiness",
    weight: 0.2,
    blurb: "Is it obvious what a visitor should do next?",
  },
};

export type Severity = "critical" | "high" | "medium" | "low";
export type Effort = "quick" | "moderate" | "involved";
export type Impact = "high" | "medium" | "low";

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 22,
  high: 12,
  medium: 6,
  low: 2,
};

export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export interface Brand {
  agencyName: string;
  senderName?: string;
  email?: string;
  website?: string;
  bookingUrl?: string;
  accent: string;
  logoDataUrl?: string;
}

export const DEFAULT_BRAND: Brand = {
  agencyName: "Clinch",
  accent: "#D8FF4F",
};

export interface AuditTarget {
  inputUrl: string;
  url: string;
  finalUrl: string;
  host: string;
  title: string;
}

export interface PageImage {
  src: string;
  alt: string | null;
  hasDimensions: boolean;
  loading: string | null;
}

export interface LinkInfo {
  href: string;
  text: string;
  inNav: boolean;
}

export interface FormField {
  tag: "input" | "select" | "textarea";
  type: string;
  name: string | null;
  hasLabel: boolean;
}

export interface ScriptInfo {
  src: string;
  external: boolean;
  blocking: boolean;
}

export interface ExtractedPage {
  url: string;
  path: string;
  title: string;
  metaDescription: string;
  canonicalUrl: string | null;
  robotsMeta: string;
  hasNoIndex: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  lang: string | null;
  h1Count: number;
  headingSequence: number[];
  hasHeadingSkip: boolean;
  images: PageImage[];
  internalLinks: LinkInfo[];
  externalLinks: LinkInfo[];
  formFields: FormField[];
  unnamedLinks: number;
  unnamedButtons: number;
  tabindexPositive: number;
  hasSkipLink: boolean;
  hasViewport: boolean;
  ambiguousLinks: number;
  hasStructuredData: boolean;
  scripts: ScriptInfo[];
  stylesheets: number;
  hasRenderBlockingScript: boolean;
  externalScriptDomains: string[];
  contactMethods: string[];
  ctas: string[];
  socialProof: boolean;
  copyrightYear: number | null;
  wordCount: number;
  mixedContent: string[];
  insecureFormActions: number;
  lazyImages: number;
  assetUrls: string[];
  techMarkers: string[];
}

export interface PageSnapshot {
  url: string;
  path: string;
  status: number;
  finalUrl: string;
  headers: Record<string, string>;
  bodyBytes: number;
  ttfbMs: number;
  assetBytes: number | null;
  assetCount: number;
  extracted: ExtractedPage;
}

export interface BrokenLink {
  url: string;
  status: number;
  foundOn: string[];
}

export interface SiteContext {
  inputUrl: string;
  startUrl: string;
  origin: string;
  host: string;
  pagesCrawled: number;
  brokenLinks: BrokenLink[];
  linkChecks: number;
  homepageAssetBytes: number | null;
  homepageAssetCount: number;
}

export interface Finding {
  checkId: string;
  category: Category;
  severity: Severity;
  title: string;
  why: string;
  fix: string;
  evidence: string;
  effort: Effort;
  impact: Impact;
  pagePath?: string;
  affectedPages?: string[];
}

export interface Issue {
  checkId: string;
  category: Category;
  severity: Severity;
  title: string;
  why: string;
  fix: string;
  evidence: string;
  effort: Effort;
  impact: Impact;
  pagesAffected: string[];
  prevalence: number;
  count: number;
  priority: number;
}

export interface CategoryScore {
  key: Category;
  label: string;
  score: number;
  weight: number;
  issueCount: number;
  criticalCount: number;
  blurb: string;
}

export interface PageAudit {
  url: string;
  path: string;
  status: number;
  title: string;
  score: number;
  grade: string;
  wordCount: number;
  ttfbMs: number;
  htmlKb: number;
  issueCount: number;
  criticalCount: number;
  highCount: number;
  topFinding: string | null;
  metrics: {
    images: number;
    missingAlt: number;
    scripts: number;
    links: number;
    h1Count: number;
  };
}

export interface ActionPhase {
  key: "now" | "next" | "later";
  window: string;
  title: string;
  items: string[];
}

export interface PitchEmail {
  id: "direct" | "consultative";
  label: string;
  subject: string;
  body: string;
}

export interface PitchKit {
  emails: PitchEmail[];
  followUp: { subject: string; body: string };
  callOpener: string;
  talkingPoints: string[];
}

export interface AuditStats {
  pagesCrawled: number;
  pagesLimit: number;
  checksRun: number;
  issuesFound: number;
  criticalCount: number;
  highCount: number;
  brokenLinks: number;
  linkChecks: number;
  homepageWeightKb: number | null;
  durationMs: number;
}

export interface Audit {
  version: 1;
  id: string;
  createdAt: string;
  durationMs: number;
  target: AuditTarget;
  brand: Brand;
  score: number;
  grade: string;
  gradeLabel: string;
  verdict: string;
  summary: string;
  categories: CategoryScore[];
  topIssues: Issue[];
  issues: Issue[];
  pages: PageAudit[];
  actionPlan: ActionPhase[];
  pitch: PitchKit;
  stats: AuditStats;
  crawl: {
    robots: "respected" | "unavailable";
    pagesLimit: number;
    userAgent: string;
    tech: string[];
  };
}

export type AuditStage =
  | "validating"
  | "robots"
  | "crawling"
  | "links"
  | "measuring"
  | "analyzing"
  | "scoring"
  | "copywriting";

export type AuditEvent =
  | {
      type: "stage";
      stage: AuditStage;
      message: string;
      progress: number;
      detail?: string;
    }
  | {
      type: "page";
      url: string;
      path: string;
      status: number;
      title: string;
      progress: number;
    }
  | { type: "done"; audit: Audit }
  | { type: "error"; code: AuditErrorCode; message: string };

export type AuditErrorCode =
  | "INVALID_URL"
  | "PRIVATE_HOST"
  | "BLOCKED_ROBOTS"
  | "UNREACHABLE"
  | "NOT_HTML"
  | "TOO_LARGE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "UNKNOWN";

export class AuditError extends Error {
  code: AuditErrorCode;
  statusCode: number;

  constructor(code: AuditErrorCode, message: string, statusCode = 400) {
    super(message);
    this.name = "AuditError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface RunAuditOptions {
  onEvent?: (event: AuditEvent) => void;
  allowPrivateHosts?: boolean;
  maxPages?: number;
  overallBudgetMs?: number;
  now?: () => Date;
}

export interface AuditInput {
  url: string;
  brand?: Partial<Brand>;
}

export const AUDIT_VERSION = 1 as const;
