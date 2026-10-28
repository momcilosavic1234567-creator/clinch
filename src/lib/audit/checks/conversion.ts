import { UNKNOWN_PROFILE, type BusinessProfile } from "../business";
import type { Finding, PageSnapshot } from "../types";
import { pageFinding } from "./helpers";

export const CONVERSION_PAGE_CHECKS = 2;

export function runConversionChecks(
  page: PageSnapshot,
  profile: BusinessProfile = UNKNOWN_PROFILE,
): Finding[] {
  const findings: Finding[] = [];
  const extracted = page.extracted;
  const isHome = page.path === "/" || page.path === "";
  const add = (finding: Omit<Finding, "category" | "pagePath">) => {
    findings.push(pageFinding(page, { ...finding, category: "conversion" }));
  };

  if (extracted.wordCount < 150) {
    add({
      checkId: "conv-thin-content",
      severity: "high",
      title: "The page has almost no substantive content",
      why: "Visitors cannot tell what the page covers, and search engines have little evidence of expertise.",
      fix: "Add concrete detail — what the page covers, examples or evidence, and answers to common questions.",
      evidence: `${extracted.wordCount} words of primary content were found.`,
      effort: "involved",
      impact: "high",
    });
  } else if (extracted.wordCount < 300) {
    add({
      checkId: "conv-thin-content",
      severity: "medium",
      title: "The page is thin on substance",
      why: "A short page may leave visitors unsure what it covers or why it matters.",
      fix: "Add a concrete example, proof point, or objection-handling section.",
      evidence: `${extracted.wordCount} words of primary content were found.`,
      effort: "moderate",
      impact: "medium",
    });
  }

  if (extracted.ctas.length === 0) {
    add({
      checkId: "conv-no-cta",
      severity: isHome ? "high" : "medium",
      title: "There is no clear call to action",
      why: "Interested visitors reach the end of the page with no obvious next step, so many leave.",
      fix: profile.ctaFix,
      evidence: "No action-oriented link or button was found on this page.",
      effort: "quick",
      impact: "high",
    });
  }

  return findings;
}
