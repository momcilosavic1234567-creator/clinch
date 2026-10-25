import {
  CATEGORIES,
  CATEGORY_META,
  SEVERITY_RANK,
  SEVERITY_WEIGHT,
} from "./types";
import type {
  ActionPhase,
  Category,
  CategoryScore,
  Finding,
  Impact,
  Issue,
  PageAudit,
  PageSnapshot,
  Severity,
  SiteContext,
} from "./types";

const SEVERITY_DEDUCTION: Record<Severity, number> = {
  critical: 18,
  high: 9,
  medium: 4,
  low: 1.5,
};

const IMPACT_WEIGHT: Record<Impact, number> = {
  high: 1.5,
  medium: 1,
  low: 0.6,
};

const PREVALENCE_FLOOR = 0.45;
const PREVALENCE_RANGE = 0.55;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

export function issueDeduction(severity: Severity, prevalence: number): number {
  const factor = PREVALENCE_FLOOR + PREVALENCE_RANGE * clamp(prevalence, 0, 1);
  return roundOne(SEVERITY_DEDUCTION[severity] * factor);
}

export function gradeForScore(score: number): { grade: string; label: string } {
  if (score >= 90) return { grade: "A", label: "Pitch-ready" };
  if (score >= 80) return { grade: "B", label: "Solid foundation" };
  if (score >= 70) return { grade: "C", label: "Fixable gaps" };
  if (score >= 55) return { grade: "D", label: "Costly gaps" };
  return { grade: "F", label: "Urgent" };
}

export function aggregateIssues(findings: Finding[], pagesCrawled: number): Issue[] {
  const groups = new Map<string, Finding[]>();
  for (const finding of findings) {
    const group = groups.get(finding.checkId);
    if (group) group.push(finding);
    else groups.set(finding.checkId, [finding]);
  }

  const denominator = Math.max(1, pagesCrawled);
  const issues: Issue[] = [];

  for (const [checkId, group] of groups) {
    const representative = [...group].sort(
      (a, b) =>
        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
        (a.pagePath ?? "").localeCompare(b.pagePath ?? ""),
    )[0];

    const pagesAffected = Array.from(
      new Set(
        group.flatMap((finding) =>
          finding.pagePath
            ? [finding.pagePath]
            : (finding.affectedPages ?? []),
        ),
      ),
    ).sort();

    const prevalence =
      pagesAffected.length === 0
        ? 1
        : clamp(pagesAffected.length / denominator, 0, 1);

    const revenueBoost = representative.category === "conversion" ? 1.15 : 1;
    const priority = roundTwo(
      SEVERITY_WEIGHT[representative.severity] *
        (0.35 + 0.65 * prevalence) *
        IMPACT_WEIGHT[representative.impact] *
        revenueBoost,
    );

    issues.push({
      checkId,
      category: representative.category,
      severity: representative.severity,
      title: representative.title,
      why: representative.why,
      fix: representative.fix,
      evidence: representative.evidence,
      effort: representative.effort,
      impact: representative.impact,
      pagesAffected,
      prevalence,
      count: group.length,
      priority,
    });
  }

  return issues.sort(
    (a, b) =>
      b.priority - a.priority ||
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      a.checkId.localeCompare(b.checkId),
  );
}

function scoreCategory(issues: Issue[], category: Category): number {
  const deduction = issues
    .filter((issue) => issue.category === category)
    .reduce(
      (total, issue) => total + issueDeduction(issue.severity, issue.prevalence),
      0,
    );
  return Math.max(0, Math.round(100 - deduction));
}

function categoryScores(issues: Issue[]): CategoryScore[] {
  return CATEGORIES.map((category) => {
    const scoped = issues.filter((issue) => issue.category === category);
    return {
      key: category,
      label: CATEGORY_META[category].label,
      score: scoreCategory(issues, category),
      weight: CATEGORY_META[category].weight,
      issueCount: scoped.length,
      criticalCount: scoped.filter((issue) => issue.severity === "critical")
        .length,
      blurb: CATEGORY_META[category].blurb,
    };
  });
}

function overallScore(categories: CategoryScore[]): number {
  const weighted = categories.reduce(
    (total, category) => total + category.score * category.weight,
    0,
  );
  return clamp(Math.round(weighted), 0, 100);
}

export function selectTopIssues(issues: Issue[]): Issue[] {
  const criticals = issues.filter((issue) => issue.severity === "critical");
  const strong = issues.filter(
    (issue) => issue.severity !== "critical" && issue.severity !== "low",
  );
  const selected = [...criticals, ...strong].slice(0, 3);
  if (selected.length >= 3) return selected;
  const lows = issues.filter((issue) => issue.severity === "low");
  return [...selected, ...lows.slice(0, 3 - selected.length)];
}

function buildVerdict(score: number, criticalCount: number): string {
  if (criticalCount > 0) {
    return `The site is losing trust at the moments that decide a sale. ${criticalCount} critical ${
      criticalCount === 1 ? "issue is" : "issues are"
    } visible to every visitor and belong at the top of the list.`;
  }
  if (score >= 90) {
    return "The fundamentals are in place. What remains is polish, and small refinements here will compound.";
  }
  if (score >= 80) {
    return "A solid site with a handful of visible gaps. Closing them is a short, specific project rather than a rebuild.";
  }
  if (score >= 70) {
    return "The site works, but several gaps are quietly costing enquiries. The fixes are identifiable and mostly inexpensive.";
  }
  if (score >= 55) {
    return "Real opportunities are leaking at the moments that decide a sale. A focused sprint would move both trust and conversion.";
  }
  return "The site is underperforming on the basics. Treat the first three fixes as urgent, not optional.";
}

function buildSummary(
  context: SiteContext,
  pageCount: number,
  checksRun: number,
  categories: CategoryScore[],
  topIssue: Issue | undefined,
): string {
  const sorted = [...categories].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  if (!topIssue) {
    return `Audited ${pageCount} ${
      pageCount === 1 ? "page" : "pages"
    } on ${context.host} across ${checksRun} checks. No material issues surfaced: metadata, accessibility, performance, security, and conversion readiness all hold up. Re-run after the next release to catch regressions.`;
  }

  return `Audited ${pageCount} ${
    pageCount === 1 ? "page" : "pages"
  } on ${context.host} across ${checksRun} checks. Strongest area: ${
    strongest.label
  } (${strongest.score}/100). Weakest: ${weakest.label} (${
    weakest.score
  }/100). The highest-leverage fix: ${topIssue.title}.`;
}

function buildActionPlan(issues: Issue[]): ActionPhase[] {
  const now: string[] = [];
  const next: string[] = [];
  const later: string[] = [];

  for (const issue of issues) {
    const item = `${issue.title} — ${issue.fix}`;
    if (issue.severity === "critical") now.push(item);
    else if (issue.severity === "high") next.push(item);
    else if (issue.severity === "medium") later.push(item);
    else later.push(item);
  }

  const compact = (items: string[], fallback: string): string[] => {
    if (items.length === 0) return [fallback];
    if (items.length <= 4) return items;
    return [
      ...items.slice(0, 3),
      `Plus ${items.length - 3} more fixes from the full findings list.`,
    ];
  };

  return [
    {
      key: "now",
      window: "Days 0–30",
      title: "Stop the leaks",
      items: compact(
        now,
        "No urgent fixes. Keep dependencies and certificates current so the site stays protected.",
      ),
    },
    {
      key: "next",
      window: "Days 30–60",
      title: "Rebuild the foundation",
      items: compact(
        next,
        "No high-severity work pending. Audit again after the next content or campaign change.",
      ),
    },
    {
      key: "later",
      window: "Days 60–90",
      title: "Compound the gains",
      items: compact(
        later,
        "Run a quarterly public audit and compare the score against this baseline.",
      ),
    },
  ];
}

function pageFindingsFor(page: PageSnapshot, findings: Finding[]): Finding[] {
  return findings.filter(
    (finding) =>
      finding.pagePath === page.path ||
      (!finding.pagePath && (finding.affectedPages ?? []).includes(page.path)),
  );
}

function buildPageAudits(
  pages: PageSnapshot[],
  findings: Finding[],
): PageAudit[] {
  return pages.map((page) => {
    const scoped = pageFindingsFor(page, findings).sort(
      (a, b) =>
        SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
        a.checkId.localeCompare(b.checkId),
    );
    const deduction = scoped.reduce(
      (total, finding) => total + issueDeduction(finding.severity, 1),
      0,
    );
    const score = Math.max(0, Math.round(100 - deduction));
    const { grade } = gradeForScore(score);
    const extracted = page.extracted;

    return {
      url: page.url,
      path: page.path,
      status: page.status,
      title: extracted.title.trim() || page.path,
      score,
      grade,
      wordCount: extracted.wordCount,
      ttfbMs: Math.round(page.ttfbMs),
      htmlKb: Math.max(1, Math.round(page.bodyBytes / 1024)),
      issueCount: scoped.length,
      criticalCount: scoped.filter((f) => f.severity === "critical").length,
      highCount: scoped.filter((f) => f.severity === "high").length,
      topFinding: scoped[0]?.title ?? null,
      metrics: {
        images: extracted.images.length,
        missingAlt: extracted.images.filter(
          (image) => !image.alt || image.alt.trim().length === 0,
        ).length,
        scripts: extracted.scripts.length,
        links: extracted.internalLinks.length + extracted.externalLinks.length,
        h1Count: extracted.h1Count,
      },
    };
  });
}

export interface ScoringInput {
  findings: Finding[];
  pages: PageSnapshot[];
  context: SiteContext;
  checksRun: number;
  durationMs: number;
}

export interface ScoringResult {
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
}

export function buildScoring(input: ScoringInput): ScoringResult {
  const issues = aggregateIssues(input.findings, input.pages.length);
  const categories = categoryScores(issues);
  const score = overallScore(categories);
  const { grade, label } = gradeForScore(score);
  const topIssues = selectTopIssues(issues);
  const criticalCount = issues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  return {
    score,
    grade,
    gradeLabel: label,
    verdict: buildVerdict(score, criticalCount),
    summary: buildSummary(
      input.context,
      input.pages.length,
      input.checksRun,
      categories,
      topIssues[0],
    ),
    categories,
    topIssues,
    issues,
    pages: buildPageAudits(input.pages, input.findings),
    actionPlan: buildActionPlan(issues),
  };
}
