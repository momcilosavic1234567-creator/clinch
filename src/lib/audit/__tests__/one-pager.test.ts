import { describe, expect, it } from "vitest";
import {
  buildOnePager,
  cleanSiteTitle,
  clip,
  formatLongDate,
  headlineIssues,
  HEADLINE_COUNT,
} from "@/lib/audit/one-pager";
import type { Audit, Category, Issue, Severity } from "@/lib/audit/types";

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    checkId: "seo.meta-description",
    category: "seo" as Category,
    severity: "high" as Severity,
    title: "Missing meta description",
    why: "Search results show a blank snippet, so fewer people click.",
    fix: "Write a 120–155 character description for each page.",
    evidence: "The homepage has no meta description tag.",
    effort: "quick",
    impact: "high",
    pagesAffected: ["/"],
    prevalence: 1,
    count: 1,
    priority: 12,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<Audit> = {}): Audit {
  const issues = overrides.issues ?? [
    makeIssue({ checkId: "a", severity: "critical", priority: 22 }),
    makeIssue({ checkId: "b", severity: "high", priority: 12 }),
    makeIssue({ checkId: "c", severity: "medium", priority: 6 }),
    makeIssue({ checkId: "d", severity: "low", priority: 2 }),
  ];

  return {
    version: 1,
    id: "test",
    createdAt: "2026-10-26T09:00:00.000Z",
    durationMs: 1000,
    target: {
      inputUrl: "https://example.com",
      url: "https://example.com",
      finalUrl: "https://example.com/",
      host: "example.com",
      title: "Example Company",
    },
    brand: { agencyName: "Clinch", accent: "#D8FF4F" },
    score: 42,
    grade: "D",
    gradeLabel: "Needs work",
    verdict: "Three fixes would change how this site performs.",
    summary: "Summary",
    categories: [],
    topIssues: issues.slice(0, 3),
    issues,
    pages: [],
    actionPlan: [],
    pitch: {
      emails: [],
      followUp: { subject: "", body: "" },
      callOpener: "",
      talkingPoints: [],
    },
    stats: {
      pagesCrawled: 1,
      pagesLimit: 8,
      checksRun: 49,
      issuesFound: issues.length,
      criticalCount: 1,
      highCount: 1,
      brokenLinks: 0,
      linkChecks: 0,
      homepageWeightKb: 900,
      durationMs: 1000,
    },
    crawl: {
      robots: "respected",
      pagesLimit: 8,
      userAgent: "test",
      tech: [],
    },
    ...overrides,
  };
}

describe("clip", () => {
  it("leaves short copy untouched", () => {
    expect(clip("Short and useful.", 40)).toBe("Short and useful.");
  });

  it("collapses whitespace before measuring", () => {
    expect(clip("one\n\n  two", 40)).toBe("one two");
  });

  it("cuts on a word boundary and marks the omission", () => {
    const result = clip("The homepage has no meta description tag at all", 20);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
    expect(result).not.toContain("… …");
    expect(result).not.toMatch(/\s…$/);
  });
});

describe("headlineIssues", () => {
  it(`never returns more than ${HEADLINE_COUNT}`, () => {
    expect(headlineIssues(makeAudit())).toHaveLength(HEADLINE_COUNT);
  });

  it("keeps the engine's order", () => {
    const picked = headlineIssues(makeAudit());
    expect(picked.map((issue) => issue.checkId)).toEqual(["a", "b", "c"]);
  });

  it("falls back to all issues when there is no ranked selection", () => {
    const audit = makeAudit({ topIssues: [] });
    expect(headlineIssues(audit)).toHaveLength(HEADLINE_COUNT);
  });

  it("returns everything available when the site is clean", () => {
    const issues = [makeIssue({ checkId: "only", severity: "low" })];
    const audit = makeAudit({ issues, topIssues: issues });
    expect(headlineIssues(audit)).toHaveLength(1);
  });

  it("does not repeat a check", () => {
    const issues = [
      makeIssue({ checkId: "dup" }),
      makeIssue({ checkId: "dup" }),
      makeIssue({ checkId: "other" }),
    ];
    const audit = makeAudit({ issues, topIssues: issues });
    expect(headlineIssues(audit).map((issue) => issue.checkId)).toEqual([
      "dup",
      "other",
    ]);
  });
});

describe("buildOnePager", () => {
  it("numbers the findings for print", () => {
    const model = buildOnePager(makeAudit());
    expect(model.findings.map((finding) => finding.position)).toEqual([
      "01",
      "02",
      "03",
    ]);
  });

  it("leaves the full-report price to the agency", () => {
    const model = buildOnePager(makeAudit());
    expect(model.totalFindings).toBe(4);
    expect(model.remaining).toBe(1);
    expect(model).not.toHaveProperty("price");
  });

  it("carries human labels instead of enum keys", () => {
    const model = buildOnePager(makeAudit());
    expect(model.findings[0].categoryLabel).toBe("Search visibility");
    expect(model.findings[0].severityLabel).toBe("Critical");
  });

  it("keeps print copy inside the line budget", () => {
    const long = "word ".repeat(120).trim();
    const audit = makeAudit({
      topIssues: [makeIssue({ evidence: long, why: long, fix: long })],
      issues: [makeIssue({ evidence: long, why: long, fix: long })],
    });
    const finding = buildOnePager(audit).findings[0];
    expect(finding.evidence.length).toBeLessThanOrEqual(131);
    expect(finding.why.length).toBeLessThanOrEqual(136);
    expect(finding.fix.length).toBeLessThanOrEqual(116);
  });

  it("falls back to the host when the page has no title", () => {
    const audit = makeAudit();
    audit.target.title = "";
    expect(buildOnePager(audit).siteTitle).toBe("example.com");
  });
});

describe("cleanSiteTitle", () => {
  it("skips a filler first segment and keeps the business name", () => {
    expect(
      cleanSiteTitle(
        "Home | Northwind Family Dental | Family, Cosmetic and Emergency Dentist in Portland, Oregon",
        "northwinddental.example",
      ),
    ).toBe("Northwind Family Dental");
  });

  it("drops a welcome prefix", () => {
    expect(cleanSiteTitle("Welcome to Acme — Web Design", "acme.rs")).toBe(
      "Acme",
    );
  });

  it("keeps a plain title intact", () => {
    expect(cleanSiteTitle("Acme Ltd", "acme.rs")).toBe("Acme Ltd");
  });

  it("falls back to the host for a blank title", () => {
    expect(cleanSiteTitle("   ", "acme.rs")).toBe("acme.rs");
  });
});

describe("formatLongDate", () => {
  it("formats an ISO timestamp for a header", () => {
    expect(formatLongDate("2026-10-26T23:30:00.000Z")).toBe("26 Oct 2026");
  });
});
