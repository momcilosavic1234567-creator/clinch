import type { Finding, PageSnapshot } from "../types";
import { pageFinding, humanList } from "./helpers";

export const PERFORMANCE_PAGE_CHECKS = 9;

function formatMb(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function runPerformanceChecks(page: PageSnapshot): Finding[] {
  const findings: Finding[] = [];
  const extracted = page.extracted;
  const htmlKb = Math.round(page.bodyBytes / 1024);

  const add = (finding: Omit<Finding, "category" | "pagePath">) => {
    findings.push(pageFinding(page, { ...finding, category: "performance" }));
  };

  if (page.bodyBytes > 250_000) {
    add({
      checkId: "perf-html-size",
      severity: "high",
      title: `The HTML alone weighs ${htmlKb} KB`,
      why: "Every visitor must download and parse this before the page can render, especially on mobile.",
      fix: "Move inline styles and scripts into cached files, and remove unused markup and page-builder bloat.",
      evidence: `The raw HTML response is ${htmlKb} KB.`,
      effort: "moderate",
      impact: "high",
    });
  } else if (page.bodyBytes > 120_000) {
    add({
      checkId: "perf-html-size",
      severity: "medium",
      title: `The HTML weighs ${htmlKb} KB`,
      why: "A heavy HTML document delays first paint and repeats on every page view.",
      fix: "Trim unused markup and move embedded CSS/JS into cached assets.",
      evidence: `The raw HTML response is ${htmlKb} KB.`,
      effort: "moderate",
      impact: "medium",
    });
  }

  if (page.assetBytes !== null && page.assetCount > 0) {
    const total = page.assetBytes + page.bodyBytes;
    if (total > 6_000_000) {
      add({
        checkId: "perf-page-weight",
        severity: "high",
        title: `The page loads about ${formatMb(total)}`,
        why: "Large pages drain mobile data and load slowly on the connections many customers actually use.",
        fix: "Compress and resize images, use WebP/AVIF, lazy-load below-the-fold media, and remove unused libraries.",
        evidence: `${formatMb(total)} across ${page.assetCount} resources measured on the homepage.`,
        effort: "moderate",
        impact: "high",
      });
    } else if (total > 3_000_000) {
      add({
        checkId: "perf-page-weight",
        severity: "medium",
        title: `The page loads about ${formatMb(total)}`,
        why: "Page weight is a visible drag on mobile conversion and Core Web Vitals.",
        fix: "Compress hero imagery, lazy-load below-the-fold media, and audit third-party scripts.",
        evidence: `${formatMb(total)} across ${page.assetCount} resources measured on the homepage.`,
        effort: "moderate",
        impact: "high",
      });
    }
  }

  const blocking = extracted.scripts.filter((script) => script.blocking).length;
  if (blocking > 0) {
    add({
      checkId: "perf-blocking-scripts",
      severity: blocking > 3 ? "high" : "medium",
      title: `${blocking} ${blocking === 1 ? "script blocks" : "scripts block"} rendering`,
      why: "Parser-blocking JavaScript in the head delays every visible element behind network requests.",
      fix: "Add defer or async, or move non-critical scripts out of the head.",
      evidence: `${blocking} scripts load synchronously from the document head.`,
      effort: "quick",
      impact: "high",
    });
  }

  if (extracted.scripts.length > 25) {
    add({
      checkId: "perf-script-count",
      severity: "high",
      title: `${extracted.scripts.length} separate scripts load on this page`,
      why: "Each request adds network overhead and coordination work on low-end phones.",
      fix: "Remove unused tags, consolidate libraries, and let the tag manager own third-party tools.",
      evidence: `${extracted.scripts.length} external scripts were found.`,
      effort: "involved",
      impact: "high",
    });
  } else if (extracted.scripts.length > 12) {
    add({
      checkId: "perf-script-count",
      severity: "medium",
      title: `${extracted.scripts.length} separate scripts load on this page`,
      why: "Many scripts compete for bandwidth and main-thread time, even when each one is small.",
      fix: "Audit the tags actually needed and consolidate or remove the rest.",
      evidence: `${extracted.scripts.length} external scripts were found.`,
      effort: "moderate",
      impact: "medium",
    });
  }

  if (extracted.externalScriptDomains.length > 4) {
    add({
      checkId: "perf-third-party-scripts",
      severity: "low",
      title: "Scripts come from many third-party domains",
      why: "Each extra domain costs a DNS lookup and connection, and widens the privacy and reliability surface.",
      fix: "Audit third-party tags and remove anything that is not actively used.",
      evidence: `${extracted.externalScriptDomains.length} external script domains: ${humanList(extracted.externalScriptDomains, 4)}.`,
      effort: "moderate",
      impact: "medium",
    });
  }

  const imageCount = extracted.images.length;
  const missingDimensions = extracted.images.filter((image) => !image.hasDimensions).length;
  if (imageCount >= 3 && missingDimensions / imageCount > 0.3) {
    add({
      checkId: "perf-image-dimensions",
      severity: missingDimensions / imageCount > 0.6 ? "high" : "medium",
      title: "Most images have no width or height",
      why: "The browser cannot reserve space, so the layout jumps as images arrive and hurts Core Web Vitals.",
      fix: "Add width and height attributes (or a CSS aspect-ratio) to every image.",
      evidence: `${missingDimensions} of ${imageCount} images have no dimensions.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (imageCount >= 5 && extracted.lazyImages / imageCount < 0.5) {
    add({
      checkId: "perf-lazy-images",
      severity: "low",
      title: "Most images load eagerly",
      why: "Below-the-fold images compete with the hero and delay the content customers came to see.",
      fix: "Add loading=\"lazy\" to images below the first viewport; keep the hero eager.",
      evidence: `${extracted.lazyImages} of ${imageCount} images use lazy loading.`,
      effort: "quick",
      impact: "medium",
    });
  }

  if (page.ttfbMs > 3000) {
    add({
      checkId: "perf-ttfb",
      severity: "high",
      title: `The server took ${(page.ttfbMs / 1000).toFixed(1)}s to respond`,
      why: "Nothing can render until the server responds; a slow first byte caps the experience for everyone.",
      fix: "Add page caching or a CDN, and profile slow plugins or database queries.",
      evidence: `Measured time to first byte: ${Math.round(page.ttfbMs)} ms.`,
      effort: "involved",
      impact: "high",
    });
  } else if (page.ttfbMs > 1500) {
    add({
      checkId: "perf-ttfb",
      severity: "medium",
      title: `The server took ${(page.ttfbMs / 1000).toFixed(1)}s to respond`,
      why: "A slow first byte delays every asset and is often the largest performance win available.",
      fix: "Introduce page caching or a CDN, and investigate slow queries or plugins.",
      evidence: `Measured time to first byte: ${Math.round(page.ttfbMs)} ms.`,
      effort: "moderate",
      impact: "high",
    });
  }

  if (extracted.stylesheets > 4) {
    add({
      checkId: "perf-stylesheets",
      severity: "low",
      title: `${extracted.stylesheets} separate stylesheets delay rendering`,
      why: "Each stylesheet is render-blocking and many are mostly unused.",
      fix: "Bundle critical CSS, defer the rest, and remove unused framework styles.",
      evidence: `${extracted.stylesheets} stylesheet links were found.`,
      effort: "moderate",
      impact: "medium",
    });
  }

  return findings;
}
