import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checksRunFor } from "@/lib/audit/checks";
import { runAudit } from "@/lib/audit/run-audit";
import type { AuditEvent } from "@/lib/audit/types";
import { startFixtureServer, type FixtureServer } from "./fixture-server";

let fixture: FixtureServer;

beforeAll(async () => {
  fixture = await startFixtureServer();
});

afterAll(async () => {
  await fixture.close();
});

describe("runAudit", () => {
  it("assembles a complete, branded audit from a live crawl", async () => {
    const events: AuditEvent[] = [];
    const audit = await runAudit(
      {
        url: fixture.base,
        brand: {
          agencyName: "  Acme Studio ",
          senderName: "Mina Kovac",
          website: "https://acme.studio",
          accent: "#ff5c35",
        },
      },
      {
        allowPrivateHosts: true,
        maxPages: 3,
        overallBudgetMs: 20_000,
        now: () => new Date("2026-10-25T12:00:00.000Z"),
        onEvent: (event) => events.push(event),
      },
    );

    expect(audit.version).toBe(1);
    expect(audit.createdAt).toBe("2026-10-25T12:00:00.000Z");
    expect(audit.brand.agencyName).toBe("Acme Studio");
    expect(audit.brand.senderName).toBe("Mina Kovac");
    expect(audit.brand.accent).toBe("#ff5c35");
    expect(audit.brand.logoDataUrl).toBeUndefined();

    expect(audit.target.host).toContain("127.0.0.1");
    expect(audit.target.inputUrl).toBe(fixture.base);
    expect(audit.target.title).toContain("Northwind");

    expect(audit.score).toBeGreaterThanOrEqual(0);
    expect(audit.score).toBeLessThan(100);
    expect(audit.grade).toMatch(/^[A-F]$/);
    expect(audit.categories).toHaveLength(5);
    expect(audit.issues.length).toBeGreaterThan(0);
    expect(audit.issues.length).toBe(audit.stats.issuesFound);
    expect(audit.topIssues.length).toBeGreaterThan(0);
    expect(audit.topIssues.length).toBeLessThanOrEqual(3);

    expect(audit.pages.length).toBeGreaterThanOrEqual(1);
    expect(audit.stats.pagesCrawled).toBe(audit.pages.length);
    expect(audit.stats.pagesLimit).toBe(3);
    expect(audit.stats.checksRun).toBe(checksRunFor(audit.pages.length));
    expect(audit.stats.brokenLinks).toBeGreaterThanOrEqual(1);
    expect(
      audit.issues.some((issue) => issue.checkId === "seo-broken-links"),
    ).toBe(true);

    expect(audit.actionPlan).toHaveLength(3);
    expect(audit.pitch.emails).toHaveLength(2);
    expect(audit.pitch.talkingPoints).toHaveLength(3);
    expect(audit.crawl.robots).toBe("respected");
    expect(audit.crawl.userAgent).toContain("ClinchAuditBot");
    expect(audit.crawl.tech).toEqual(expect.any(Array));

    const done = events.at(-1);
    expect(done?.type).toBe("done");
    if (done?.type === "done") {
      expect(done.audit.id).toBe(audit.id);
    }
    expect(events.some((event) => event.type === "stage")).toBe(true);
    expect(audit.durationMs).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(audit)).not.toContain("undefined");
  });

  it("rejects private hosts before making a request", async () => {
    await expect(runAudit("http://localhost:3000")).rejects.toMatchObject({
      code: "PRIVATE_HOST",
    });
  });

  it("rejects malformed input with a helpful code", async () => {
    await expect(runAudit("not a real url")).rejects.toMatchObject({
      code: "INVALID_URL",
    });
  });
});
