import { composeAudit } from "./compose";
import { crawlSite } from "./crawler";
import type { Audit, AuditInput, RunAuditOptions } from "./types";

const HARD_PAGE_LIMIT = 8;

export async function runAudit(
  input: AuditInput | string,
  options: RunAuditOptions = {},
): Promise<Audit> {
  const request = typeof input === "string" ? { url: input } : input;
  const now = options.now ?? (() => new Date());
  const createdAt = now();
  const startedAt = performance.now();
  const pagesLimit = Math.min(
    HARD_PAGE_LIMIT,
    Math.max(1, options.maxPages ?? HARD_PAGE_LIMIT),
  );

  const crawl = await crawlSite(request.url, {
    allowPrivateHosts: options.allowPrivateHosts,
    maxPages: pagesLimit,
    overallBudgetMs: options.overallBudgetMs,
    onEvent: options.onEvent,
  });

  return composeAudit({
    pages: crawl.pages,
    context: crawl.context,
    brand: request.brand,
    robots: crawl.robots,
    tech: crawl.tech,
    pagesLimit,
    startedAt,
    createdAt,
    emit: options.onEvent,
  });
}
