import { describe, expect, it } from "vitest";
import { parseRobotsTxt } from "@/lib/audit/robots";

const UA = "ClinchAuditBot/1.0";

describe("parseRobotsTxt", () => {
  it("allows everything when robots.txt is empty", () => {
    expect(parseRobotsTxt("", UA).isAllowed("/anything")).toBe(true);
  });

  it("blocks the root when the wildcard group disallows it", () => {
    const rules = parseRobotsTxt("User-agent: *\nDisallow: /", UA);
    expect(rules.isAllowed("/")).toBe(false);
    expect(rules.isAllowed("/services")).toBe(false);
  });

  it("lets a longer Allow rule beat Disallow", () => {
    const rules = parseRobotsTxt(
      ["User-agent: *", "Disallow: /private", "Allow: /private/public"].join("\n"),
      UA,
    );
    expect(rules.isAllowed("/private/secret")).toBe(false);
    expect(rules.isAllowed("/private/public")).toBe(true);
  });

  it("prefers the specific user-agent group over the wildcard group", () => {
    const rules = parseRobotsTxt(
      [
        "User-agent: *",
        "Disallow: /",
        "",
        "User-agent: ClinchAuditBot",
        "Disallow: /admin",
      ].join("\n"),
      UA,
    );
    expect(rules.isAllowed("/services")).toBe(true);
    expect(rules.isAllowed("/admin/settings")).toBe(false);
  });

  it("supports wildcards and end anchors", () => {
    const rules = parseRobotsTxt(
      ["User-agent: *", "Disallow: /private/*.pdf$"].join("\n"),
      UA,
    );
    expect(rules.isAllowed("/private/pricing.pdf")).toBe(false);
    expect(rules.isAllowed("/private/pricing.pdf.html")).toBe(true);
    expect(rules.isAllowed("/private/page")).toBe(true);
  });

  it("ignores comments and empty directives", () => {
    const rules = parseRobotsTxt(
      ["# hello", "User-agent: *", "Disallow:", "Disallow: # nothing"].join("\n"),
      UA,
    );
    expect(rules.isAllowed("/")).toBe(true);
  });

  it("supports multiple user-agent lines sharing a group", () => {
    const rules = parseRobotsTxt(
      ["User-agent: Googlebot", "User-agent: ClinchAuditBot", "Disallow: /preview"].join("\n"),
      UA,
    );
    expect(rules.isAllowed("/preview")).toBe(false);
    expect(rules.isAllowed("/")).toBe(true);
  });

  it("collects sitemap directives", () => {
    const rules = parseRobotsTxt(
      ["Sitemap: https://example.com/sitemap.xml", "User-agent: *", "Allow: /"].join("\n"),
      UA,
    );
    expect(rules.sitemaps).toEqual(["https://example.com/sitemap.xml"]);
  });
});
