import type { Finding, PageSnapshot } from "../types";
import { pageFinding, plural } from "./helpers";

export const ACCESSIBILITY_PAGE_CHECKS = 10;

export function runAccessibilityChecks(page: PageSnapshot): Finding[] {
  const findings: Finding[] = [];
  const extracted = page.extracted;
  const isHome = page.path === "/" || page.path === "";

  const add = (finding: Omit<Finding, "category" | "pagePath">) => {
    findings.push(pageFinding(page, { ...finding, category: "accessibility" }));
  };

  const missingAlt = extracted.images.filter((image) => image.alt === null).length;
  if (missingAlt > 0) {
    add({
      checkId: "a11y-img-alt",
      severity: missingAlt >= 3 ? "high" : "medium",
      title: `${missingAlt} ${plural(missingAlt, "image lacks", "images lack")} alt text`,
      why: "Screen-reader users miss the content of these images, and search engines miss the context.",
      fix: "Describe informative images in alt text; use alt=\"\" for purely decorative images.",
      evidence: `${missingAlt} of ${extracted.images.length} images have no alt attribute.`,
      effort: "quick",
      impact: "high",
    });
  }

  const unlabeledFields = extracted.formFields.filter((field) => !field.hasLabel).length;
  if (unlabeledFields > 0) {
    add({
      checkId: "a11y-form-labels",
      severity: "high",
      title: `${unlabeledFields} ${plural(unlabeledFields, "form field has", "form fields have")} no label`,
      why: "Screen readers and voice-control tools cannot reliably tell people what to enter.",
      fix: "Add a visible <label for> or an aria-label to every input, select, and textarea.",
      evidence: `${unlabeledFields} of ${extracted.formFields.length} form fields lack a programmatic label.`,
      effort: "quick",
      impact: "high",
    });
  }

  if (extracted.unnamedLinks > 0) {
    add({
      checkId: "a11y-link-name",
      severity: "medium",
      title: `${extracted.unnamedLinks} ${plural(extracted.unnamedLinks, "link has", "links have")} no readable name`,
      why: "Icon-only links are announced as “link” by screen readers, so their destination is a mystery.",
      fix: "Add visible text, an aria-label, or alt text on the icon's image.",
      evidence: `${extracted.unnamedLinks} links contain no accessible text.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (extracted.unnamedButtons > 0) {
    add({
      checkId: "a11y-button-name",
      severity: "medium",
      title: `${extracted.unnamedButtons} ${plural(extracted.unnamedButtons, "button has", "buttons have")} no readable name`,
      why: "Icon-only buttons are unusable for people navigating with a screen reader or voice control.",
      fix: "Add an aria-label that describes the action, not the icon.",
      evidence: `${extracted.unnamedButtons} buttons contain no accessible text.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (!extracted.hasViewport) {
    add({
      checkId: "a11y-viewport",
      severity: "high",
      title: "The mobile viewport is not configured",
      why: "Without a viewport tag, phones zoom out to show a desktop layout and text becomes unreadable.",
      fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
      evidence: "No viewport meta tag was found.",
      effort: "quick",
      impact: "high",
    });
  }

  if (!extracted.lang) {
    add({
      checkId: "a11y-lang",
      severity: "medium",
      title: "The page language is not declared",
      why: "Assistive technology needs a language tag to pronounce and translate the page correctly.",
      fix: "Add a lang attribute to the <html> element, such as lang=\"en\".",
      evidence: "The <html> element has no lang attribute.",
      effort: "quick",
      impact: "medium",
    });
  }

  if (extracted.hasHeadingSkip) {
    add({
      checkId: "a11y-heading-skip",
      severity: "low",
      title: "Heading levels skip",
      why: "Screen-reader users navigate by headings; skipped levels make the page outline confusing.",
      fix: "Keep heading levels in order and style text with CSS instead of choosing tags by size.",
      evidence: `Heading sequence: ${extracted.headingSequence.map((level) => `H${level}`).join(" → ")}.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (extracted.tabindexPositive > 0) {
    add({
      checkId: "a11y-tabindex",
      severity: "low",
      title: "Positive tabindex values override natural focus order",
      why: "Keyboard focus can jump unpredictably and leave people lost on the page.",
      fix: "Remove positive tabindex values and follow DOM order instead.",
      evidence: `${extracted.tabindexPositive} elements use a positive tabindex.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (isHome && !extracted.hasSkipLink) {
    add({
      checkId: "a11y-skip-link",
      severity: "low",
      title: "There is no skip-to-content link",
      why: "Keyboard users must tab through the entire navigation to reach the page content.",
      fix: "Add a visually hidden “Skip to content” link as the first focusable element.",
      evidence: "No skip link was found.",
      effort: "quick",
      impact: "medium",
    });
  }

  if (extracted.ambiguousLinks > 0) {
    add({
      checkId: "a11y-ambiguous-links",
      severity: "low",
      title: "Several links have vague names",
      why: "“Read more” and “Click here” give screen-reader users no context when links are read out of order.",
      fix: "Make link text describe the destination, or add an aria-label with the missing context.",
      evidence: `${extracted.ambiguousLinks} links use generic text.`,
      effort: "quick",
      impact: "low",
    });
  }

  return findings;
}
