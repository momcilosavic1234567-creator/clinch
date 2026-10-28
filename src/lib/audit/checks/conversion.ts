import { UNKNOWN_PROFILE, type BusinessProfile } from "../business";
import type { Finding, PageSnapshot } from "../types";
import { pageFinding } from "./helpers";

export const CONVERSION_PAGE_CHECKS = 2;

// A contact page is expected to be short; its job is to route an inquiry, not
// to carry long-form copy, so a low word count there is not a content defect.
const CONTACT_PATH_PATTERN =
  /\/(?:contact(?:-us)?|contacto|kontakt|contatti|get-in-touch)\/?$/i;

// Frameworks and site builders that commonly render copy in the browser, plus
// script-heavy pages, can return little text in the HTML itself.
const CLIENT_RENDERED_MARKERS = new Set([
  "React",
  "Next.js",
  "Nuxt",
  "Gatsby",
  "Framer",
  "Wix",
  "Squarespace",
  "Webflow",
]);
const SCRIPT_HEAVY_THRESHOLD = 5;

// A listing page exists to show items, not to carry prose, and the add-to-cart
// controls are what separate it from a genuinely short article on a shop.
const ADD_TO_CART_PATTERN = /\badd to (?:cart|bag)\b/i;

function isProductListing(page: PageSnapshot): boolean {
  return page.extracted.internalLinks.some((link) =>
    ADD_TO_CART_PATTERN.test(link.text),
  );
}

function mayHideClientRenderedCopy(page: PageSnapshot): boolean {
  return (
    page.extracted.techMarkers.some((marker) =>
      CLIENT_RENDERED_MARKERS.has(marker),
    ) || page.extracted.scripts.length >= SCRIPT_HEAVY_THRESHOLD
  );
}

function thinContentEvidence(page: PageSnapshot): string {
  const count = page.extracted.wordCount;
  const base = `${count} ${count === 1 ? "word was" : "words were"} extracted from the server-returned HTML.`;
  if (!mayHideClientRenderedCopy(page)) return base;
  return (
    `${base} The page loads ${page.extracted.scripts.length} scripts, so ` +
    "client-rendered copy may be missing; verify manually in a browser before " +
    "treating this as a confirmed content problem."
  );
}

export function runConversionChecks(
  page: PageSnapshot,
  profile: BusinessProfile = UNKNOWN_PROFILE,
): Finding[] {
  const findings: Finding[] = [];
  const extracted = page.extracted;
  const isHome = page.path === "/" || page.path === "";
  const isContactPage = CONTACT_PATH_PATTERN.test(page.path);
  const add = (finding: Omit<Finding, "category" | "pagePath">) => {
    findings.push(pageFinding(page, { ...finding, category: "conversion" }));
  };

  if (!isContactPage && !isProductListing(page)) {
    if (extracted.wordCount < 150) {
      add({
        checkId: "conv-thin-content",
        severity: "high",
        title: "The page has little readable text in its HTML",
        why: "The initial HTML gives search engines and visitors little context about what the page covers.",
        fix: "Add concrete detail — what the page covers, examples or evidence, and answers to common questions.",
        evidence: thinContentEvidence(page),
        effort: "involved",
        impact: "high",
      });
    } else if (extracted.wordCount < 300) {
      add({
        checkId: "conv-thin-content",
        severity: "medium",
        title: "The page is thin on readable text",
        why: "A short page may leave visitors unsure what it covers or why it matters.",
        fix: "Add a concrete example, proof point, or objection-handling section.",
        evidence: thinContentEvidence(page),
        effort: "moderate",
        impact: "medium",
      });
    }
  }

  if (extracted.ctas.length === 0 && !extracted.hasFormAction) {
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
