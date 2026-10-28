import { UNKNOWN_PROFILE, type BusinessProfile } from "../business";
import type { Finding, PageSnapshot, SiteContext } from "../types";
import { humanList, siteFinding } from "./helpers";

export const SITE_CHECKS = 7;

export function runSiteChecks(
  pages: PageSnapshot[],
  context: SiteContext,
  profile: BusinessProfile = UNKNOWN_PROFILE,
): Finding[] {
  const findings: Finding[] = [];
  if (pages.length === 0) return findings;

  let startProtocol = "https:";
  try {
    startProtocol = new URL(context.startUrl).protocol;
  } catch {
    startProtocol = "https:";
  }

  if (startProtocol !== "https:") {
    findings.push(
      siteFinding({
        checkId: "sec-https",
        category: "security",
        severity: "critical",
        title: "The site is served over plain HTTP",
        why: "Browsers mark the site “Not secure”, traffic can be intercepted, and search engines treat HTTPS as a baseline.",
        fix: "Install a TLS certificate, redirect every HTTP request to HTTPS, and update internal links and assets.",
        evidence: `${context.host} responds over http://.`,
        effort: "moderate",
        impact: "high",
        affectedPages: pages.map((page) => page.path),
      }),
    );
  }

  if (context.brokenLinks.length > 0) {
    findings.push(
      siteFinding({
        checkId: "seo-broken-links",
        category: "seo",
        severity: "high",
        title: `${context.brokenLinks.length} internal ${context.brokenLinks.length === 1 ? "link points" : "links point"} to missing pages`,
        why: "Broken paths waste the authority sent to dead ends and frustrate visitors who were ready to act.",
        fix: "Restore or redirect each missing URL to the most relevant live page.",
        evidence: context.brokenLinks
          .slice(0, 3)
          .map((link) => `${new URL(link.url).pathname} → ${link.status}`)
          .join(" · "),
        effort: "quick",
        impact: "high",
        affectedPages: Array.from(
          new Set(context.brokenLinks.flatMap((link) => link.foundOn)),
        ),
      }),
    );
  }

  const titleGroups = new Map<string, PageSnapshot[]>();
  for (const page of pages) {
    const title = page.extracted.title.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    titleGroups.set(key, [...(titleGroups.get(key) ?? []), page]);
  }
  const duplicateTitleGroup = Array.from(titleGroups.values()).find(
    (group) => group.length > 1,
  );
  if (duplicateTitleGroup) {
    findings.push(
      siteFinding({
        checkId: "seo-duplicate-titles",
        category: "seo",
        severity: "medium",
        title: "Multiple pages share the same title",
        why: "Duplicate titles make it hard for search engines and visitors to tell the pages apart.",
        fix: "Give every important page a unique title that reflects its specific intent.",
        evidence: `${duplicateTitleGroup.length} pages use the title “${duplicateTitleGroup[0].extracted.title}”.`,
        effort: "quick",
        impact: "medium",
        affectedPages: duplicateTitleGroup.map((page) => page.path),
      }),
    );
  }

  const descriptionGroups = new Map<string, PageSnapshot[]>();
  for (const page of pages) {
    const description = page.extracted.metaDescription.trim();
    if (!description) continue;
    const key = description.toLowerCase();
    descriptionGroups.set(key, [...(descriptionGroups.get(key) ?? []), page]);
  }
  const duplicateDescriptionGroup = Array.from(descriptionGroups.values()).find(
    (group) => group.length > 1,
  );
  if (duplicateDescriptionGroup) {
    findings.push(
      siteFinding({
        checkId: "seo-duplicate-descriptions",
        category: "seo",
        severity: "low",
        title: "Multiple pages share the same meta description",
        why: "Repeated snippets waste the chance to match each page's specific search intent.",
        fix: "Write a distinct, benefit-led description for every page.",
        evidence: `${duplicateDescriptionGroup.length} pages reuse the same meta description.`,
        effort: "quick",
        impact: "medium",
        affectedPages: duplicateDescriptionGroup.map((page) => page.path),
      }),
    );
  }

  if (!pages.some((page) => page.extracted.contactMethods.length > 0)) {
    findings.push(
      siteFinding({
        checkId: "conv-no-contact",
        category: "conversion",
        severity: "medium",
        title: "There is no visible way to contact the business",
        why: "A ready-to-buy visitor has to hunt for a phone number or form, and most will leave instead.",
        fix: profile.contactFix,
        evidence: "No phone, email, contact link, or booking path was found.",
        effort: "quick",
        impact: "high",
      }),
    );
  }

  if (!pages.some((page) => page.extracted.socialProof)) {
    findings.push(
      siteFinding({
        checkId: "conv-no-social-proof",
        category: "conversion",
        severity: "low",
        title: "There is no visible social proof",
        why: "Testimonials, reviews, and ratings reduce the perceived risk of choosing an unfamiliar business.",
        fix: "Add a short testimonial, a review rating, or a “trusted by” line near the primary call to action.",
        evidence: "No testimonials, reviews, ratings, or case studies were found.",
        effort: "quick",
        impact: "medium",
      }),
    );
  }

  const years = pages
    .map((page) => page.extracted.copyrightYear)
    .filter((year): year is number => year !== null);
  if (years.length > 0) {
    const newest = Math.max(...years);
    const currentYear = new Date().getFullYear();
    if (newest < currentYear - 1) {
      findings.push(
        siteFinding({
          checkId: "conv-outdated-copyright",
          category: "conversion",
          severity: "low",
          title: `The copyright still says ${newest}`,
          why: "An old date makes an active business look neglected, which undermines trust at the moment of decision.",
          fix: "Update the year automatically, or remove the year from the footer.",
          evidence: `The newest copyright year found is ${newest}; the current year is ${currentYear}.`,
          effort: "quick",
          impact: "low",
        }),
      );
    }
  }

  return findings;
}
