import { randomBytes } from "node:crypto";
import { DEFAULT_BRAND } from "./types";
import type { Brand } from "./types";

const MAX_NAME_LENGTH = 80;
const MAX_LINK_LENGTH = 300;
const MAX_LOGO_LENGTH = 200_000;

function cleanText(value: string | undefined, maxLength = MAX_NAME_LENGTH) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function cleanHttpUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString().slice(0, MAX_LINK_LENGTH);
  } catch {
    return undefined;
  }
}

function cleanEmail(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  if (!trimmed || trimmed.length > 120) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : undefined;
}

function cleanAccent(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)
    ? trimmed
    : DEFAULT_BRAND.accent;
}

function cleanLogo(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > MAX_LOGO_LENGTH) return undefined;
  if (!/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function sanitizeBrand(input: Partial<Brand> = {}): Brand {
  return {
    agencyName: cleanText(input.agencyName) ?? DEFAULT_BRAND.agencyName,
    senderName: cleanText(input.senderName),
    email: cleanEmail(input.email),
    website: cleanHttpUrl(input.website),
    bookingUrl: cleanHttpUrl(input.bookingUrl),
    accent: cleanAccent(input.accent),
    logoDataUrl: cleanLogo(input.logoDataUrl),
  };
}

export function createAuditId(date: Date): string {
  const stamp = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `${stamp}-${randomBytes(4).toString("hex")}`;
}
