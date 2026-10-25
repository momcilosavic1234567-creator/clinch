import { promises as fs } from "node:fs";
import path from "node:path";
import sampleAuditJson from "@/data/sample-audit.json";
import type { Audit } from "./types";

const AUDIT_DIR = path.join(process.cwd(), "data", "audits");
const SAMPLE_AUDIT = sampleAuditJson as unknown as Audit;

export function isSafeAuditId(id: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,63}$/i.test(id);
}

function auditPath(id: string): string {
  return path.join(AUDIT_DIR, `${id}.json`);
}

export async function saveAudit(audit: Audit): Promise<boolean> {
  if (!isSafeAuditId(audit.id)) return false;
  try {
    await fs.mkdir(AUDIT_DIR, { recursive: true });
    await fs.writeFile(auditPath(audit.id), JSON.stringify(audit), "utf8");
    return true;
  } catch {
    return false;
  }
}

export async function loadAudit(id: string): Promise<Audit | null> {
  if (!isSafeAuditId(id)) return null;
  if (id === "sample") return SAMPLE_AUDIT;
  try {
    const raw = await fs.readFile(auditPath(id), "utf8");
    const parsed = JSON.parse(raw) as Audit;
    if (!parsed || parsed.id !== id || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}
