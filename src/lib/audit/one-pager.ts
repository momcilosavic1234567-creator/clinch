import { CATEGORY_META, type Audit, type Issue, type Severity } from "./types";

export const HEADLINE_COUNT = 3;

const EVIDENCE_LIMIT = 130;
const WHY_LIMIT = 135;
const FIX_LIMIT = 115;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Minor",
};

export function formatLongDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${
    MONTHS[date.getUTCMonth()]
  } ${date.getUTCFullYear()}`;
}

export function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const boundary = cut.lastIndexOf(" ");
  const body = boundary > max * 0.6 ? cut.slice(0, boundary) : cut;
  return `${body.replace(/[\s.,;:—–-]+$/, "")}…`;
}

const FILLER_SEGMENT = /^(home|homepage|welcome|index|start|startseite|početna|pocetna)$/i;
const FILLER_PREFIX = /^(welcome to|home|homepage)\s+/i;

export function cleanSiteTitle(title: string, host: string): string {
  const raw = title.replace(/\s+/g, " ").trim();
  if (!raw) return host;

  const segments = raw
    .split(/\s*[|•·]\s*|\s+[—–]\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const named = segments.find((segment) => !FILLER_SEGMENT.test(segment));
  const cleaned = (named ?? raw).replace(FILLER_PREFIX, "").trim();

  return clip(cleaned.length > 2 ? cleaned : raw, 68);
}

export function headlineIssues(audit: Audit): Issue[] {
  const source = audit.topIssues.length > 0 ? audit.topIssues : audit.issues;
  const seen = new Set<string>();
  const picked: Issue[] = [];

  for (const issue of source) {
    if (seen.has(issue.checkId)) continue;
    seen.add(issue.checkId);
    picked.push(issue);
    if (picked.length === HEADLINE_COUNT) break;
  }

  return picked;
}

export interface HeadlineFinding {
  position: string;
  severity: Severity;
  severityLabel: string;
  categoryLabel: string;
  title: string;
  evidence: string;
  why: string;
  fix: string;
}

export interface OnePagerModel {
  host: string;
  siteTitle: string;
  date: string;
  score: number;
  grade: string;
  gradeLabel: string;
  verdict: string;
  findings: HeadlineFinding[];
  totalFindings: number;
  remaining: number;
}

export function buildOnePager(audit: Audit): OnePagerModel {
  const issues = headlineIssues(audit);

  return {
    host: audit.target.host,
    siteTitle: cleanSiteTitle(audit.target.title, audit.target.host),
    date: formatLongDate(audit.createdAt),
    score: audit.score,
    grade: audit.grade,
    gradeLabel: audit.gradeLabel,
    verdict: audit.verdict,
    findings: issues.map((issue, index) => ({
      position: String(index + 1).padStart(2, "0"),
      severity: issue.severity,
      severityLabel: SEVERITY_LABEL[issue.severity],
      categoryLabel: CATEGORY_META[issue.category].label,
      title: issue.title,
      evidence: clip(issue.evidence, EVIDENCE_LIMIT),
      why: clip(issue.why, WHY_LIMIT),
      fix: clip(issue.fix, FIX_LIMIT),
    })),
    totalFindings: audit.issues.length,
    remaining: Math.max(audit.issues.length - issues.length, 0),
  };
}
