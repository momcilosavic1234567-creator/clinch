"use client";

import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import type { Audit } from "@/lib/audit/types";
import { DossierView } from "./dossier-view";

export function AuditFallback({ id }: { id: string }) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`clinch:audit:${id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Audit;
        if (parsed && parsed.version === 1 && parsed.id === id) {
          setAudit(parsed);
        }
      }
    } catch {
      // Ignore corrupt or blocked storage and show the expiry message.
    }
    setChecked(true);
  }, [id]);

  if (audit) {
    return (
      <DossierView audit={audit} isSample={id === "sample"} />
    );
  }

  return (
    <main
      id="main"
      className="grid min-h-screen place-items-center bg-ink px-6 py-16 text-bone"
    >
      <div className="w-full max-w-xl border border-line bg-ink-soft p-8">
        {!checked ? (
          <>
            <p className="kicker text-signal">Checking this browser</p>
            <h1 className="display mt-4 text-4xl">Looking for your dossier…</h1>
            <p className="mt-4 text-sm text-bone/55">
              This should take less than a second.
            </p>
          </>
        ) : (
          <>
            <SearchX className="size-6 text-ember" aria-hidden />
            <p className="kicker mt-4 text-ember">Dossier not found</p>
            <h1 className="display mt-3 text-4xl">
              This report is not on this server.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-bone/60">
              Audits are stored in the browser that ran them. If you opened
              this link on another device, cleared storage, or the hosted demo
              restarted, the report is gone. Running it again takes about a
              minute.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/#audit"
                className="bg-signal px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-bone"
              >
                Run an audit
              </Link>
              <Link
                href="/audit/sample"
                className="border border-line px-4 py-2.5 text-sm text-bone/80 transition hover:border-bone/40"
              >
                Open the sample dossier
              </Link>
            </div>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition hover:text-signal"
            >
              <ArrowLeft className="size-3" aria-hidden />
              Back to Clinch
            </Link>
            <p className="mt-6 break-all border-t border-line pt-4 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              Reference: {id.slice(0, 64)}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
