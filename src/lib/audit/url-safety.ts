import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import { AuditError } from "./types";

export type HostLookup = (
  hostname: string,
) => Promise<Array<{ address: string; family: number }>>;

export interface UrlSafetyOptions {
  allowPrivateHosts?: boolean;
  lookup?: HostLookup;
}

const defaultLookup: HostLookup = async (hostname) =>
  dns.lookup(hostname, { all: true, verbatim: true });

const PRIVATE_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".lan",
  ".home",
  ".corp",
  ".intranet",
];

function parseIpv4(address: string): number[] | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) return Number.NaN;
    return Number(part);
  });
  if (octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return null;
  return octets;
}

export function isPrivateIp(address: string): boolean {
  let value = address.trim().toLowerCase();
  if (value.startsWith("[") && value.endsWith("]")) value = value.slice(1, -1);
  value = value.split("%")[0];

  const family = isIP(value);
  if (family === 4) {
    const octets = parseIpv4(value);
    if (!octets) return true;
    const [a, b, c] = octets;

    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 192 && b === 88 && c === 99) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51 && c === 100) return true;
    if (a === 203 && b === 0 && c === 113) return true;
    if (a >= 224) return true;
    return false;
  }

  if (family === 6) {
    if (value === "::" || value === "::1") return true;
    if (/^fe[89ab][0-9a-f]?:/.test(value)) return true;
    if (/^f[cd][0-9a-f]{0,2}:/.test(value)) return true;
    if (/^ff[0-9a-f]{0,2}:/.test(value)) return true;
    if (value.startsWith("2001:db8:") || value === "2001:db8::") return true;
    if (value.startsWith("2001:0:") || value.startsWith("2001::")) return true;
    if (value.startsWith("2002:")) return true;
    if (/^fec[0-9a-f]?:/.test(value)) return true;

    const embedded = value.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (embedded) return isPrivateIp(embedded[1]);

    return false;
  }

  return true;
}

export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost") return true;
  return PRIVATE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

function stripBrackets(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

function parseInput(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new AuditError("INVALID_URL", "Enter a website address to audit.");
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    candidate = `https://${trimmed.replace(/^\/\//, "")}`;
  }

  try {
    return new URL(candidate);
  } catch {
    throw new AuditError(
      "INVALID_URL",
      "That doesn't look like a valid website address. Try something like acme.com.",
    );
  }
}

export async function assertPublicUrl(
  url: URL,
  options: UrlSafetyOptions = {},
): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AuditError("INVALID_URL", "Clinch can only audit http and https websites.");
  }

  if (url.username || url.password) {
    throw new AuditError("INVALID_URL", "URLs containing credentials are not allowed.");
  }

  const host = stripBrackets(url.hostname);
  if (!host) {
    throw new AuditError("INVALID_URL", "That URL is missing a hostname.");
  }

  if (options.allowPrivateHosts) {
    return;
  }

  if (isPrivateHostname(host) || (isIP(host) && isPrivateIp(host))) {
    throw new AuditError(
      "PRIVATE_HOST",
      "For safety, Clinch can only audit public websites.",
    );
  }

  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new AuditError(
      "INVALID_URL",
      "Only websites on standard ports 80 and 443 can be audited.",
    );
  }

  if (isIP(host)) {
    return;
  }

  const lookup = options.lookup ?? defaultLookup;
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(host);
  } catch {
    throw new AuditError(
      "UNREACHABLE",
      "We couldn't resolve that domain. Check the spelling and try again.",
    );
  }

  if (addresses.length === 0) {
    throw new AuditError(
      "UNREACHABLE",
      "We couldn't resolve that domain. Check the spelling and try again.",
    );
  }

  if (addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new AuditError(
      "PRIVATE_HOST",
      "For safety, Clinch can only audit public websites.",
    );
  }
}

export async function normalizeAndValidateUrl(
  input: string,
  options: UrlSafetyOptions = {},
): Promise<URL> {
  const url = parseInput(input);
  url.hash = "";
  await assertPublicUrl(url, options);
  return url;
}
