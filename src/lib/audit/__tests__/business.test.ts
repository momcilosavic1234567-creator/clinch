import { describe, expect, it } from "vitest";
import { detectBusinessProfile, UNKNOWN_PROFILE } from "@/lib/audit/business";
import { runConversionChecks } from "@/lib/audit/checks/conversion";
import { runSiteChecks } from "@/lib/audit/checks/site";
import { composeAudit } from "@/lib/audit/compose";
import { extractPage } from "@/lib/audit/extract";
import type { PageSnapshot, SiteContext } from "@/lib/audit/types";

function makePage(html: string, url = "https://example.com/"): PageSnapshot {
  return {
    url,
    path: new URL(url).pathname,
    status: 200,
    finalUrl: url,
    headers: {},
    bodyBytes: Buffer.byteLength(html),
    ttfbMs: 200,
    assetBytes: null,
    assetCount: 0,
    extracted: extractPage(html, url),
  };
}

function makeContext(pages: PageSnapshot[]): SiteContext {
  return {
    inputUrl: pages[0]?.url ?? "https://example.com/",
    startUrl: pages[0]?.url ?? "https://example.com/",
    origin: "https://example.com",
    host: "example.com",
    pagesCrawled: pages.length,
    brokenLinks: [],
    linkChecks: 0,
    homepageAssetBytes: null,
    homepageAssetCount: 0,
  };
}

function page(html: string): PageSnapshot {
  return makePage(
    `<html lang="en"><head>${html}</head><body><p>${"Content. ".repeat(80)}</p></body></html>`,
  );
}

function ctaFixFor(pageSnapshot: PageSnapshot): string {
  const profile = detectBusinessProfile([pageSnapshot]);
  const finding = runConversionChecks(pageSnapshot, profile).find(
    (item) => item.checkId === "conv-no-cta",
  );
  expect(finding).toBeDefined();
  return finding!.fix;
}

describe("business type detection", () => {
  it("recognises a dental practice and recommends booking an appointment", () => {
    const dental = page(
      `<title>Northwind Family Dental | Portland Dentist</title>
       <meta name="description" content="Family and cosmetic dentistry in North Portland.">`,
    );

    expect(detectBusinessProfile([dental]).type).toBe("healthcare");
    expect(ctaFixFor(dental)).toContain("Book an appointment");
  });

  it("recognises a SaaS product and recommends a trial or demo", () => {
    const saas = page(
      `<title>Acme — Workflow automation software</title>
       <meta name="description" content="Acme is software for operations teams. Start a free trial.">`,
    );

    expect(detectBusinessProfile([saas]).type).toBe("software");
    expect(ctaFixFor(saas)).toContain("free trial");
  });

  it("recognises a Shopify store and recommends shopping", () => {
    const store = page(
      `<title>Trailhead Supply</title>
       <meta name="description" content="Outdoor gear built for the shoulder season.">
       <script src="https://cdn.shopify.com/s/files/theme.js"></script>`,
    );

    expect(detectBusinessProfile([store]).type).toBe("ecommerce");
    expect(ctaFixFor(store)).toContain("Shop the collection");
  });

  it("recognises a shop from its storefront navigation without a platform marker", () => {
    const shop = makePage(
      `<html lang="en"><head>
         <title>Trailhead Supply</title>
         <meta name="description" content="Jackets, packs, and boots for the shoulder season. Free shipping over €80.">
       </head><body>
         <nav><a href="/collections/all">Collections</a><a href="/cart">Shopping cart</a></nav>
         <p>${"Built for the shoulder season. ".repeat(20)}</p>
       </body></html>`,
    );

    expect(detectBusinessProfile([shop]).type).toBe("ecommerce");
    expect(ctaFixFor(shop)).toContain("Shop the collection");
  });

  it("recognises a restaurant and recommends a table reservation", () => {
    const restaurant = makePage(
      `<html lang="en"><head>
         <title>Osteria Rossi | Italian restaurant in Brooklyn</title>
         <meta name="description" content="Seasonal Italian cuisine and a short wine list.">
       </head><body>
         <nav><a href="/menu">Menu</a></nav>
         <p>${"Dinner service from five. ".repeat(30)}</p>
       </body></html>`,
    );

    expect(detectBusinessProfile([restaurant]).type).toBe("hospitality");
    expect(ctaFixFor(restaurant)).toContain("Book a table");
  });

  it("recognises an agency and recommends starting a project", () => {
    const agency = page(
      `<title>Bramble Studio — Brand and web design</title>
       <meta name="description" content="A design studio building brand identities and websites.">`,
    );

    expect(detectBusinessProfile([agency]).type).toBe("agency");
    expect(ctaFixFor(agency)).toContain("Start a project");
  });

  it("recognises a personal portfolio and recommends a direct contact route", () => {
    const portfolio = page(
      `<title>Ada Lindqvist — Product Designer</title>
       <meta name="description" content="Independent product designer working with small teams. Selected work and case studies. Hire me.">`,
    );

    expect(detectBusinessProfile([portfolio]).type).toBe("portfolio");
    const fix = ctaFixFor(portfolio);
    expect(fix).toContain("Hire me");
    expect(fix).not.toMatch(/appointment|trial|cart|table|room/i);
  });

  it("treats a freelancer as a personal site, not an agency", () => {
    const freelancer = makePage(
      `<html lang="en"><head>
         <title>Milo Grant</title>
         <meta name="description" content="Freelance web developer available for new projects.">
       </head><body><p>${"I build careful, fast websites. ".repeat(30)}</p></body></html>`,
    );

    expect(detectBusinessProfile([freelancer]).type).toBe("portfolio");
    expect(ctaFixFor(freelancer)).toContain("Hire me");
  });

  it("does not call a personal site software because of a job title", () => {
    const personal = makePage(
      `<html lang="en"><head>
         <title>Alex Rivera</title>
         <meta name="description" content="Alex Rivera is a software engineer who builds accessible, inclusive products and digital experiences for the web.">
       </head><body><p>${"Building thoughtful interfaces. ".repeat(20)}</p></body></html>`,
    );

    const profile = detectBusinessProfile([personal]);
    expect(profile.type).not.toBe("software");
    expect(profile.ctaFix).not.toMatch(/free trial|book a demo/i);
  });

  it("does not label a personal blog as software because it mentions the word", () => {
    const blog = makePage(
      `<html lang="en"><head>
         <title>Lee Robinson</title>
         <meta name="description" content="Developer and writer.">
       </head><body>
         <nav>
           <a href="/blog">Blog</a>
           <a href="/software">Personal software</a>
           <a href="/about">About</a>
         </nav>
         <p>${"I write about design and building products. ".repeat(30)}</p>
       </body></html>`,
    );

    expect(detectBusinessProfile([blog]).type).not.toBe("software");
  });

  it("still recognises a software product described only by its category", () => {
    const product = makePage(
      `<html lang="en"><head>
         <title>Acme — Workflow automation software</title>
         <meta name="description" content="Keeps operations teams in sync.">
       </head><body><p>${"Built for operations teams. ".repeat(30)}</p></body></html>`,
    );

    expect(detectBusinessProfile([product]).type).toBe("software");
    expect(ctaFixFor(product)).toContain("free trial");
  });

  it("does not mistake a dental marketing agency for a dental practice", () => {
    const marketingAgency = makePage(
      `<html lang="en"><head>
         <title>Ridgeline — Dental marketing agency</title>
         <meta name="description" content="We help dental practices fill their chairs. Case studies and a proven process.">
       </head><body>
         <nav><a href="/work">Our work</a><a href="/services">Services</a></nav>
         <p>${"Strategy, ads, and follow-up for practices. ".repeat(20)}</p>
       </body></html>`,
    );

    expect(detectBusinessProfile([marketingAgency]).type).toBe("agency");
    expect(ctaFixFor(marketingAgency)).toContain("Start a project");
  });

  it("recognises a B2B product even when the copy is full of patient language", () => {
    const billing = page(
      `<title>Bedrock — Patient billing software</title>
       <meta name="description" content="Bedrock is software for independent clinics. Book a demo.">`,
    );

    expect(detectBusinessProfile([billing]).type).toBe("software");
    expect(ctaFixFor(billing)).toContain("free trial");
  });

  it("gives hotels and B&Bs room-booking advice, not table reservations", () => {
    const hotel = page(
      `<title>Harborview Hotel &amp; Suites</title>
       <meta name="description" content="Boutique rooms in the old town, plus a restaurant with seasonal cuisine. Book a room.">`,
    );

    expect(detectBusinessProfile([hotel]).type).toBe("lodging");
    expect(ctaFixFor(hotel)).toContain("Book a room");
  });

  it("keeps a practice a practice when a storefront script appears on the page", () => {
    const practice = makePage(
      `<html lang="en"><head>
         <title>Northwind Family Dental</title>
         <meta name="description" content="Family dentistry in Portland.">
         <script src="https://cdn.shopify.com/s/files/theme.js"></script>
       </head><body><p>${"Care for every patient. ".repeat(40)}</p></body></html>`,
    );

    expect(detectBusinessProfile([practice]).type).toBe("healthcare");
  });

  it("falls back to neutral advice when the type cannot be inferred", () => {
    const unknown = page(
      `<title>Example Domain</title>
       <meta name="description" content="This domain is for use in illustrative examples.">`,
    );

    expect(detectBusinessProfile([unknown]).type).toBe("unknown");
    const fix = ctaFixFor(unknown);
    expect(fix).toBe(UNKNOWN_PROFILE.ctaFix);
    expect(fix).not.toMatch(/appointment|trial|cart|table|quote/i);
  });

  it("does not guess from a single ambiguous navigation label", () => {
    const ambiguous = makePage(
      `<html lang="en"><head><title>Juniper House</title></head><body>
         <a href="/menu">Menu</a><p>${"A calm place to spend an afternoon. ".repeat(20)}</p>
       </body></html>`,
    );

    expect(detectBusinessProfile([ambiguous]).type).toBe("unknown");
  });

  it("is deterministic for the same pages", () => {
    const dental = page(
      `<title>Northwind Family Dental | Portland Dentist</title>
       <meta name="description" content="Family and cosmetic dentistry.">`,
    );

    const first = detectBusinessProfile([dental]);
    const second = detectBusinessProfile([dental]);
    expect(first).toEqual(second);
  });
});

describe("context-aware site findings", () => {
  it("uses the matching contact advice for a known business type", () => {
    const dental = makePage(
      `<html lang="en"><head>
         <title>Northwind Family Dental | Portland Dentist</title>
         <meta name="description" content="Family and cosmetic dentistry in North Portland.">
       </head><body><p>${"Care for every patient. ".repeat(40)}</p></body></html>`,
    );
    const context = makeContext([dental]);
    const profile = detectBusinessProfile([dental]);

    const finding = runSiteChecks([dental], context, profile).find(
      (item) => item.checkId === "conv-no-contact",
    );

    expect(finding?.fix).toContain("practice address");
  });

  it("keeps the neutral contact advice for an unknown business type", () => {
    const unknown = makePage(
      `<html lang="en"><head><title>Example Domain</title></head><body><p>${"Content. ".repeat(40)}</p></body></html>`,
    );
    const finding = runSiteChecks([unknown], makeContext([unknown])).find(
      (item) => item.checkId === "conv-no-contact",
    );

    expect(finding?.fix).toBe(UNKNOWN_PROFILE.contactFix);
  });
});

describe("audit composition", () => {
  it("carries the tailored recommendations into the ranked issues", () => {
    const dental = makePage(
      `<html lang="en"><head>
         <title>Northwind Family Dental | Portland Dentist</title>
         <meta name="description" content="Family and cosmetic dentistry in North Portland.">
       </head><body><p>${"Care for every patient. ".repeat(80)}</p></body></html>`,
    );

    const audit = composeAudit({
      pages: [dental],
      context: makeContext([dental]),
      robots: "respected",
      tech: [],
      pagesLimit: 8,
      startedAt: 0,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });

    const issue = audit.issues.find((item) => item.checkId === "conv-no-cta");
    expect(issue?.fix).toContain("Book an appointment");

    const contact = audit.issues.find(
      (item) => item.checkId === "conv-no-contact",
    );
    expect(contact?.fix).toContain("practice address");
  });

  it("records the detected category on the audit", () => {
    const dental = makePage(
      `<html lang="en"><head>
         <title>Northwind Family Dental | Portland Dentist</title>
         <meta name="description" content="Family and cosmetic dentistry in North Portland.">
       </head><body><p>${"Care for every patient. ".repeat(80)}</p></body></html>`,
    );
    const unknown = makePage(
      `<html lang="en"><head><title>Example Domain</title></head><body><p>${"Content. ".repeat(80)}</p></body></html>`,
    );
    const compose = (pageSnapshot: PageSnapshot) =>
      composeAudit({
        pages: [pageSnapshot],
        context: makeContext([pageSnapshot]),
        robots: "respected",
        tech: [],
        pagesLimit: 8,
        startedAt: 0,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      });

    expect(compose(dental).business).toEqual({
      type: "healthcare",
      label: "Healthcare & clinics",
      confident: true,
    });
    expect(compose(unknown).business?.confident).toBe(false);
  });

  it("never gives clinic advice to a non-clinic site", () => {
    const agency = makePage(
      `<html lang="en"><head>
         <title>Bramble Studio — Brand and web design</title>
         <meta name="description" content="A design studio building brand identities and websites.">
       </head><body><p>${"Selected work and case studies. ".repeat(40)}</p></body></html>`,
    );

    const audit = composeAudit({
      pages: [agency],
      context: makeContext([agency]),
      robots: "respected",
      tech: [],
      pagesLimit: 8,
      startedAt: 0,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });

    const copy = [
      ...audit.issues.map((issue) => `${issue.fix} ${issue.why}`),
      ...audit.actionPlan.flatMap((phase) => phase.items),
      audit.pitch.emails.map((email) => email.body).join(" "),
      audit.pitch.callOpener,
      ...audit.pitch.talkingPoints,
    ].join("\n");

    expect(copy).not.toMatch(/appointment|clinic|patient|practice/i);
  });
});
