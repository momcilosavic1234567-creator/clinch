import { describe, expect, it } from "vitest";
import {
  parseStoredAudit,
  readStoredAudit,
  resolveAuditView,
  saveStoredAudit,
  storedAuditKey,
} from "@/lib/audit/browser-store";
import type { Audit } from "@/lib/audit/types";

const IDEO_ID = "20261028-aaaa0001";
const PATAGONIA_ID = "20261028-bbbb0002";

function makeAudit(input: {
  id: string;
  host: string;
  paths: string[];
  finding: string;
  score: number;
}): Audit {
  return {
    version: 1,
    id: input.id,
    createdAt: new Date("2026-10-28T12:00:00.000Z").toISOString(),
    target: {
      inputUrl: `https://${input.host}/`,
      url: `https://${input.host}/`,
      finalUrl: `https://${input.host}/`,
      host: input.host,
      title: input.host,
    },
    pages: input.paths.map((path) => ({ path, title: path, wordCount: 500 })),
    issues: [{ title: input.finding }],
    score: input.score,
    stats: {
      pagesCrawled: input.paths.length,
      checksRun: 49 + 40 * (input.paths.length - 1),
      issuesFound: 1,
    },
  } as unknown as Audit;
}

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    data,
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

const ideo = makeAudit({
  id: IDEO_ID,
  host: "www.ideo.com",
  paths: ["/", "/work", "/about"],
  finding: "Homepage headlines skip from h1 to h4",
  score: 90,
});

const patagonia = makeAudit({
  id: PATAGONIA_ID,
  host: "www.patagonia.com",
  paths: ["/", "/shop", "/stories", "/activism"],
  finding: "Product images are missing width and height",
  score: 84,
});

describe("stored audit keys", () => {
  it("stores each audit under a key derived from its own id", () => {
    const storage = memoryStorage();

    expect(saveStoredAudit(ideo, storage)).toBe(true);
    expect(saveStoredAudit(patagonia, storage)).toBe(true);

    expect(storage.data.get(storedAuditKey(IDEO_ID))).toContain(`"${IDEO_ID}"`);
    expect(storage.data.get(storedAuditKey(PATAGONIA_ID))).toContain(
      `"${PATAGONIA_ID}"`,
    );
  });
});

describe("reading a stored audit", () => {
  it("keeps url, page data, findings, and id attached to their audit", () => {
    const storage = memoryStorage();
    saveStoredAudit(ideo, storage);
    saveStoredAudit(patagonia, storage);

    const storedIdeo = JSON.parse(
      storage.data.get(storedAuditKey(IDEO_ID)) ?? "null",
    ) as Audit;
    const storedPatagonia = JSON.parse(
      storage.data.get(storedAuditKey(PATAGONIA_ID)) ?? "null",
    ) as Audit;

    expect(storedIdeo.target.host).toBe("www.ideo.com");
    expect(storedIdeo.target.url).toBe("https://www.ideo.com/");
    expect(storedIdeo.pages.map((page) => page.path)).toEqual([
      "/",
      "/work",
      "/about",
    ]);
    expect(storedIdeo.issues[0]?.title).toBe(
      "Homepage headlines skip from h1 to h4",
    );
    expect(storedIdeo.id).toBe(IDEO_ID);

    expect(storedPatagonia.target.host).toBe("www.patagonia.com");
    expect(storedPatagonia.target.url).toBe("https://www.patagonia.com/");
    expect(storedPatagonia.pages.map((page) => page.path)).toEqual([
      "/",
      "/shop",
      "/stories",
      "/activism",
    ]);
    expect(storedPatagonia.issues[0]?.title).toBe(
      "Product images are missing width and height",
    );
    expect(storedPatagonia.id).toBe(PATAGONIA_ID);
  });

  it("returns the audit whose own id matches the request", () => {
    const storage = memoryStorage();
    saveStoredAudit(ideo, storage);
    saveStoredAudit(patagonia, storage);

    expect(readStoredAudit(IDEO_ID, storage)?.target.host).toBe("www.ideo.com");
    expect(readStoredAudit(PATAGONIA_ID, storage)?.target.host).toBe(
      "www.patagonia.com",
    );
  });

  it("refuses to return another audit's copy stored under the wrong key", () => {
    const storage = memoryStorage({
      [storedAuditKey(PATAGONIA_ID)]: JSON.stringify(ideo),
    });

    expect(readStoredAudit(PATAGONIA_ID, storage)).toBeNull();
  });

  it("treats absent, malformed, mismatched, and unreadable entries as missing", () => {
    const id = IDEO_ID;

    expect(parseStoredAudit(null, id)).toBeNull();
    expect(parseStoredAudit("{not json", id)).toBeNull();
    expect(parseStoredAudit(JSON.stringify({ version: 2, id }), id)).toBeNull();
    expect(
      parseStoredAudit(JSON.stringify({ version: 1, id: "other" }), id),
    ).toBeNull();
    expect(readStoredAudit(id, memoryStorage())).toBeNull();
    expect(
      readStoredAudit(id, {
        getItem() {
          throw new Error("storage blocked");
        },
      }),
    ).toBeNull();
  });
});

describe("rendering the fallback", () => {
  it("waits instead of rendering while the requested audit is unresolved", () => {
    expect(resolveAuditView(null, IDEO_ID)).toEqual({
      status: "checking",
      audit: null,
    });
  });

  it("never renders the previously loaded audit under a new id", () => {
    const storage = memoryStorage();
    saveStoredAudit(ideo, storage);
    const loadedIdeo = { id: IDEO_ID, audit: readStoredAudit(IDEO_ID, storage) };

    // Same component instance, route now asks for Patagonia.
    expect(resolveAuditView(loadedIdeo, PATAGONIA_ID)).toEqual({
      status: "checking",
      audit: null,
    });

    // The effect for Patagonia runs and finds nothing.
    const loadedPatagonia = {
      id: PATAGONIA_ID,
      audit: readStoredAudit(PATAGONIA_ID, storage),
    };
    expect(resolveAuditView(loadedPatagonia, PATAGONIA_ID)).toEqual({
      status: "missing",
      audit: null,
    });
  });

  it("shows not found instead of an audit whose id does not match", () => {
    expect(resolveAuditView({ id: PATAGONIA_ID, audit: ideo }, PATAGONIA_ID)).toEqual(
      { status: "missing", audit: null },
    );
  });

  it("renders each valid audit with its own id and host", () => {
    const storage = memoryStorage();
    saveStoredAudit(ideo, storage);
    saveStoredAudit(patagonia, storage);

    const viewIdeo = resolveAuditView(
      { id: IDEO_ID, audit: readStoredAudit(IDEO_ID, storage) },
      IDEO_ID,
    );
    const viewPatagonia = resolveAuditView(
      { id: PATAGONIA_ID, audit: readStoredAudit(PATAGONIA_ID, storage) },
      PATAGONIA_ID,
    );

    expect(viewIdeo.status).toBe("found");
    expect(viewIdeo.audit?.id).toBe(IDEO_ID);
    expect(viewIdeo.audit?.target.host).toBe("www.ideo.com");

    expect(viewPatagonia.status).toBe("found");
    expect(viewPatagonia.audit?.id).toBe(PATAGONIA_ID);
    expect(viewPatagonia.audit?.target.host).toBe("www.patagonia.com");
    expect(viewPatagonia.audit?.stats.pagesCrawled).toBe(4);
  });
});
