import type {
  AuditStats,
  AuditTarget,
  Brand,
  CategoryScore,
  Issue,
  PitchEmail,
  PitchKit,
} from "./types";
import type { ScoringResult } from "./scoring";

export interface PitchInput {
  target: AuditTarget;
  brand: Brand;
  scoring: Pick<
    ScoringResult,
    | "score"
    | "grade"
    | "gradeLabel"
    | "categories"
    | "issues"
    | "topIssues"
    | "pages"
  >;
  stats: Pick<
    AuditStats,
    "pagesCrawled" | "checksRun" | "issuesFound" | "criticalCount" | "highCount"
  >;
}

function tidy(text: string): string {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pageWord(count: number): string {
  return count === 1 ? "page" : "pages";
}

function issueWord(count: number): string {
  return count === 1 ? "issue" : "issues";
}

function signature(brand: Brand): string {
  return [brand.senderName, brand.agencyName, brand.website]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join("\n");
}

function nextStep(brand: Brand): string {
  if (brand.bookingUrl) {
    return `If you would like to walk through it, grab a 15-minute slot here: ${brand.bookingUrl}`;
  }
  if (brand.website) {
    return `More about how we work is here: ${brand.website}`;
  }
  return "Reply to this email and I will send the full dossier over.";
}

function followUpLink(brand: Brand): string {
  if (brand.bookingUrl) return brand.bookingUrl;
  if (brand.website) return `more about how we work is here: ${brand.website}`;
  return "just reply and I will send it over.";
}

function issueLines(issues: Issue[], limit: number): string {
  const shown = issues.slice(0, limit);
  return shown
    .map(
      (issue, index) =>
        `${index + 1}. ${issue.title}\n   Evidence: ${issue.evidence}\n   Fix: ${issue.fix}`,
    )
    .join("\n\n");
}

function rankedIssues(scoring: PitchInput["scoring"]): Issue[] {
  const seen = new Set<string>();
  return [...scoring.topIssues, ...scoring.issues].filter((issue) => {
    if (seen.has(issue.checkId)) return false;
    seen.add(issue.checkId);
    return true;
  });
}

function sortCategories(categories: CategoryScore[]): {
  strongest: CategoryScore;
  weakest: CategoryScore;
} {
  const sorted = [...categories].sort((a, b) => b.score - a.score);
  return {
    strongest: sorted[0],
    weakest: sorted[sorted.length - 1],
  };
}

function criticalLine(criticalCount: number): string {
  if (criticalCount === 1) {
    return "One of them is critical and visible to every visitor.";
  }
  if (criticalCount > 1) {
    return `${criticalCount} of them are critical and visible to every visitor.`;
  }
  return "None of it is a redesign; it is a short list of specific fixes.";
}

function cleanSubject(
  host: string,
  checksRun: number,
  scoring: PitchInput["scoring"],
): string {
  return scoring.score >= 90
    ? `${host} passed a ${checksRun}-check audit`
    : `A note on ${host} before your next update`;
}

function buildDirect(input: PitchInput, isClean: boolean): PitchEmail {
  const { target, brand, scoring, stats } = input;
  const host = target.host;
  const pages = stats.pagesCrawled;
  const checks = stats.checksRun;
  const { weakest } = sortCategories(scoring.categories);
  const signatureBlock = signature(brand);

  if (isClean) {
    return {
      id: "direct",
      label: "The direct one",
      subject: cleanSubject(host, checks, scoring),
      body: tidy(`Hi,

I ran a public audit of ${host} — ${pages} ${pageWord(pages)} and ${checks} checks, all from the outside.

The short version: it holds up. Nothing critical or high-severity surfaced, and the site scores ${scoring.score}/100. ${weakest.label} is the only area with any room left, at ${weakest.score}/100.

That is rare. The useful next step is protecting the result: a re-audit after your next significant change, and a second look before any paid campaign.

${nextStep(brand)}

${signatureBlock}`),
    };
  }

  const criticalCount = scoring.issues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  return {
    id: "direct",
    label: "The direct one",
    subject: `${scoring.issues.length} fixable ${issueWord(
      scoring.issues.length,
    )} on ${host}`,
    body: tidy(`Hi,

I ran a public audit of ${host} — ${pages} ${pageWord(pages)} and ${checks} checks, all from the outside.

Here is what stood out:

${issueLines(rankedIssues(scoring), 3)}

The site scores ${scoring.score}/100 overall, with ${weakest.label.toLowerCase()} as the biggest opportunity. ${criticalLine(
      criticalCount,
    )}

I have the full ${scoring.issues.length}-item dossier ready, including the page-by-page evidence and a 30/60/90 plan.

${nextStep(brand)}

${signatureBlock}`),
  };
}

function buildConsultative(input: PitchInput, isClean: boolean): PitchEmail {
  const { target, brand, scoring, stats } = input;
  const host = target.host;
  const pages = stats.pagesCrawled;
  const checks = stats.checksRun;
  const { strongest, weakest } = sortCategories(scoring.categories);
  const signatureBlock = signature(brand);

  if (isClean) {
    const minimum = Math.min(
      ...scoring.categories.map((category) => category.score),
    );
    return {
      id: "consultative",
      label: "The soft touch",
      subject: `${host}: a second opinion before your next update`,
      body: tidy(`Hi,

I spent a few minutes looking at ${host} this week. The honest summary is that it is in better shape than most sites I review: ${pages} ${pageWord(
        pages,
      )}, ${checks} checks, and every category at ${minimum}/100 or above.

That means the useful conversation is not about repair. It is about what to protect and where the next marginal gain comes from — before a redesign or a paid campaign changes the baseline.

I am happy to send the short audit over as a second opinion. No pitch attached.

${signatureBlock}`),
    };
  }

  const strongestSentence =
    strongest.score >= 90
      ? `${strongest.label} is already in good shape at ${strongest.score}/100.`
      : `Even the strongest area, ${strongest.label}, sits at ${strongest.score}/100, so there is room across the board.`;

  return {
    id: "consultative",
    label: "The soft touch",
    subject: `${host}: what is working and what to fix next`,
    body: tidy(`Hi,

I spent a few minutes looking at ${host} this week. ${strongestSentence}

A few things are holding the site back:

${issueLines(rankedIssues(scoring), 3)}

Overall it scores ${scoring.score}/100. The gaps are concentrated in ${weakest.label.toLowerCase()}, and they are specific rather than structural.

I have put the findings, page evidence, and a 30/60/90 plan into a short dossier. ${nextStep(
      brand,
    )}

No pitch attached — just a useful second opinion.

${signatureBlock}`),
  };
}

function buildFollowUp(input: PitchInput, isClean: boolean): PitchKit["followUp"] {
  const { target, brand, scoring, stats } = input;
  const host = target.host;
  const signatureBlock = signature(brand);

  if (isClean) {
    return {
      subject: `Re: ${cleanSubject(host, stats.checksRun, scoring)}`,
      body: tidy(`Hi,

One last note on ${host}. The audit found nothing urgent, which is worth knowing before a redesign or a campaign.

If you want the short dossier as a baseline for the next release, reply and I will send it over.

${signatureBlock}`),
    };
  }

  const first = scoring.topIssues[0];
  return {
    subject: `Re: ${scoring.issues.length} fixable ${issueWord(
      scoring.issues.length,
    )} on ${host}`,
    body: tidy(`Hi,

Following up on the audit of ${host}. The first thing I would fix is still this: ${first.title.toLowerCase()}.

The full dossier is ready whenever you want it — ${followUpLink(brand)}

${signatureBlock}`),
  };
}

function buildCallOpener(input: PitchInput, isClean: boolean): string {
  const { target, scoring, stats } = input;
  const host = target.host;

  if (isClean) {
    return tidy(
      `Before this call I ran a public audit of ${host}. It scored ${scoring.score}/100 and nothing critical surfaced across ${stats.checksRun} checks. Rather than invent problems, I would like to walk through what is already working and where the next marginal gain is.`,
    );
  }

  const first = scoring.topIssues[0];
  return tidy(
    `Before this call I ran a public audit of ${host}. It scored ${scoring.score}/100 across ${stats.checksRun} checks. The single clearest fix: ${first.title}. I can walk you through the ${scoring.issues.length} findings and the order I would tackle them in about ten minutes.`,
  );
}

function buildTalkingPoints(input: PitchInput, isClean: boolean): string[] {
  const { target, scoring, stats } = input;
  const host = target.host;
  const { weakest } = sortCategories(scoring.categories);

  if (isClean) {
    return [
      `${host} scored ${scoring.score}/100 across ${stats.checksRun} checks and ${stats.pagesCrawled} ${pageWord(
        stats.pagesCrawled,
      )}.`,
      `Every category scored at least ${Math.min(
        ...scoring.categories.map((category) => category.score),
      )}/100, so the story is maintenance rather than repair.`,
      "Nothing in the public crawl needs urgent attention; the next win is protecting the baseline.",
    ];
  }

  const criticalCount = scoring.issues.filter(
    (issue) => issue.severity === "critical",
  ).length;
  const first = scoring.topIssues[0];

  return [
    `${host} scored ${scoring.score}/100 across ${stats.checksRun} checks and ${stats.pagesCrawled} ${pageWord(
      stats.pagesCrawled,
    )}; ${scoring.issues.length} distinct ${issueWord(
      scoring.issues.length,
    )} came up${criticalCount > 0 ? `, ${criticalCount} of them critical` : ""}.`,
    `${weakest.label} is the weakest area at ${weakest.score}/100.`,
    `${first.title}: ${first.evidence}`,
  ];
}

export function generatePitch(input: PitchInput): PitchKit {
  const isClean = input.scoring.issues.length === 0;

  return {
    emails: [
      buildDirect(input, isClean),
      buildConsultative(input, isClean),
    ],
    followUp: buildFollowUp(input, isClean),
    callOpener: buildCallOpener(input, isClean),
    talkingPoints: buildTalkingPoints(input, isClean),
  };
}
