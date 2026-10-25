import { AuditError } from "./types";
import {
  assertPublicUrl,
  type UrlSafetyOptions,
} from "./url-safety";

export const AUDIT_USER_AGENT =
  "ClinchAuditBot/1.0 (+https://github.com/momcilosavic1234567-creator/clinch; respectful audit bot)";

const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

export interface FetchTextOptions extends UrlSafetyOptions {
  timeoutMs?: number;
  maxBytes?: number;
  userAgent?: string;
  fetcher?: Fetcher;
}

export interface FetchTextResult {
  url: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  bytes: number;
  ttfbMs: number;
  redirects: string[];
  contentType: string;
}

export interface ProbeOptions extends UrlSafetyOptions {
  timeoutMs?: number;
  userAgent?: string;
  fetcher?: Fetcher;
}

export interface ProbeResult {
  url: string;
  status: number;
  contentLength: number | null;
  ok: boolean;
}

function requestHeaders(userAgent: string): Record<string, string> {
  return {
    "user-agent": userAgent,
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.8",
    "cache-control": "no-cache",
  };
}

function parseContentLength(headers: Headers): number | null {
  const raw = headers.get("content-length");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function decodeBody(bytes: Uint8Array, contentType: string): string {
  const match = /charset=["']?([^;"'\s]+)/i.exec(contentType);
  let decoder: TextDecoder;
  try {
    decoder = new TextDecoder(match?.[1] ?? "utf-8");
  } catch {
    decoder = new TextDecoder("utf-8");
  }
  try {
    return decoder.decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function mapFetchError(error: unknown): AuditError {
  if (error instanceof AuditError) return error;
  const name = error instanceof Error ? error.name : "";
  if (name === "TimeoutError" || name === "AbortError") {
    return new AuditError(
      "TIMEOUT",
      "The site took too long to respond. Try again in a moment.",
      504,
    );
  }
  return new AuditError(
    "UNREACHABLE",
    "We couldn't reach that website. Check the address and try again.",
    502,
  );
}

async function readBody(
  response: Response,
  maxBytes: number,
): Promise<{ body: string; bytes: number }> {
  const contentType = response.headers.get("content-type") ?? "";
  const declared = parseContentLength(response.headers);
  if (declared !== null && declared > maxBytes) {
    await response.body?.cancel().catch(() => undefined);
    throw new AuditError(
      "TOO_LARGE",
      "That page is too large to audit safely.",
      413,
    );
  }

  if (!response.body) return { body: "", bytes: 0 };

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new AuditError(
          "TOO_LARGE",
          "That page is too large to audit safely.",
          413,
        );
      }
      chunks.push(value);
    }
  } catch (error) {
    throw mapFetchError(error);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { body: decodeBody(merged, contentType), bytes: total };
}

export async function fetchText(
  input: string,
  options: FetchTextOptions = {},
): Promise<FetchTextResult> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const headers = requestHeaders(options.userAgent ?? AUDIT_USER_AGENT);

  let current = new URL(input);
  await assertPublicUrl(current, options);

  const redirects: string[] = [];

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let response: Response;
    let ttfbMs = 0;

    try {
      const startedAt = performance.now();
      response = await fetcher(current.toString(), {
        method: "GET",
        redirect: "manual",
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      ttfbMs = performance.now() - startedAt;
    } catch (error) {
      throw mapFetchError(error);
    }

    if (
      [301, 302, 303, 307, 308].includes(response.status) &&
      response.headers.get("location")
    ) {
      if (hop === MAX_REDIRECTS) {
        await response.body?.cancel().catch(() => undefined);
        throw new AuditError(
          "UNREACHABLE",
          "That site redirects too many times to audit safely.",
          502,
        );
      }

      const next = new URL(response.headers.get("location")!, current);
      await assertPublicUrl(next, options);
      redirects.push(next.toString());
      current = next;
      await response.body?.cancel().catch(() => undefined);
      continue;
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value;
    });

    const { body, bytes } = await readBody(response, maxBytes);

    return {
      url: current.toString(),
      status: response.status,
      headers: responseHeaders,
      body,
      bytes,
      ttfbMs,
      redirects,
      contentType: responseHeaders["content-type"] ?? "",
    };
  }

  throw new AuditError(
    "UNREACHABLE",
    "That site redirects too many times to audit safely.",
    502,
  );
}

function isRedirect(status: number): boolean {
  return [301, 302, 303, 307, 308].includes(status);
}

export async function probeUrl(
  input: string,
  options: ProbeOptions = {},
): Promise<ProbeResult> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 4_000;
  const headers = requestHeaders(options.userAgent ?? AUDIT_USER_AGENT);

  let current = new URL(input);
  await assertPublicUrl(current, options);

  for (let hop = 0; hop <= 3; hop += 1) {
    let response: Response;
    try {
      response = await fetcher(current.toString(), {
        method: "HEAD",
        redirect: "manual",
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return {
        url: current.toString(),
        status: 0,
        contentLength: null,
        ok: false,
      };
    }

    if (isRedirect(response.status) && response.headers.get("location")) {
      const next = new URL(response.headers.get("location")!, current);
      try {
        await assertPublicUrl(next, options);
      } catch (error) {
        if (error instanceof AuditError) throw error;
        return {
          url: current.toString(),
          status: 0,
          contentLength: null,
          ok: false,
        };
      }
      current = next;
      await response.body?.cancel().catch(() => undefined);
      continue;
    }

    if (response.status === 405 || response.status === 501) {
      await response.body?.cancel().catch(() => undefined);
      return probeWithGet(current, options);
    }

    const contentLength = parseContentLength(response.headers);
    await response.body?.cancel().catch(() => undefined);
    return {
      url: current.toString(),
      status: response.status,
      contentLength,
      ok: response.status >= 200 && response.status < 400,
    };
  }

  return {
    url: current.toString(),
    status: 0,
    contentLength: null,
    ok: false,
  };
}

async function probeWithGet(
  target: URL,
  options: ProbeOptions,
): Promise<ProbeResult> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 4_000;
  const headers = {
    ...requestHeaders(options.userAgent ?? AUDIT_USER_AGENT),
    range: "bytes=0-0",
  };

  let current = target;
  await assertPublicUrl(current, options);

  for (let hop = 0; hop <= 3; hop += 1) {
    let response: Response;
    try {
      response = await fetcher(current.toString(), {
        method: "GET",
        redirect: "manual",
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      return {
        url: current.toString(),
        status: 0,
        contentLength: null,
        ok: false,
      };
    }

    if (isRedirect(response.status) && response.headers.get("location")) {
      const next = new URL(response.headers.get("location")!, current);
      try {
        await assertPublicUrl(next, options);
      } catch (error) {
        if (error instanceof AuditError) throw error;
        return {
          url: current.toString(),
          status: 0,
          contentLength: null,
          ok: false,
        };
      }
      await response.body?.cancel().catch(() => undefined);
      current = next;
      continue;
    }

    const contentLength = parseContentLength(response.headers);
    await response.body?.cancel().catch(() => undefined);
    return {
      url: current.toString(),
      status: response.status,
      contentLength,
      ok: response.status >= 200 && response.status < 400,
    };
  }

  return {
    url: current.toString(),
    status: 0,
    contentLength: null,
    ok: false,
  };
}
