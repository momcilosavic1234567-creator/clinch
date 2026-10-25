import { promises as fs } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { isSafeAuditId, loadAudit, saveAudit } from "@/lib/audit/store";
import type { Audit } from "@/lib/audit/types";

const createdIds: string[] = [];

function makeId(): string {
  const id = `test-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2, 8)}`;
  createdIds.push(id);
  return id;
}

function makeAudit(id: string): Audit {
  return { version: 1, id, createdAt: new Date(0).toISOString() } as Audit;
}

afterEach(async () => {
  for (const id of createdIds.splice(0)) {
    await fs
      .rm(path.join(process.cwd(), "data", "audits", `${id}.json`), {
        force: true,
      })
      .catch(() => undefined);
  }
});

describe("isSafeAuditId", () => {
  it("accepts generated ids and the sample id", () => {
    expect(isSafeAuditId("20261025-a1b2c3d4")).toBe(true);
    expect(isSafeAuditId("sample")).toBe(true);
  });

  it("rejects traversal and empty ids", () => {
    expect(isSafeAuditId("../secrets")).toBe(false);
    expect(isSafeAuditId("a/b")).toBe(false);
    expect(isSafeAuditId("a\\b")).toBe(false);
    expect(isSafeAuditId("")).toBe(false);
    expect(isSafeAuditId("x".repeat(100))).toBe(false);
  });
});

describe("audit store", () => {
  it("round-trips an audit on disk", async () => {
    const id = makeId();
    const audit = makeAudit(id);

    await expect(saveAudit(audit)).resolves.toBe(true);
    await expect(loadAudit(id)).resolves.toEqual(audit);
  });

  it("returns null for an unknown audit", async () => {
    await expect(loadAudit(makeId())).resolves.toBeNull();
  });

  it("refuses unsafe ids without touching the filesystem", async () => {
    await expect(loadAudit("../package.json")).resolves.toBeNull();
    await expect(loadAudit("nested/id")).resolves.toBeNull();
  });
});
