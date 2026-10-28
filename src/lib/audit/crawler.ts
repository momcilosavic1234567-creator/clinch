import { extractPage } from "./extract";
import {
  AUDIT_USER_AGENT,
  fetchText,
  probeUrl,
  type FetchTextResult,
} from "./http";
import { parseRobotsTxt, type RobotsRules } from "./robots";
import { normalizeAndValidateUrl, type UrlSafetyOptions } from "./url-safety";
import { AuditError } from "./types";
import type {
  AuditEvent,
  AuditStage,
  BrokenLink,
  PageSnapshot,
  SiteContext,
} from "./types";

const DEFAULT_PAGE_LIMIT = 8;
const HARD_PAGE_LIMIT = 8;
const DEFAULT_BUDGET_MS = 40_000;
const MAX_LINK_CHECKS = 30;
const MAX_ASSETS = 24;
const PAGE_TIMEOUT_MS = 10_000;
const PROBE_TIMEOUT_MS = 4_000;
const MAX_CRAWL_DELAY_MS = 2_000;

const ASSET_PATH =
  /\.(?:pdf|jpe?g|png|gif|webp|avif|svg|ico|css|js|mjs|json|xml|zip|gz|tar|mp4|webm|mp3|wav|woff2?|ttf|otf|docx?|xlsx?|pptx?)$/i;

const PAGE_HINTS: Array<[RegExp, number]> = [
  [/contact|get-in-touch|enquir|inquire/i, 60],
  [/book|appointment|schedule|consult/i, 55],
  [/about/i, 50],
  [/service|treatment/i, 45],
  [/pricing|price|plans/i, 40],
  [/team|staff|dentist|doctor/i, 35],
  [/work|portfolio|project|case-stud/i, 30],
  [/shop|product|store/i, 28],
  [/faq|help/i, 22],
  [/review|testimonial/i, 18],
  [/blog|news|insight|article/i, 14],
];

export interface CrawlOptions extends UrlSafetyOptions {
  maxPages?: number;
  overallBudgetMs?: number;
  onEvent?: (event: AuditEvent) => void;
}

export interface CrawlResult {
  pages: PageSnapshot[];
  context: SiteContext;
  robots: "respected" | "unavailable";
  tech: string[];
}

function stageEvent(
  stage: AuditStage,
  message: string,
  progress: number,
  detail?: string,
): AuditEvent {
  return { type: "stage", stage, message, progress, ...(detail ? { detail } : {}) };
}

function pageEvent(page: PageSnapshot, progress: number): AuditEvent {
  return {
    type: "page",
    url: page.url,
    path: page.path,
    status: page.status,
    title: page.extracted.title.trim() || page.path,
    progress,
  };
}

function canonicalKey(url: URL): string {
  const copy = new URL(url.toString());
  copy.hash = "";
  if (copy.pathname !== "/") {
    copy.pathname = copy.pathname.replace(/\/+$/, "");
  }
  return copy.toString();
}

function isHtml(result: { contentType: string; body: string }): boolean {
  if (!result.body.trim()) return false;
  const type = result.contentType.toLowerCase();
  if (type.includes("html")) return true;
  if (type) return false;
  return /<!doctype html|<html[\s>]/i.test(result.body.slice(0, 500));
}

function robotsAllows(robots: RobotsRules, url: URL): boolean {
  return robots.isAllowed(`${url.pathname}${url.search}`);
}

function pathPriority(pathname: string): number {
  const hint = PAGE_HINTS.find(([pattern]) => pattern.test(pathname));
  const segments = pathname.split("/").filter(Boolean).length;
  return (hint?.[1] ?? 0) + Math.max(0, 12 - segments * 3);
}

export async function crawlSite(
  input: string,
  options: CrawlOptions = {},
): Promise<CrawlResult> {
  const startedAt = performance.now();
  const budget = Math.max(5_000, options.overallBudgetMs ?? DEFAULT_BUDGET_MS);
  const maxPages = Math.min(
    HARD_PAGE_LIMIT,
    Math.max(1, options.maxPages ?? DEFAULT_PAGE_LIMIT),
  );
  const emit = options.onEvent ?? (() => undefined);
  const safety: UrlSafetyOptions = {
    allowPrivateHosts: options.allowPrivateHosts,
    lookup: options.lookup,
  };
  const remaining = () => budget - (performance.now() - startedAt);
  const pageTimeout = () =>
    Math.max(1_000, Math.min(PAGE_TIMEOUT_MS, remaining()));
  const probeTimeout = () =>
    Math.max(800, Math.min(PROBE_TIMEOUT_MS, remaining()));

  emit(stageEvent("validating", "Checking the address and safety rules", 3));
  const start = await normalizeAndValidateUrl(input, safety);

  const robotsCache = new Map<string, RobotsRules>();
  let robotsReadable = false;

  const loadRobots = async (origin: string): Promise<RobotsRules> => {
    const cached = robotsCache.get(origin);
    if (cached) return cached;

    let rules: RobotsRules;
    try {
      const result = await fetchText(`${origin}/robots.txt`, {
        ...safety,
        timeoutMs: probeTimeout(),
        userAgent: AUDIT_USER_AGENT,
      });
      if (result.status >= 200 && result.status < 300) {
        rules = parseRobotsTxt(result.body, AUDIT_USER_AGENT);
        robotsReadable = true;
      } else {
        rules = parseRobotsTxt("", AUDIT_USER_AGENT);
      }
    } catch {
      rules = parseRobotsTxt("", AUDIT_USER_AGENT);
    }

    robotsCache.set(origin, rules);
    return rules;
  };

  emit(stageEvent("robots", "Reading the site's crawl rules", 7));
  const initialRobots = await loadRobots(start.origin);
  if (!robotsAllows(initialRobots, start)) {
    throw new AuditError(
      "BLOCKED_ROBOTS",
      `${start.host} asks audit tools to stay out of ${start.pathname}. Try the homepage or another public page.`,
      403,
    );
  }

  emit(stageEvent("crawling", "Reading the homepage", 11));

  let homeResult: FetchTextResult;
  try {
    homeResult = await fetchText(start.toString(), {
      ...safety,
      timeoutMs: pageTimeout(),
      userAgent: AUDIT_USER_AGENT,
    });
  } catch (error) {
    if (error instanceof AuditError) throw error;
    throw new AuditError(
      "UNREACHABLE",
      "We couldn't reach that website. Check the address and try again.",
      502,
    );
  }

  if (homeResult.status < 200 || homeResult.status >= 300) {
    if (homeResult.status === 404 || homeResult.status === 410) {
      throw new AuditError(
        "NOT_FOUND",
        "That page returned a 404. Check the address and try again.",
        404,
      );
    }
    throw new AuditError(
      "UNREACHABLE",
      `The site returned HTTP ${homeResult.status}. Try again shortly.`,
      502,
    );
  }

  if (!isHtml(homeResult)) {
    throw new AuditError(
      "NOT_HTML",
      "That address returned a file rather than an HTML page. Enter the website's homepage.",
      415,
    );
  }

  const homepageUrl = new URL(homeResult.url);
  const origin = homepageUrl.origin;
  let robots = initialRobots;

  if (origin !== start.origin) {
    robots = await loadRobots(origin);
    if (!robotsAllows(robots, homepageUrl)) {
      throw new AuditError(
        "BLOCKED_ROBOTS",
        `${homepageUrl.host} asks audit tools to stay out of its homepage.`,
        403,
      );
    }
  }

  const homePage: PageSnapshot = {
    url: homeResult.url,
    path: homepageUrl.pathname || "/",
    status: homeResult.status,
    finalUrl: homeResult.url,
    headers: homeResult.headers,
    bodyBytes: homeResult.bytes,
    ttfbMs: homeResult.ttfbMs,
    assetBytes: null,
    assetCount: 0,
    extracted: extractPage(homeResult.body, homeResult.url),
  };

  const pages: PageSnapshot[] = [homePage];
  const crawledKeys = new Set([canonicalKey(homepageUrl)]);
  const queuedKeys = new Set<string>();
  const robotsBlockedKeys = new Set<string>();
  let pagesAttempted = 1;
  let pagesSkipped = 0;
  let budgetExhausted = false;

  emit(pageEvent(homePage, 16));

  const collectCandidates = (): Array<{ url: string; key: string; score: number; path: string }> => {
    const candidates = new Map<
      string,
      { url: string; key: string; score: number; path: string }
    >();

    for (const page of pages) {
      for (const link of page.extracted.internalLinks) {
        let url: URL;
        try {
          url = new URL(link.href);
        } catch {
          continue;
        }
        if (url.origin !== origin) continue;
        if (ASSET_PATH.test(url.pathname)) continue;

        url.hash = "";
        const key = canonicalKey(url);
        if (!robotsAllows(robots, url)) {
          robotsBlockedKeys.add(key);
          continue;
        }
        if (crawledKeys.has(key) || queuedKeys.has(key)) continue;

        const score =
          pathPriority(url.pathname) + (link.inNav ? 100 : 0);
        const previous = candidates.get(key);
        if (!previous || score > previous.score) {
          candidates.set(key, {
            url: url.toString(),
            key,
            score,
            path: url.pathname,
          });
        }
      }
    }

    return [...candidates.values()].sort(
      (a, b) =>
        b.score - a.score ||
        a.path.localeCompare(b.path) ||
        a.url.localeCompare(b.url),
    );
  };

  type PageSkip =
    | "unreachable"
    | "status"
    | "not-html"
    | "off-origin"
    | "duplicate"
    | "budget";

  const crawlPage = async (
    candidateUrl: string,
  ): Promise<{ page: PageSnapshot } | { skip: PageSkip }> => {
    if (remaining() < 1_500) return { skip: "budget" };

    let result: FetchTextResult;
    try {
      result = await fetchText(candidateUrl, {
        ...safety,
        timeoutMs: pageTimeout(),
        userAgent: AUDIT_USER_AGENT,
      });
    } catch {
      return { skip: "unreachable" };
    }

    if (result.status < 200 || result.status >= 300) return { skip: "status" };
    if (!isHtml(result)) return { skip: "not-html" };

    const finalUrl = new URL(result.url);
    if (finalUrl.origin !== origin) return { skip: "off-origin" };
    if (crawledKeys.has(canonicalKey(finalUrl))) return { skip: "duplicate" };

    return {
      page: {
        url: result.url,
        path: finalUrl.pathname || "/",
        status: result.status,
        finalUrl: result.url,
        headers: result.headers,
        bodyBytes: result.bytes,
        ttfbMs: result.ttfbMs,
        assetBytes: null,
        assetCount: 0,
        extracted: extractPage(result.body, result.url),
      },
    };
  };

  const crawlDelayMs = Math.min(
    MAX_CRAWL_DELAY_MS,
    Math.max(0, (robots.crawlDelay ?? 0) * 1000),
  );

  while (pages.length < maxPages) {
    if (remaining() <= 2_000) {
      budgetExhausted = true;
      break;
    }
    const next = collectCandidates()[0];
    if (!next) break;

    queuedKeys.add(next.key);
    pagesAttempted += 1;
    const outcome = await crawlPage(next.url);
    if ("skip" in outcome) {
      if (outcome.skip === "budget") budgetExhausted = true;
      if (outcome.skip !== "duplicate") pagesSkipped += 1;
      continue;
    }

    const page = outcome.page;
    crawledKeys.add(canonicalKey(new URL(page.url)));
    pages.push(page);

    const progress = Math.min(
      59,
      16 + Math.round((pages.length / maxPages) * 43),
    );
    emit(pageEvent(page, progress));

    if (pages.length < maxPages && crawlDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, crawlDelayMs));
    }
  }

  emit(
    stageEvent(
      "links",
      "Checking internal links the crawl did not reach",
      63,
    ),
  );

  const linkTargets = new Map<
    string,
    { url: string; foundOn: Set<string> }
  >();

  for (const page of pages) {
    for (const link of page.extracted.internalLinks) {
      let url: URL;
      try {
        url = new URL(link.href);
      } catch {
        continue;
      }
      if (url.origin !== origin) continue;
      if (ASSET_PATH.test(url.pathname)) continue;
      if (!robotsAllows(robots, url)) continue;

      url.hash = "";
      const key = canonicalKey(url);
      if (crawledKeys.has(key)) continue;

      const existing = linkTargets.get(key);
      if (existing) existing.foundOn.add(page.path);
      else {
        linkTargets.set(key, {
          url: url.toString(),
          foundOn: new Set([page.path]),
        });
      }
    }
  }

  const targets = [...linkTargets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, MAX_LINK_CHECKS);

  const brokenLinks: BrokenLink[] = [];
  let linkChecks = 0;
  let linksUnverified = 0;

  for (const [index, entry] of targets.entries()) {
    const target = entry[1];
    if (remaining() < 1_200) {
      linksUnverified += targets.length - index;
      budgetExhausted = true;
      break;
    }

    try {
      const probe = await probeUrl(target.url, {
        ...safety,
        timeoutMs: probeTimeout(),
        userAgent: AUDIT_USER_AGENT,
      });
      linkChecks += 1;

      if (probe.status >= 400) {
        brokenLinks.push({
          url: target.url,
          status: probe.status,
          foundOn: [...target.foundOn].sort(),
        });
      }
    } catch {
      // A probe that never returned is unverified, not evidence of a broken link.
      linksUnverified += 1;
    }
  }

  brokenLinks.sort((a, b) => a.url.localeCompare(b.url));

  emit(stageEvent("measuring", "Weighing the homepage assets", 73));

  const assetUrls = Array.from(new Set(homePage.extracted.assetUrls))
    .filter((value) => /^https?:\/\//i.test(value))
    .slice(0, MAX_ASSETS);

  let assetBytes = 0;
  let assetCount = 0;

  for (const asset of assetUrls) {
    if (remaining() < 1_200) break;

    try {
      const probe = await probeUrl(asset, {
        ...safety,
        timeoutMs: probeTimeout(),
        userAgent: AUDIT_USER_AGENT,
      });
      if (
        probe.status >= 200 &&
        probe.status < 400 &&
        probe.contentLength !== null &&
        probe.contentLength > 0
      ) {
        assetBytes += probe.contentLength;
        assetCount += 1;
      }
    } catch {
      // A single unreachable asset should never fail the audit.
    }
  }

  if (assetCount > 0) {
    homePage.assetBytes = assetBytes;
    homePage.assetCount = assetCount;
  }

  const tech = Array.from(
    new Set(pages.flatMap((page) => page.extracted.techMarkers)),
  ).sort();

  const context: SiteContext = {
    inputUrl: input.trim(),
    startUrl: homePage.url,
    origin,
    host: new URL(homePage.url).host,
    pagesCrawled: pages.length,
    brokenLinks,
    linkChecks,
    homepageAssetBytes: assetCount > 0 ? assetBytes : null,
    homepageAssetCount: assetCount,
    coverage: {
      pagesAttempted,
      pagesSkipped,
      pagesBlockedByRobots: robotsBlockedKeys.size,
      linksDiscovered: targets.length,
      linksVerified: linkChecks,
      linksUnverified,
      budgetExhausted,
    },
  };

  return {
    pages,
    context,
    robots: robotsReadable ? "respected" : "unavailable",
    tech,
  };
}
