import { createAuditId, sanitizeBrand } from "./brand";
import { detectBusinessProfile } from "./business";
import { checksRunFor, runPageChecks, runSiteChecks } from "./checks";
import { AUDIT_USER_AGENT } from "./http";
import { generatePitch } from "./pitch";
import { buildScoring } from "./scoring";
import { AUDIT_VERSION } from "./types";
import type {
  Audit,
  AuditEvent,
  AuditStage,
  AuditTarget,
  Brand,
  PageSnapshot,
  SiteContext,
} from "./types";

export interface ComposeAuditInput {
  pages: PageSnapshot[];
  context: SiteContext;
  brand?: Partial<Brand>;
  robots: "respected" | "unavailable";
  tech: string[];
  pagesLimit: number;
  startedAt: number;
  createdAt: Date;
  emit?: (event: AuditEvent) => void;
}

function stageEvent(
  stage: AuditStage,
  message: string,
  progress: number,
): AuditEvent {
  return { type: "stage", stage, message, progress };
}

export function composeAudit(input: ComposeAuditInput): Audit {
  const { pages, context } = input;
  const emit = input.emit ?? (() => undefined);

  emit(stageEvent("analyzing", "Running the deterministic check suite", 82));

  const business = detectBusinessProfile(pages);
  const findings = [
    ...pages.flatMap((page) => runPageChecks(page, business)),
    ...runSiteChecks(pages, context, business),
  ];
  const checksRun = checksRunFor(pages.length);

  emit(stageEvent("scoring", "Scoring and ranking what matters", 91));

  const durationMs = Math.round(performance.now() - input.startedAt);
  const scoring = buildScoring({
    findings,
    pages,
    context,
    checksRun,
    durationMs,
  });

  emit(stageEvent("copywriting", "Writing the pitch kit", 96));

  const brand = sanitizeBrand(input.brand);
  const target: AuditTarget = {
    inputUrl: context.inputUrl,
    url: context.startUrl,
    finalUrl: context.startUrl,
    host: context.host,
    title: pages[0]?.extracted.title.trim() || context.host,
  };

  const criticalCount = scoring.issues.filter(
    (issue) => issue.severity === "critical",
  ).length;
  const highCount = scoring.issues.filter(
    (issue) => issue.severity === "high",
  ).length;

  const stats = {
    pagesCrawled: pages.length,
    pagesLimit: input.pagesLimit,
    checksRun,
    issuesFound: scoring.issues.length,
    criticalCount,
    highCount,
    brokenLinks: context.brokenLinks.length,
    linkChecks: context.linkChecks,
    homepageWeightKb:
      context.homepageAssetBytes === null
        ? null
        : Math.round(context.homepageAssetBytes / 1024),
    durationMs,
  };

  const pitch = generatePitch({ target, brand, scoring, stats });

  const audit: Audit = {
    version: AUDIT_VERSION,
    id: createAuditId(input.createdAt),
    createdAt: input.createdAt.toISOString(),
    durationMs,
    target,
    brand,
    business: {
      type: business.type,
      label: business.label,
      confident: business.confident,
    },
    score: scoring.score,
    grade: scoring.grade,
    gradeLabel: scoring.gradeLabel,
    verdict: scoring.verdict,
    summary: scoring.summary,
    categories: scoring.categories,
    topIssues: scoring.topIssues,
    issues: scoring.issues,
    pages: scoring.pages,
    actionPlan: scoring.actionPlan,
    pitch,
    stats,
    crawl: {
      robots: input.robots,
      pagesLimit: input.pagesLimit,
      userAgent: AUDIT_USER_AGENT,
      tech: input.tech,
      ...(context.coverage ? { coverage: context.coverage } : {}),
    },
  };

  emit({ type: "done", audit });
  return audit;
}
