"use client";

import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import {
  readStoredAudit,
  resolveAuditView,
  type LoadedAudit,
} from "@/lib/audit/browser-store";
import { OnePager } from "./one-pager";

export function OnePagerFallback({ id }: { id: string }) {
  const [loaded, setLoaded] = useState<LoadedAudit>(null);

  useEffect(() => {
    setLoaded({ id, audit: readStoredAudit(id) });
  }, [id]);

  const view = resolveAuditView(loaded, id);

  if (view.status === "found") {
    return <OnePager audit={view.audit} isSample={id === "sample"} />;
  }

  return (
    <main
      id="main"
      className="grid min-h-screen place-items-center bg-ink px-6 py-16 text-bone"
    >
      <div className="w-full max-w-xl border border-line bg-ink-soft p-8">
        {view.status === "checking" ? (
          <p className="kicker text-signal">Looking for your audit…</p>
        ) : (
          <>
            <SearchX className="size-6 text-ember" aria-hidden />
            <p className="kicker mt-4 text-ember">One-pager not found</p>
            <h1 className="display mt-3 text-4xl">
              This one-pager is no longer available.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-bone/60">
              One-pagers render from the audit saved in this browser, or from
              the temporary server copy while it lasts. If this device did not
              run the audit, the server copy has expired, or browser storage
              was cleared, there is nothing left to render. Run the audit again
              on this device, then open the one-pager from the dossier header.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/#audit"
                className="bg-signal px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-bone"
              >
                Run an audit
              </Link>
              <Link
                href="/audit/sample/one-pager"
                className="border border-line px-4 py-2.5 text-sm text-bone/80 transition hover:border-bone/40"
              >
                See the sample one-pager
              </Link>
            </div>
            <Link
              href="/"
              className="mt-6 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition hover:text-signal"
            >
              <ArrowLeft className="size-3" aria-hidden />
              Back to Clinch
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
