import type { Finding, PageSnapshot } from "../types";
import { pageFinding } from "./helpers";

export const CONVERSION_PAGE_CHECKS = 2;

export function runConversionChecks(page: PageSnapshot): Finding[] {
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
      why: "Visitors cannot judge the offer, and search engines have little evidence of expertise.",
      fix: "Add specific services, proof, pricing or process detail, and answers to common questions.",
      evidence: `${extracted.wordCount} words of primary content were found.`,
      effort: "involved",
      impact: "high",
    });
  } else if (extracted.wordCount < 300) {
    add({
      checkId: "conv-thin-content",
      severity: "medium",
      title: "The page is thin on substance",
      why: "A short page may leave visitors unsure about the offer, process, and proof.",
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
      why: "Interested visitors reach the end of the page with no obvious next step, so they leave.",
      fix: "Add one primary action with a specific verb and outcome, such as “Book a same-week appointment”.",
      evidence: "No action-oriented link or button was found.",
      effort: "quick",
      impact: "high",
    });
  }

  return findings;
}
