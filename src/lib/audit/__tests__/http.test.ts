import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fetchText, probeUrl } from "@/lib/audit/http";

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": "20",
      });
      response.end("<h1>Hello audit</h1>");
      return;
    }

    if (url.pathname === "/redirect") {
      response.writeHead(302, { Location: "/final" });
      response.end();
      return;
    }

    if (url.pathname === "/final") {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end("<p>Final page</p>");
      return;
    }

    if (url.pathname === "/loop") {
      response.writeHead(302, { Location: "/loop" });
      response.end();
      return;
    }

    if (url.pathname === "/large") {
      response.writeHead(200, {
        "Content-Type": "text/html",
        "Content-Length": "3000000",
      });
      response.end("<p>" + "a".repeat(3_000_000) + "</p>");
      return;
    }

    if (url.pathname === "/slow") {
      setTimeout(() => {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end("<p>Slow</p>");
      }, 600);
      return;
    }

    if (url.pathname === "/latin") {
      response.writeHead(200, { "Content-Type": "text/html; charset=iso-8859-1" });
      response.end(Buffer.from([0x63, 0x61, 0x66, 0xe9]));
      return;
    }

    if (url.pathname === "/no-head") {
      if (request.method === "HEAD") {
        response.writeHead(405);
        response.end();
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html", "Content-Length": "7" });
      response.end("<p>x</p>");
      return;
    }

    response.writeHead(404, { "Content-Type": "text/html" });
    response.end("<h1>Not found</h1>");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  base = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

const privateOptions = { allowPrivateHosts: true, timeoutMs: 2000 };

describe("fetchText", () => {
  it("returns status, headers, timing, and body", async () => {
    const result = await fetchText(`${base}/`, privateOptions);
    expect(result.status).toBe(200);
    expect(result.body).toContain("Hello audit");
    expect(result.headers["content-type"]).toContain("text/html");
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.ttfbMs).toBeGreaterThanOrEqual(0);
  });

  it("follows redirects and reports the chain", async () => {
    const result = await fetchText(`${base}/redirect`, privateOptions);
    expect(result.url).toBe(`${base}/final`);
    expect(result.redirects).toEqual([`${base}/final`]);
    expect(result.body).toContain("Final page");
  });

  it("rejects redirect loops", async () => {
    await expect(fetchText(`${base}/loop`, privateOptions)).rejects.toMatchObject({
      code: "UNREACHABLE",
    });
  });

  it("re-validates redirect targets against private hosts", async () => {
    let calls = 0;
    const fetcher = async (input: string) => {
      calls += 1;
      const url = new URL(input);
      if (url.origin !== "https://example.com") {
        throw new Error(`Unexpected fetch to ${input}`);
      }
      return new Response(null, {
        status: 302,
        headers: { location: "http://printer.local/secret" },
      });
    };

    const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];
    await expect(
      fetchText("https://example.com/start", { lookup: publicLookup, fetcher }),
    ).rejects.toMatchObject({ code: "PRIVATE_HOST" });
    expect(calls).toBe(1);
  });

  it("rejects responses over the byte cap", async () => {
    await expect(
      fetchText(`${base}/large`, { ...privateOptions, maxBytes: 10_000 }),
    ).rejects.toMatchObject({ code: "TOO_LARGE" });
  });

  it("aborts slow responses", async () => {
    await expect(
      fetchText(`${base}/slow`, { ...privateOptions, timeoutMs: 60 }),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("decodes non-utf8 charsets", async () => {
    const result = await fetchText(`${base}/latin`, privateOptions);
    expect(result.body).toBe("café");
  });

  it("returns HTTP error statuses without throwing", async () => {
    const result = await fetchText(`${base}/missing`, privateOptions);
    expect(result.status).toBe(404);
    expect(result.body).toContain("Not found");
  });
});

describe("probeUrl", () => {
  it("returns status and content length from HEAD", async () => {
    const result = await probeUrl(`${base}/`, privateOptions);
    expect(result.status).toBe(200);
    expect(result.contentLength).toBeGreaterThan(0);
  });

  it("falls back to GET when HEAD is not supported", async () => {
    const result = await probeUrl(`${base}/no-head`, privateOptions);
    expect(result.status).toBe(200);
  });

  it("reports missing pages", async () => {
    const result = await probeUrl(`${base}/missing`, privateOptions);
    expect(result.status).toBe(404);
  });
});
