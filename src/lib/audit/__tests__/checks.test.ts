import { describe, expect, it } from "vitest";
import { extractPage } from "@/lib/audit/extract";
import { runAccessibilityChecks } from "@/lib/audit/checks/accessibility";
import { runConversionChecks } from "@/lib/audit/checks/conversion";
import { runPerformanceChecks } from "@/lib/audit/checks/performance";
import { runSecurityChecks } from "@/lib/audit/checks/security";
import { runSeoChecks } from "@/lib/audit/checks/seo";
import { runSiteChecks } from "@/lib/audit/checks/site";
import type {
  PageSnapshot,
  SiteContext,
} from "@/lib/audit/types";

interface PageOptions {
  url?: string;
  headers?: Record<string, string>;
  ttfbMs?: number;
  assetBytes?: number | null;
  assetCount?: number;
  status?: number;
}

function makePage(html: string, options: PageOptions = {}): PageSnapshot {
  const url = options.url ?? "https://example.com/";
  const headers = Object.fromEntries(
    Object.entries(options.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
  );
  return {
    url,
    path: new URL(url).pathname,
    status: options.status ?? 200,
    finalUrl: url,
    headers,
    bodyBytes: Buffer.byteLength(html),
    ttfbMs: options.ttfbMs ?? 200,
    assetBytes: options.assetBytes ?? null,
    assetCount: options.assetCount ?? 0,
    extracted: extractPage(html, url),
  };
}

function makeContext(
  pages: PageSnapshot[],
  overrides: Partial<SiteContext> = {},
): SiteContext {
  return {
    inputUrl: pages[0]?.url ?? "https://example.com/",
    startUrl: pages[0]?.url ?? "https://example.com/",
    origin: "https://example.com",
    host: "example.com",
    pagesCrawled: pages.length,
    brokenLinks: [],
    linkChecks: 0,
    homepageAssetBytes: pages[0]?.assetBytes ?? null,
    homepageAssetCount: pages[0]?.assetCount ?? 0,
    ...overrides,
  };
}

const SECURE_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "content-security-policy": "default-src 'self'",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=()",
};

const GOOD_HTML = `<!doctype html>
<html lang="en">
<head>
  <title>Family Dentist in North Portland | Northwind Dental</title>
  <meta name="description" content="Gentle family and cosmetic dentistry in North Portland. Same-week appointments, clear pricing, and a team that explains every step.">
  <link rel="canonical" href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="Northwind Dental">
  <meta property="og:description" content="Dentistry that feels human.">
  <meta property="og:image" content="/og.jpg">
  <script type="application/ld+json">{"@context":"https://schema.org"}</script>
</head>
<body>
  <a href="#main">Skip to content</a>
  <nav><a href="/services">Services</a></nav>
  <main id="main">
    <h1>Dentistry that feels human</h1>
    <p>${"Comfortable, clearly explained care for the whole family. ".repeat(40)}</p>
    <a href="/contact">Book an appointment</a>
    <a href="mailto:hello@northwind.com">Email us</a>
    <img src="/team.jpg" alt="The Northwind care team" width="800" height="600">
    <p>Rated 4.9 by more than 200 patients.</p>
    <p>© ${new Date().getFullYear()} Northwind Dental</p>
  </main>
</body>
</html>`;

const ids = (findings: Array<{ checkId: string }>) => findings.map((finding) => finding.checkId);

describe("SEO checks", () => {
  it("flags a page with no search metadata", () => {
    const result = runSeoChecks(makePage("<html><body><p>Hello</p></body></html>"));
    expect(ids(result)).toEqual(
      expect.arrayContaining([
        "seo-title-missing",
        "seo-meta-missing",
        "seo-h1-missing",
        "seo-canonical-missing",
        "seo-og-incomplete",
        "seo-structured-data-missing",
      ]),
    );
  });

  it("leaves a well-formed page alone", () => {
    const result = runSeoChecks(
      makePage(GOOD_HTML, { headers: SECURE_HEADERS }),
    );
    expect(ids(result)).not.toEqual(
      expect.arrayContaining([
        "seo-title-missing",
        "seo-meta-missing",
        "seo-h1-missing",
        "seo-canonical-missing",
        "seo-og-incomplete",
        "seo-structured-data-missing",
      ]),
    );
  });

  it("flags title length and multiple H1s", () => {
    const result = runSeoChecks(
      makePage(
        "<html lang='en'><head><title>Dental</title><meta name='description' content='short'><meta property='og:title' content='x'><meta property='og:image' content='x'></head><body><h1>One</h1><h1>Two</h1></body></html>",
      ),
    );
    expect(ids(result)).toEqual(
      expect.arrayContaining(["seo-title-short", "seo-h1-multiple", "seo-meta-short"]),
    );
  });

  it("flags noindex pages", () => {
    const result = runSeoChecks(
      makePage(
        "<html lang='en'><head><title>Hidden page in the site</title><meta name='robots' content='noindex'><meta name='description' content='This page is intentionally excluded from search engines for a specific campaign reason.'></head><body><h1>Hidden</h1></body></html>",
      ),
    );
    expect(ids(result)).toContain("seo-noindex");
  });

  it("flags generic homepage titles", () => {
    const result = runSeoChecks(
      makePage(
        "<html lang='en'><head><title>Home</title><meta name='description' content='A description that is long enough to avoid the short-content warning here.'><meta property='og:title' content='x'><meta property='og:image' content='x'></head><body><h1>Welcome</h1></body></html>",
      ),
    );
    expect(ids(result)).toContain("seo-home-title-generic");
  });
});

describe("accessibility checks", () => {
  it("catches images, forms, labels, and structure issues", () => {
    const result = runAccessibilityChecks(
      makePage(
        "<html><head></head><body><h1>Hi</h1><h3>Skip</h3><img src='/a.png'><img src='/b.png'><img src='/c.png'><form><input name='email'></form><a href='/x'><svg></svg></a><button><svg></svg></button><div tabindex='3'>x</div><a href='/blog'>Read more</a></body></html>",
      ),
    );
    expect(ids(result)).toEqual(
      expect.arrayContaining([
        "a11y-img-alt",
        "a11y-form-labels",
        "a11y-link-name",
        "a11y-button-name",
        "a11y-viewport",
        "a11y-lang",
        "a11y-heading-skip",
        "a11y-tabindex",
        "a11y-skip-link",
        "a11y-ambiguous-links",
      ]),
    );
  });

  it("passes a page with accessible structure", () => {
    const result = runAccessibilityChecks(
      makePage(GOOD_HTML, { headers: SECURE_HEADERS }),
    );
    expect(ids(result)).toHaveLength(0);
  });
});

describe("performance checks", () => {
  it("flags heavy, slow, script-laden pages", () => {
    const head = Array.from(
      { length: 14 },
      (_, index) => `<script src="https://cdn${index}.example.net/app.js"></script>`,
    ).join("");
    const styles = Array.from(
      { length: 5 },
      (_, index) => `<link rel="stylesheet" href="/style-${index}.css">`,
    ).join("");
    const images = Array.from(
      { length: 6 },
      (_, index) => `<img src="/img-${index}.jpg">`,
    ).join("");

    const result = runPerformanceChecks(
      makePage(`<html><head>${head}${styles}</head><body>${images}<p>${"x".repeat(130000)}</p></body></html>`, {
        ttfbMs: 2000,
        assetBytes: 4_000_000,
        assetCount: 30,
      }),
    );

    expect(ids(result)).toEqual(
      expect.arrayContaining([
        "perf-html-size",
        "perf-page-weight",
        "perf-blocking-scripts",
        "perf-script-count",
        "perf-third-party-scripts",
        "perf-image-dimensions",
        "perf-lazy-images",
        "perf-ttfb",
        "perf-stylesheets",
      ]),
    );
  });

  it("does not flag a light, fast page", () => {
    const result = runPerformanceChecks(
      makePage(GOOD_HTML, {
        headers: SECURE_HEADERS,
        ttfbMs: 120,
        assetBytes: 600_000,
        assetCount: 8,
      }),
    );
    expect(ids(result)).toHaveLength(0);
  });
});

describe("security checks", () => {
  it("flags missing headers, mixed content, and unsafe forms", () => {
    const result = runSecurityChecks(
      makePage(
        "<html><head></head><body><img src='http://insecure.example.com/pixel.png'><form action='http://insecure.example.com/send'><input aria-label='Email'></form></body></html>",
        { headers: { server: "nginx/1.25.3" } },
      ),
    );

    expect(ids(result)).toEqual(
      expect.arrayContaining([
        "sec-hsts",
        "sec-csp",
        "sec-xcto",
        "sec-frame",
        "sec-referrer",
        "sec-permissions",
        "sec-mixed-content",
        "sec-insecure-form",
        "sec-server-disclosure",
      ]),
    );
  });

  it("passes a page with a hardened header set", () => {
    const result = runSecurityChecks(
      makePage(GOOD_HTML, { headers: SECURE_HEADERS }),
    );
    expect(ids(result)).toHaveLength(0);
  });

  it("accepts frame-ancestors as clickjacking protection", () => {
    const result = runSecurityChecks(
      makePage(GOOD_HTML, {
        headers: {
          ...SECURE_HEADERS,
          "x-frame-options": "",
          "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
        },
      }),
    );
    expect(ids(result)).not.toContain("sec-frame");
  });
});

describe("conversion checks", () => {
  it("flags thin pages without a call to action", () => {
    const result = runConversionChecks(makePage("<html><body><h1>Hi</h1><p>Too little.</p></body></html>"));
    expect(ids(result)).toEqual(
      expect.arrayContaining(["conv-thin-content", "conv-no-cta"]),
    );
  });

  it("passes a clear, substantive page", () => {
    const result = runConversionChecks(
      makePage(GOOD_HTML, { headers: SECURE_HEADERS }),
    );
    expect(ids(result)).toHaveLength(0);
  });
});

describe("site checks", () => {
  it("finds duplicates, broken links, HTTP, missing contact, proof, and stale copyright", () => {
    const first = makePage(
      "<html lang='en'><head><title>Northwind Dental</title><meta name='description' content='The same description that appears on every page of this particular website.'></head><body><h1>One</h1><p>© 2020</p></body></html>",
      { url: "http://example.com/" },
    );
    const second = makePage(
      "<html lang='en'><head><title>Northwind Dental</title><meta name='description' content='The same description that appears on every page of this particular website.'></head><body><h1>Two</h1></body></html>",
      { url: "http://example.com/about" },
    );
    const context = makeContext([first, second], {
      origin: "http://example.com",
      brokenLinks: [
        { url: "http://example.com/old-page", status: 404, foundOn: ["/", "/about"] },
      ],
      linkChecks: 4,
    });

    const result = runSiteChecks([first, second], context);
    expect(ids(result)).toEqual(
      expect.arrayContaining([
        "sec-https",
        "seo-broken-links",
        "seo-duplicate-titles",
        "seo-duplicate-descriptions",
        "conv-no-contact",
        "conv-no-social-proof",
        "conv-outdated-copyright",
      ]),
    );
  });

  it("passes pages that share no problems", () => {
    const first = makePage(GOOD_HTML, { headers: SECURE_HEADERS });
    const second = makePage(
      GOOD_HTML.replace("Northwind Dental</title>", "Our Team | Northwind Dental</title>")
        .replace(
          "Gentle family and cosmetic dentistry in North Portland.",
          "Meet the dentists and hygienists behind Northwind Dental.",
        )
        .replace("<h1>Dentistry that feels human</h1>", "<h1>Meet the team</h1>"),
      {
        url: "https://example.com/team",
        headers: SECURE_HEADERS,
      },
    );
    const result = runSiteChecks(
      [first, second],
      makeContext([first, second]),
    );
    expect(ids(result)).toHaveLength(0);
  });
});
