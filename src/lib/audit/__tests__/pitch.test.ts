import { describe, expect, it } from "vitest";
import { extractPage } from "@/lib/audit/extract";
import { generatePitch } from "@/lib/audit/pitch";
import { buildScoring } from "@/lib/audit/scoring";
import type {
  AuditTarget,
  Brand,
  Finding,
  PageSnapshot,
  SiteContext,
} from "@/lib/audit/types";

function makePage(path = "/"): PageSnapshot {
  const url = `https://northwinddental.com${path}`;
  const html = `<!doctype html><html lang="en"><head><title>Northwind Dental ${path}</title></head><body><h1>Dentistry that feels human</h1><p>${"Gentle care for every family. ".repeat(40)}</p><a href="/contact">Book an appointment</a><img src="/team.jpg" alt="Team"></body></html>`;
  return {
    url,
    path,
    status: 200,
    finalUrl: url,
    headers: {},
    bodyBytes: Buffer.byteLength(html),
    ttfbMs: 180,
    assetBytes: 480_000,
    assetCount: 6,
    extracted: extractPage(html, url),
  };
}

const pages = [makePage("/"), makePage("/services")];

const context: SiteContext = {
  inputUrl: "https://northwinddental.com",
  startUrl: "https://northwinddental.com/",
  origin: "https://northwinddental.com",
  host: "northwinddental.com",
  pagesCrawled: pages.length,
  brokenLinks: [],
  linkChecks: 12,
  homepageAssetBytes: 480_000,
  homepageAssetCount: 6,
};

const target: AuditTarget = {
  inputUrl: "https://northwinddental.com",
  url: "https://northwinddental.com/",
  finalUrl: "https://northwinddental.com/",
  host: "northwinddental.com",
  title: "Northwind Dental",
};

const findings: Finding[] = [
  {
    checkId: "a11y-img-alt",
    category: "accessibility",
    severity: "high",
    title: "Four images have no alt text",
    why: "Screen readers cannot describe them.",
    fix: "Describe each meaningful image in plain language.",
    evidence: "Missing alt text on /, /services, /team, /pricing.",
    effort: "quick",
    impact: "high",
    pagePath: "/",
  },
  {
    checkId: "seo-meta-missing",
    category: "seo",
    severity: "high",
    title: "The site has no meta description",
    why: "Search engines write their own snippet.",
    fix: "Write a 150-character description for each page.",
    evidence: "No meta description element on the homepage.",
    effort: "quick",
    impact: "high",
    pagePath: "/",
  },
  {
    checkId: "perf-ttfb",
    category: "performance",
    severity: "medium",
    title: "The homepage takes 2.4s to respond",
    why: "Visitors leave before the page paints.",
    fix: "Cache the homepage and move it to a faster host.",
    evidence: "Time to first byte measured at 2,400ms.",
    effort: "moderate",
    impact: "high",
    pagePath: "/",
  },
  {
    checkId: "conv-no-contact",
    category: "conversion",
    severity: "medium",
    title: "No visible way to contact the practice",
    why: "Ready-to-book visitors give up.",
    fix: "Put the phone number and a booking link in the header.",
    evidence: "No phone, email, or booking path found.",
    effort: "quick",
    impact: "high",
  },
];

const scoring = buildScoring({
  findings,
  pages,
  context,
  checksRun: 89,
  durationMs: 8200,
});

const brand: Brand = {
  agencyName: "Acme Studio",
  senderName: "Mina Kovac",
  email: "mina@acme.studio",
  website: "https://acme.studio",
  bookingUrl: "https://acme.studio/call",
  accent: "#D8FF4F",
};

function pitch(overrides: { brand?: Partial<Brand>; scoring?: typeof scoring } = {}) {
  return generatePitch({
    target,
    brand: { ...brand, ...overrides.brand },
    scoring: overrides.scoring ?? scoring,
    stats: {
      pagesCrawled: 2,
      checksRun: 89,
      issuesFound: 4,
      criticalCount: 0,
      highCount: 2,
    },
  });
}

function findingFor(
  pagePath: string,
  overrides: Partial<Finding> &
    Pick<Finding, "checkId" | "severity" | "title">,
): Finding {
  return {
    category: "accessibility",
    why: "It matters.",
    fix: "Fix it.",
    evidence: "Seen on the page.",
    effort: "quick",
    impact: "high",
    pagePath,
    ...overrides,
  };
}

describe("generatePitch", () => {
  it("returns two distinct email variants with usable subjects", () => {
    const kit = pitch();

    expect(kit.emails.map((email) => email.id)).toEqual([
      "direct",
      "consultative",
    ]);
    expect(kit.emails[0].body).not.toBe(kit.emails[1].body);
    for (const email of kit.emails) {
      expect(email.label.length).toBeGreaterThan(3);
      expect(email.subject.length).toBeLessThanOrEqual(80);
      expect(email.body.length).toBeGreaterThan(80);
    }
  });

  it("does not presume a software release cycle on a clean site", () => {
    const clean = generatePitch({
      target,
      brand,
      scoring: buildScoring({
        findings: [],
        pages,
        context,
        checksRun: 89,
        durationMs: 8200,
      }),
      stats: {
        pagesCrawled: 2,
        checksRun: 89,
        issuesFound: 0,
        criticalCount: 0,
        highCount: 0,
      },
    });

    expect(clean.emails[0].subject).not.toMatch(/release|deploy/i);
    expect(clean.emails[0].body).not.toMatch(/release|deploy/i);
  });

  it("grounds the direct email in the prospect and the observed findings", () => {
    const [direct] = pitch().emails;

    expect(direct.subject).toContain("northwinddental.com");
    expect(direct.body).toContain("northwinddental.com");
    expect(direct.body).toContain(scoring.topIssues[0].title);
    expect(direct.body).toContain("Acme Studio");
    expect(direct.body).toContain("Mina Kovac");
    expect(direct.body).toContain("https://acme.studio/call");
    expect(direct.body).toContain(String(scoring.score));
  });

  it("leads the direct email with critical findings, not the most widespread ones", () => {
    const fourPages = [
      makePage("/"),
      makePage("/about"),
      makePage("/services"),
      makePage("/contact"),
    ];
    const narrowCritical = {
      checkId: "sec-form-http",
      category: "security" as const,
      severity: "critical" as const,
      title: "A contact form posts over plain HTTP",
      why: "Patient details travel in clear text.",
      fix: "Move the form endpoint to HTTPS.",
      evidence: "The form action uses http://.",
      effort: "quick" as const,
      impact: "high" as const,
      pagePath: "/contact",
    };
    const siteWideHighs = fourPages.map((page) =>
      findingFor(page.path, {
        checkId: "a11y-img-alt",
        severity: "high",
        title: "Many images have no alt text",
      }),
    );
    const narrowScoring = buildScoring({
      findings: [narrowCritical, ...siteWideHighs],
      pages: fourPages,
      context,
      checksRun: 169,
      durationMs: 8200,
    });
    const [direct] = pitch({ scoring: narrowScoring }).emails;

    expect(narrowScoring.topIssues[0].checkId).toBe("sec-form-http");
    expect(direct.body.indexOf("A contact form posts over plain HTTP")).toBeLessThan(
      direct.body.indexOf("Many images have no alt text"),
    );
  });

  it("leads the consultative variant with what is working", () => {
    const consultative = pitch().emails.find(
      (email) => email.id === "consultative",
    );
    const strongest = [...scoring.categories].sort(
      (a, b) => b.score - a.score,
    )[0];

    expect(consultative?.body).toContain(strongest.label);
    expect(consultative?.body).toContain("northwinddental.com");
  });

  it("never leaks placeholders or empty brand fields", () => {
    const kit = pitch({
      brand: {
        agencyName: "Bare Studio",
        senderName: undefined,
        email: undefined,
        website: undefined,
        bookingUrl: undefined,
      },
    });
    const text = [
      ...kit.emails.map((email) => `${email.subject}\n${email.body}`),
      `${kit.followUp.subject}\n${kit.followUp.body}`,
      kit.callOpener,
      ...kit.talkingPoints,
    ].join("\n");

    expect(text).not.toContain("{");
    expect(text).not.toContain("}");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
    expect(text).not.toContain("[object");
    expect(kit.emails[0].body).toContain("Bare Studio");
    expect(kit.emails[0].body).not.toContain("https://acme.studio");
  });

  it("uses the website when no booking link exists", () => {
    const kit = pitch({
      brand: { bookingUrl: undefined, website: "https://bare.studio" },
    });

    expect(kit.emails[0].body).toContain("https://bare.studio");
    expect(JSON.stringify(kit)).not.toContain("undefined");
  });

  it("is deterministic", () => {
    expect(JSON.stringify(pitch())).toBe(JSON.stringify(pitch()));
  });

  it("makes a single ask in the direct email", () => {
    const [direct] = pitch().emails;
    const asks = direct.body.match(/15[- ]minutes?/gi) ?? [];

    expect(asks).toHaveLength(1);
    expect(direct.body).toContain("https://acme.studio/call");
  });

  it("follows up with the top finding in a complete sentence", () => {
    const body = pitch().followUp.body;

    expect(body).toContain(
      `this: ${scoring.topIssues[0].title.toLowerCase()}`,
    );
  });

  it("provides a follow-up, call opener, and three grounded talking points", () => {
    const kit = pitch();

    expect(kit.followUp.subject.length).toBeGreaterThan(5);
    expect(kit.followUp.body).toContain("northwinddental.com");
    expect(kit.callOpener).toContain(String(scoring.score));
    expect(kit.callOpener).toContain(scoring.topIssues[0].title);
    expect(kit.talkingPoints).toHaveLength(3);
    expect(kit.talkingPoints.join(" ")).toContain("northwinddental.com");
  });

  it("still writes a coherent pitch when the site has no findings", () => {
    const cleanScoring = buildScoring({
      findings: [],
      pages,
      context,
      checksRun: 89,
      durationMs: 8200,
    });
    const kit = pitch({
      scoring: cleanScoring,
      brand: { bookingUrl: undefined },
    });
    const text = JSON.stringify(kit);

    expect(kit.emails).toHaveLength(2);
    expect(kit.callOpener.length).toBeGreaterThan(40);
    expect(kit.talkingPoints.length).toBeGreaterThanOrEqual(1);
    expect(text).toContain("northwinddental.com");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("0 issues");
    expect(text).not.toContain("No visible way to contact");
  });
});
