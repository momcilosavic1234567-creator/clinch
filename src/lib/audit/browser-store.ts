import type { Audit } from "./types";

export const AUDIT_STORAGE_PREFIX = "clinch:audit:";

export function storedAuditKey(id: string): string {
  return `${AUDIT_STORAGE_PREFIX}${id}`;
}

export interface ReadableAuditStorage {
  getItem(key: string): string | null;
}

export interface WritableAuditStorage {
  setItem(key: string, value: string): void;
}

function browserStorage(): (ReadableAuditStorage & WritableAuditStorage) | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function parseStoredAudit(raw: string | null, id: string): Audit | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Audit;
    if (!parsed || parsed.version !== 1 || parsed.id !== id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readStoredAudit(
  id: string,
  storage?: ReadableAuditStorage,
): Audit | null {
  const target = storage ?? browserStorage();
  if (!target) return null;
  try {
    return parseStoredAudit(target.getItem(storedAuditKey(id)), id);
  } catch {
    return null;
  }
}

export function saveStoredAudit(
  audit: Audit,
  storage?: WritableAuditStorage,
): boolean {
  const target = storage ?? browserStorage();
  if (!target) return false;
  try {
    target.setItem(storedAuditKey(audit.id), JSON.stringify(audit));
    return true;
  } catch {
    return false;
  }
}

export type LoadedAudit = { id: string; audit: Audit | null } | null;

export type AuditView =
  | { status: "checking"; audit: null }
  | { status: "found"; audit: Audit }
  | { status: "missing"; audit: null };

export function resolveAuditView(loaded: LoadedAudit, id: string): AuditView {
  if (!loaded || loaded.id !== id) return { status: "checking", audit: null };
  if (loaded.audit && loaded.audit.id === id) {
    return { status: "found", audit: loaded.audit };
  }
  return { status: "missing", audit: null };
}
