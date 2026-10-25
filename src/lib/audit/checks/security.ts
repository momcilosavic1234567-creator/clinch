import type { Finding, PageSnapshot } from "../types";
import { pageFinding, humanList } from "./helpers";

export const SECURITY_PAGE_CHECKS = 9;

function hasHeader(page: PageSnapshot, name: string): boolean {
  const value = page.headers[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function runSecurityChecks(page: PageSnapshot): Finding[] {
  const findings: Finding[] = [];
  const extracted = page.extracted;
  const isHttps = new URL(page.url).protocol === "https:";

  const add = (finding: Omit<Finding, "category" | "pagePath">) => {
    findings.push(pageFinding(page, { ...finding, category: "security" }));
  };

  if (isHttps && !hasHeader(page, "strict-transport-security")) {
    add({
      checkId: "sec-hsts",
      severity: "medium",
      title: "HSTS is not enabled",
      why: "Without HSTS, a first visit can be downgraded from HTTPS to HTTP and exposed to interception.",
      fix: "Send Strict-Transport-Security with a long max-age after confirming every subdomain supports HTTPS.",
      evidence: "The Strict-Transport-Security header is missing.",
      effort: "quick",
      impact: "medium",
    });
  }

  if (!hasHeader(page, "content-security-policy")) {
    add({
      checkId: "sec-csp",
      severity: "medium",
      title: "There is no Content Security Policy",
      why: "A CSP limits the damage from injected scripts, the most common serious web vulnerability.",
      fix: "Start with a report-only policy, then enforce a strict allowlist for scripts, styles, and frames.",
      evidence: "The Content-Security-Policy header is missing.",
      effort: "involved",
      impact: "high",
    });
  }

  if (!hasHeader(page, "x-content-type-options")) {
    add({
      checkId: "sec-xcto",
      severity: "low",
      title: "MIME sniffing is not disabled",
      why: "Browsers may execute a file as a different type than intended, turning uploads into script.",
      fix: "Send X-Content-Type-Options: nosniff on every response.",
      evidence: "The X-Content-Type-Options header is missing.",
      effort: "quick",
      impact: "medium",
    });
  }

  const csp = (page.headers["content-security-policy"] ?? "").toLowerCase();
  const hasFrameAncestors = csp.includes("frame-ancestors");
  if (!hasHeader(page, "x-frame-options") && !hasFrameAncestors) {
    add({
      checkId: "sec-frame",
      severity: "medium",
      title: "The site can be framed by another origin",
      why: "Without clickjacking protection, another site can embed the page and trick visitors into clicking.",
      fix: "Send X-Frame-Options: DENY or add frame-ancestors 'none' to the CSP.",
      evidence: "Neither X-Frame-Options nor CSP frame-ancestors is set.",
      effort: "quick",
      impact: "medium",
    });
  }

  if (!hasHeader(page, "referrer-policy")) {
    add({
      checkId: "sec-referrer",
      severity: "low",
      title: "The referrer policy is undefined",
      why: "Full URLs can leak to third parties through the Referer header, including sensitive query strings.",
      fix: "Send Referrer-Policy: strict-origin-when-cross-origin.",
      evidence: "The Referrer-Policy header is missing.",
      effort: "quick",
      impact: "low",
    });
  }

  if (!hasHeader(page, "permissions-policy")) {
    add({
      checkId: "sec-permissions",
      severity: "low",
      title: "Browser features are not restricted",
      why: "Third-party scripts can request camera, microphone, or location access the site never needs.",
      fix: "Send a Permissions-Policy that disables unused features.",
      evidence: "The Permissions-Policy header is missing.",
      effort: "quick",
      impact: "low",
    });
  }

  if (extracted.mixedContent.length > 0) {
    add({
      checkId: "sec-mixed-content",
      severity: "high",
      title: "Some resources load over insecure HTTP",
      why: "Mixed content can be blocked by browsers and lets an attacker tamper with assets on an otherwise secure page.",
      fix: "Serve every image, script, stylesheet, and frame over HTTPS.",
      evidence: `Insecure resources: ${humanList(extracted.mixedContent)}.`,
      effort: "quick",
      impact: "high",
    });
  }

  if (extracted.insecureFormActions > 0) {
    add({
      checkId: "sec-insecure-form",
      severity: "critical",
      title: "A form submits over insecure HTTP",
      why: "Names, emails, and messages can be intercepted or altered before they reach the business.",
      fix: "Point the form action at an HTTPS endpoint and redirect all HTTP traffic to HTTPS.",
      evidence: `${extracted.insecureFormActions} form actions use http://.`,
      effort: "quick",
      impact: "high",
    });
  }

  const server = (page.headers["server"] ?? "").trim();
  if (server && /[\/\d]/.test(server)) {
    add({
      checkId: "sec-server-disclosure",
      severity: "low",
      title: "The server reveals its software version",
      why: "Version numbers help attackers target known vulnerabilities and add no value for visitors.",
      fix: "Hide server tokens and version strings at the server or CDN layer.",
      evidence: `The Server header exposes “${server}”.`,
      effort: "quick",
      impact: "low",
    });
  }

  return findings;
}
