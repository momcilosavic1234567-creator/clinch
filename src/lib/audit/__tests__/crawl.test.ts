import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { crawlSite } from "@/lib/audit/crawler";
import type { AuditEvent } from "@/lib/audit/types";
import { startFixtureServer, type FixtureServer } from "./fixture-server";

let fixture: FixtureServer;

beforeAll(async () => {
  fixture = await startFixtureServer();
});

afterAll(async () => {
  await fixture.close();
});

describe("crawlSite", () => {
  it("crawls same-origin pages, respects robots, and aggregates broken links", async () => {
    const events: AuditEvent[] = [];
    const result = await crawlSite(fixture.base, {
      allowPrivateHosts: true,
      maxPages: 4,
      overallBudgetMs: 20_000,
      onEvent: (event) => events.push(event),
    });

    const paths = result.pages.map((page) => page.path);

    expect(paths[0]).toBe("/");
    expect(paths).toContain("/services");
    expect(paths).toContain("/about");
    expect(paths).not.toContain("/private");
    expect(paths.length).toBeLessThanOrEqual(4);
    expect(result.robots).toBe("respected");
    expect(result.context.startUrl.startsWith("http://127.0.0.1")).toBe(true);
    expect(result.context.host).toContain("127.0.0.1");

    const broken = result.context.brokenLinks.find((link) =>
      link.url.endsWith("/broken"),
    );
    expect(broken?.status).toBe(404);
    expect(broken?.foundOn).toContain("/");
    expect(result.context.linkChecks).toBeGreaterThanOrEqual(1);

    expect(result.context.homepageAssetCount).toBe(2);
    expect(result.context.homepageAssetBytes ?? 0).toBeGreaterThan(0);
    expect(result.pages[0].assetBytes).toBe(
      result.context.homepageAssetBytes,
    );
    expect(result.pages[1].assetBytes).toBeNull();

    expect(events.some((event) => event.type === "page")).toBe(true);
    expect(
      events.some(
        (event) => event.type === "stage" && event.stage === "crawling",
      ),
    ).toBe(true);
    expect(
      events.some(
        (event) => event.type === "stage" && event.stage === "measuring",
      ),
    ).toBe(true);

    const pageEvents = events.filter((event) => event.type === "page");
    expect(pageEvents).toHaveLength(result.pages.length);
  });

  it("blocks an entry path that robots.txt disallows", async () => {
    await expect(
      crawlSite(`${fixture.base}/private`, { allowPrivateHosts: true }),
    ).rejects.toMatchObject({ code: "BLOCKED_ROBOTS" });
  });

  it("rejects a non-HTML entry page", async () => {
    await expect(
      crawlSite(`${fixture.base}/download.pdf`, { allowPrivateHosts: true }),
    ).rejects.toMatchObject({ code: "NOT_HTML" });
  });

  it("reports a missing homepage as not found", async () => {
    await expect(
      crawlSite(`${fixture.base}/missing`, { allowPrivateHosts: true }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("never leaves the audited origin", async () => {
    const result = await crawlSite(fixture.base, {
      allowPrivateHosts: true,
      maxPages: 3,
      overallBudgetMs: 20_000,
    });

    for (const page of result.pages) {
      expect(new URL(page.url).host).toBe(result.context.host);
    }
  });
});
