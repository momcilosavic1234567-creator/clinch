import type { Finding, PageSnapshot } from "../types";
import { pageFinding } from "./helpers";

export const SEO_PAGE_CHECKS = 12;

export function runSeoChecks(page: PageSnapshot): Finding[] {
  const findings: Finding[] = [];
  const extracted = page.extracted;
  const title = extracted.title;
  const description = extracted.metaDescription;
  const isHome = page.path === "/" || page.path === "";

  const add = (finding: Omit<Finding, "category" | "pagePath">) => {
    findings.push(
      pageFinding(page, {
        ...finding,
        category: "seo",
      }),
    );
  };

  if (!title) {
    add({
      checkId: "seo-title-missing",
      severity: "critical",
      title: "The page has no title tag",
      why: "Search results and browser tabs have nothing to identify the page, which suppresses clicks even when it ranks.",
      fix: "Add a unique 30–60 character title that names the page's main subject and who it is for.",
      evidence: "No <title> element was found.",
      effort: "quick",
      impact: "high",
    });
  } else if (title.length < 15) {
    add({
      checkId: "seo-title-short",
      severity: "low",
      title: "The title is too short to describe the page",
      why: "Short titles waste valuable search-result space that could explain what the page offers and who it is for.",
      fix: "Expand the title to 30–60 characters, leading with the page's main subject and its audience.",
      evidence: `The title is ${title.length} characters: “${title}”.`,
      effort: "quick",
      impact: "medium",
    });
  } else if (title.length > 60) {
    add({
      checkId: "seo-title-long",
      severity: "medium",
      title: "The title is likely to be truncated in search results",
      why: "Google typically cuts titles around 60 characters, hiding the differentiating part of the message.",
      fix: "Tighten the title to 60 characters or fewer, keeping the main subject first.",
      evidence: `The title is ${title.length} characters: “${title}”.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (isHome && title && /^(home|homepage|welcome|index|untitled)$/i.test(title.trim())) {
    add({
      checkId: "seo-home-title-generic",
      severity: "low",
      title: "The homepage title is generic",
      why: "The homepage carries the most search weight, but “Home” tells neither people nor search engines what the business does.",
      fix: "Lead with what the site does and who it serves instead of “Home”.",
      evidence: `The homepage title is “${title}”.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (!description) {
    add({
      checkId: "seo-meta-missing",
      severity: "high",
      title: "There is no meta description",
      why: "Google will write its own snippet, so the page loses control of how it is described in search results.",
      fix: "Write a 120–155 character summary of what the page offers and why it is worth visiting.",
      evidence: "No meta description was found.",
      effort: "quick",
      impact: "high",
    });
  } else if (description.length < 50) {
    add({
      checkId: "seo-meta-short",
      severity: "low",
      title: "The meta description is too short",
      why: "A thin snippet leaves room for competitors and less reason for a searcher to choose this result.",
      fix: "Expand the description to 120–155 characters with a concrete benefit and what to do next.",
      evidence: `The meta description is ${description.length} characters.`,
      effort: "quick",
      impact: "medium",
    });
  } else if (description.length > 160) {
    add({
      checkId: "seo-meta-long",
      severity: "low",
      title: "The meta description is likely to be truncated",
      why: "Search engines usually cut descriptions after roughly 160 characters, hiding the call to action.",
      fix: "Trim the description to 155 characters or fewer and put the strongest benefit first.",
      evidence: `The meta description is ${description.length} characters.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (extracted.h1Count === 0) {
    add({
      checkId: "seo-h1-missing",
      severity: "high",
      title: "The page has no H1 heading",
      why: "Visitors and search engines lose the page's main topic in the first scan.",
      fix: "Add exactly one descriptive H1 that states the service and the audience.",
      evidence: "No <h1> element was found.",
      effort: "quick",
      impact: "high",
    });
  } else if (extracted.h1Count > 1) {
    add({
      checkId: "seo-h1-multiple",
      severity: "medium",
      title: "The page has multiple H1 headings",
      why: "Competing H1s blur the primary topic and make the page harder to scan.",
      fix: "Keep one H1 for the page's main promise and demote the rest to H2/H3.",
      evidence: `${extracted.h1Count} H1 elements were found.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (extracted.hasNoIndex) {
    add({
      checkId: "seo-noindex",
      severity: "high",
      title: "This page is hidden from search engines",
      why: "A noindex directive explicitly removes the page from search results, so no amount of content will rank.",
      fix: "Remove the noindex directive if this page should attract organic traffic.",
      evidence: `The robots meta tag is “${extracted.robotsMeta}”.`,
      effort: "quick",
      impact: "high",
    });
  }

  if (!extracted.canonicalUrl) {
    add({
      checkId: "seo-canonical-missing",
      severity: "low",
      title: "There is no canonical URL",
      why: "Without a canonical, tracking parameters and duplicate paths can split ranking signals.",
      fix: "Add a self-referencing canonical link pointing to the preferred URL.",
      evidence: "No canonical link was found.",
      effort: "quick",
      impact: "low",
    });
  }

  if (!extracted.ogTitle || !extracted.ogImage) {
    const missing = [
      !extracted.ogTitle ? "og:title" : null,
      !extracted.ogImage ? "og:image" : null,
    ].filter(Boolean);
    add({
      checkId: "seo-og-incomplete",
      severity: "low",
      title: "Social share previews are incomplete",
      why: "Links shared in email, Slack, or social feeds will look unfinished and earn fewer clicks.",
      fix: "Add og:title, og:description, and a 1200×630 og:image.",
      evidence: `Missing ${missing.join(" and ")}.`,
      effort: "quick",
      impact: "low",
    });
  }

  if (isHome && !extracted.hasStructuredData) {
    add({
      checkId: "seo-structured-data-missing",
      severity: "low",
      title: "No structured data for search engines",
      why: "Without schema markup, search engines lack explicit details about the organisation or person behind the site.",
      fix: "Add appropriate JSON-LD — for example Organization for a company or Person for a personal site — with the name, description, and relevant profile links.",
      evidence: "No application/ld+json block was found.",
      effort: "moderate",
      impact: "medium",
    });
  }

  return findings;
}
