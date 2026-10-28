import { describe, expect, it } from "vitest";
import { extractPage } from "@/lib/audit/extract";
import {
  aggregateIssues,
  buildScoring,
  gradeForScore,
  issueDeduction,
} from "@/lib/audit/scoring";
import type {
  Finding,
  PageSnapshot,
  Severity,
  SiteContext,
} from "@/lib/audit/types";

function makePage(path = "/", html?: string): PageSnapshot {
  const url = `https://example.com${path}`;
  const body =
    html ??
    `<!doctype html><html lang="en"><head><title>Page ${path}</title></head><body><h1>Hello</h1><img src="/team.jpg" alt="Team"><a href="/contact">Contact</a></body></html>`;
  return {
    url,
    path,
    status: 200,
    finalUrl: url,
    headers: {},
    bodyBytes: Buffer.byteLength(body),
    ttfbMs: 180,
    assetBytes: 480_000,
    assetCount: 6,
    extracted: extractPage(body, url),
  };
}

function makeContext(
  pages: PageSnapshot[],
  overrides: Partial<SiteContext> = {},
): SiteContext {
  return {
    inputUrl: "https://example.com",
    startUrl: "https://example.com/",
    origin: "https://example.com",
    host: "example.com",
    pagesCrawled: pages.length,
    brokenLinks: [],
    linkChecks: 0,
    homepageAssetBytes: pages[0]?.assetBytes ?? null,
    homepageAssetCount: pages[0]?.assetCount ?? 0,
    ...overrides,
  };
}

interface FindingOverrides {
  checkId: string;
  category: Finding["category"];
  severity: Severity;
  title?: string;
  fix?: string;
  evidence?: string;
  impact?: Finding["impact"];
  effort?: Finding["effort"];
  pagePath?: string;
  affectedPages?: string[];
}

function finding(overrides: FindingOverrides): Finding {
  return {
    title: "Test issue",
    why: "Test rationale.",
    fix: "Fix the issue.",
    evidence: "Observed on the page.",
    effort: "quick",
    impact: "high",
    ...overrides,
  };
}

function score(
  findings: Finding[],
  pages: PageSnapshot[] = [makePage("/")],
) {
  return buildScoring({
    findings,
    pages,
    context: makeContext(pages),
    checksRun: 49,
    durationMs: 1200,
  });
}

describe("gradeForScore", () => {
  it("maps scores to grades at each boundary", () => {
    expect(gradeForScore(100).grade).toBe("A");
    expect(gradeForScore(90).grade).toBe("A");
    expect(gradeForScore(89).grade).toBe("B");
    expect(gradeForScore(80).grade).toBe("B");
    expect(gradeForScore(79).grade).toBe("C");
    expect(gradeForScore(70).grade).toBe("C");
    expect(gradeForScore(69).grade).toBe("D");
    expect(gradeForScore(55).grade).toBe("D");
    expect(gradeForScore(54).grade).toBe("F");
    expect(gradeForScore(0).grade).toBe("F");
  });

  it("returns a human label for every grade", () => {
    for (const value of [95, 85, 75, 60, 30]) {
      expect(gradeForScore(value).label.length).toBeGreaterThan(2);
    }
  });
});

describe("issueDeduction", () => {
  it("penalizes widespread issues harder than isolated ones", () => {
    expect(issueDeduction("high", 1)).toBeGreaterThan(
      issueDeduction("high", 0.25),
    );
    expect(issueDeduction("critical", 1)).toBeGreaterThan(
      issueDeduction("medium", 1),
    );
    expect(issueDeduction("medium", 0)).toBeGreaterThan(0);
  });
});

describe("aggregateIssues", () => {
  it("merges repeated findings and unions affected pages", () => {
    const issues = aggregateIssues(
      [
        finding({
          checkId: "a11y-img-alt",
          category: "accessibility",
          severity: "high",
          pagePath: "/",
        }),
        finding({
          checkId: "a11y-img-alt",
          category: "accessibility",
          severity: "high",
          pagePath: "/about",
        }),
      ],
      4,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].count).toBe(2);
    expect(issues[0].pagesAffected).toEqual(["/", "/about"]);
    expect(issues[0].prevalence).toBe(0.5);
    expect(issues[0].priority).toBeGreaterThan(0);
  });

  it("treats a site-wide finding as fully prevalent", () => {
    const [issue] = aggregateIssues(
      [
        finding({
          checkId: "conv-no-contact",
          category: "conversion",
          severity: "medium",
        }),
      ],
      3,
    );

    expect(issue.prevalence).toBe(1);
    expect(issue.pagesAffected).toEqual([]);
  });

  it("sorts issues by priority with a deterministic tie-break", () => {
    const issues = aggregateIssues(
      [
        finding({ checkId: "b-check", category: "seo", severity: "medium" }),
        finding({ checkId: "a-check", category: "seo", severity: "medium" }),
        finding({
          checkId: "critical-check",
          category: "security",
          severity: "critical",
        }),
      ],
      1,
    );

    expect(issues[0].checkId).toBe("critical-check");
    expect(issues.map((issue) => issue.checkId)).toEqual([
      "critical-check",
      "a-check",
      "b-check",
    ]);
  });
});

describe("buildScoring", () => {
  it("awards a perfect score when nothing is wrong", () => {
    const result = score([]);

    expect(result.score).toBe(100);
    expect(result.grade).toBe("A");
    expect(result.topIssues).toEqual([]);
    expect(result.categories.every((category) => category.score === 100)).toBe(
      true,
    );
    expect(result.summary).toContain("example.com");
    expect(result.verdict.length).toBeGreaterThan(10);
  });

  it("deducts from the affected category and the weighted overall", () => {
    const result = score([
      finding({
        checkId: "sec-https",
        category: "security",
        severity: "critical",
        pagePath: "/",
      }),
    ]);

    const security = result.categories.find((c) => c.key === "security");
    expect(security?.score).toBe(82);
    expect(security?.criticalCount).toBe(1);
    expect(result.score).toBe(97);
    expect(result.grade).toBe("A");
  });

  it("keeps category scores at zero rather than negative", () => {
    const findings = Array.from({ length: 6 }, (_, index) =>
      finding({
        checkId: `sec-extra-${index}`,
        category: "security",
        severity: "critical",
      }),
    );

    const result = score(findings, [makePage("/")]);
    const security = result.categories.find((c) => c.key === "security");

    expect(security?.score).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic for identical inputs", () => {
    const findings = [
      finding({
        checkId: "seo-meta-missing",
        category: "seo",
        severity: "high",
        pagePath: "/",
        title: "The page has no meta description",
      }),
      finding({
        checkId: "perf-ttfb",
        category: "performance",
        severity: "medium",
        pagePath: "/about",
      }),
    ];
    const pages = [makePage("/"), makePage("/about")];

    expect(JSON.stringify(score(findings, pages))).toBe(
      JSON.stringify(score(findings, pages)),
    );
  });

  it("weights the overall score by the category weights", () => {
    const result = score([
      finding({ checkId: "seo-h1-missing", category: "seo", severity: "high" }),
    ]);

    const weighted = result.categories.reduce(
      (total, category) => total + category.score * category.weight,
      0,
    );
    expect(result.categories.reduce((sum, c) => sum + c.weight, 0)).toBeCloseTo(
      1,
      5,
    );
    expect(result.score).toBe(Math.round(weighted));
  });

  it("ranks top issues above low-severity noise", () => {
    const result = score(
      [
        finding({
          checkId: "medium-one",
          category: "seo",
          severity: "medium",
          title: "Medium one",
        }),
        finding({
          checkId: "medium-two",
          category: "accessibility",
          severity: "medium",
          title: "Medium two",
        }),
        finding({
          checkId: "medium-three",
          category: "conversion",
          severity: "medium",
          title: "Medium three",
        }),
        finding({
          checkId: "low-one",
          category: "seo",
          severity: "low",
          title: "Low one",
          impact: "high",
        }),
      ],
      [makePage("/")],
    );

    expect(result.topIssues).toHaveLength(3);
    expect(result.topIssues.every((issue) => issue.severity !== "low")).toBe(
      true,
    );
  });

  it("backfills low-severity issues when there is nothing stronger", () => {
    const result = score([
      finding({
        checkId: "low-only",
        category: "seo",
        severity: "low",
        title: "Only a small thing",
      }),
    ]);

    expect(result.topIssues).toHaveLength(1);
    expect(result.topIssues[0].checkId).toBe("low-only");
  });

  it("always surfaces critical issues ahead of widespread highs", () => {
    const pages = [
      makePage("/"),
      makePage("/about"),
      makePage("/services"),
      makePage("/contact"),
    ];
    const siteWide = (
      checkId: string,
      category: Finding["category"],
      title: string,
    ) =>
      pages.map((page) =>
        finding({
          checkId,
          category,
          severity: "high",
          title,
          pagePath: page.path,
        }),
      );

    const result = score(
      [
        finding({
          checkId: "critical-narrow",
          category: "security",
          severity: "critical",
          title: "A form posts over HTTP",
          pagePath: "/contact",
        }),
        ...siteWide("high-wide", "accessibility", "Every image lacks alt text"),
        ...siteWide(
          "high-wide-two",
          "accessibility",
          "The viewport meta tag is missing",
        ),
        ...siteWide(
          "high-wide-three",
          "performance",
          "The server responds slowly",
        ),
      ],
      pages,
    );

    expect(result.topIssues[0].checkId).toBe("critical-narrow");
  });

  it("builds a three-phase plan and puts critical work first", () => {
    const result = score([
      finding({
        checkId: "critical-now",
        category: "security",
        severity: "critical",
        title: "Sensitive form posts over HTTP",
        fix: "Upgrade the form endpoint to HTTPS.",
      }),
      finding({
        checkId: "medium-next",
        category: "seo",
        severity: "medium",
        title: "Meta descriptions repeat",
        fix: "Write distinct descriptions.",
      }),
      finding({
        checkId: "low-later",
        category: "accessibility",
        severity: "low",
        title: "Tab order jumps",
        fix: "Remove positive tabindex values.",
      }),
    ]);

    expect(result.actionPlan).toHaveLength(3);
    expect(result.actionPlan.map((phase) => phase.key)).toEqual([
      "now",
      "next",
      "later",
    ]);
    expect(result.actionPlan[0].items.join(" ")).toContain(
      "Upgrade the form endpoint to HTTPS.",
    );
    expect(result.actionPlan[0].items.join(" ")).not.toContain(
      "Remove positive tabindex values.",
    );
    expect(result.categories[0].key).toBe("seo");
  });

  it("describes every page with a score, grade, and metrics", () => {
    const pages = [makePage("/"), makePage("/about")];
    const result = score(
      [
        finding({
          checkId: "seo-title-missing",
          category: "seo",
          severity: "critical",
          title: "The page has no title",
          pagePath: "/",
        }),
        finding({
          checkId: "conv-no-contact",
          category: "conversion",
          severity: "medium",
          title: "No visible contact route",
          affectedPages: ["/about"],
        }),
      ],
      pages,
    );

    expect(result.pages).toHaveLength(2);
    const home = result.pages.find((page) => page.path === "/");
    const about = result.pages.find((page) => page.path === "/about");

    expect(home?.score).toBe(82);
    expect(home?.criticalCount).toBe(1);
    expect(home?.topFinding).toBe("The page has no title");
    expect(about?.score).toBe(96);
    expect(home?.metrics.images).toBe(1);
    expect(home?.metrics.h1Count).toBe(1);
    expect(home?.htmlKb).toBeGreaterThan(0);
    expect(home?.grade).toMatch(/^[A-F]$/);
  });

  it("describes critical findings without assuming a sales funnel", () => {
    const result = score([
      finding({
        checkId: "sec-https",
        category: "security",
        severity: "critical",
        title: "The site is served over plain HTTP",
      }),
    ]);

    expect(result.verdict).not.toMatch(/\b(?:sale|sales|revenue|buyer)\b/i);
  });

  it("states when the crawl could not read every page or link", () => {
    const pages = [makePage("/")];
    const result = buildScoring({
      findings: [],
      pages,
      context: makeContext(pages, {
        coverage: {
          pagesAttempted: 3,
          pagesSkipped: 2,
          pagesBlockedByRobots: 1,
          linksDiscovered: 5,
          linksVerified: 3,
          linksUnverified: 2,
          budgetExhausted: false,
        },
      }),
      checksRun: 49,
      durationMs: 1200,
    });

    expect(result.summary).toContain("could not be read");
    expect(result.summary).toContain("could not be verified");
    expect(result.summary).toContain("robots.txt");
  });

  it("keeps the clean-site summary free of coverage caveats when nothing was skipped", () => {
    const result = score([]);

    expect(result.summary).not.toMatch(/could not be read|coverage note/i);
  });

  it("writes a summary grounded in the crawl and the worst issue", () => {
    const result = score(
      [
        finding({
          checkId: "perf-ttfb",
          category: "performance",
          severity: "high",
          title: "Pages take too long to respond",
        }),
      ],
      [makePage("/"), makePage("/services")],
    );

    expect(result.summary).toContain("example.com");
    expect(result.summary).toContain("2");
    expect(result.summary).toContain("Pages take too long to respond");
    expect(result.summary).not.toMatch(/[{}]/);
    expect(result.verdict).not.toMatch(/[{}]/);
    expect(result.actionPlan.flatMap((phase) => phase.items).join(" ")).not.toMatch(
      /[{}]/,
    );
  });
});
