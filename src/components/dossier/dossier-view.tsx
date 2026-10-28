"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  FileOutput,
  FileText,
  Info,
  Link2,
  Mail,
  Printer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { saveStoredAudit } from "@/lib/audit/browser-store";
import type { Audit } from "@/lib/audit/types";
import { DossierPages, formatDate } from "./dossier-pages";
import { PitchKitView } from "./pitch-kit-view";

type View = "dossier" | "pitch";

export function DossierView({
  audit,
  isSample = false,
  browserOnly = false,
}: {
  audit: Audit;
  isSample?: boolean;
  browserOnly?: boolean;
}) {
  const [view, setView] = useState<View>("dossier");
  const [linkState, setLinkState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const timer = useRef<number | null>(null);

  useEffect(() => {
    // Private browsing can block storage; the dossier still renders in memory.
    saveStoredAudit(audit);
  }, [audit]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  function download() {
    const blob = new Blob([JSON.stringify(audit, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${audit.target.host.replace(
      /[^a-z0-9.-]+/gi,
      "-",
    )}-audit-${audit.id.slice(-8)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function copyLink() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(window.location.href);
      ok = true;
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = window.location.href;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        ok = document.execCommand("copy");
        area.remove();
      } catch {
        ok = false;
      }
    }
    setLinkState(ok ? "copied" : "failed");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLinkState("idle"), 2200);
  }

  function handlePrint() {
    if (view !== "dossier") {
      setView("dossier");
      window.setTimeout(() => window.print(), 120);
      return;
    }
    window.print();
  }

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition ${
      active
        ? "bg-bone text-ink"
        : "text-bone/55 hover:text-bone"
    }`;

  return (
    <div className="dossier-view min-h-screen bg-ink text-bone">
      <header className="no-print sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="display text-xl leading-none">Clinch</span>
            <span
              className="size-1 rounded-full bg-signal"
              aria-hidden
            />
          </Link>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-muted md:inline">
            White-label dossier
          </span>

          <div
            className="order-3 flex w-full items-center gap-0.5 border border-line p-0.5 sm:order-none sm:ml-2 sm:w-auto"
            aria-label="Choose view"
          >
            <button
              type="button"
              onClick={() => setView("dossier")}
              aria-pressed={view === "dossier"}
              className={tabClass(view === "dossier")}
            >
              <FileText className="size-3.5" aria-hidden />
              Dossier
            </button>
            <button
              type="button"
              onClick={() => setView("pitch")}
              aria-pressed={view === "pitch"}
              className={tabClass(view === "pitch")}
            >
              <Mail className="size-3.5" aria-hidden />
              Pitch kit
            </button>
          </div>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center gap-1.5 border border-line px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-bone/65 transition hover:border-bone/40 hover:text-bone"
              aria-label={browserOnly ? "Copy local link" : "Copy share link"}
              title={
                isSample
                  ? "The sample dossier is always available at this link."
                  : browserOnly
                    ? "This audit lives in this browser. The link will not open on another device — send the PDF instead."
                    : "A server copy exists now, but this demo may drop it on redeploy. Send the PDF for a copy that lasts."
              }
            >
              {linkState === "copied" ? (
                <Check className="size-3.5" aria-hidden />
              ) : (
                <Link2 className="size-3.5" aria-hidden />
              )}
              <span className="hidden lg:inline" aria-live="polite">
                {linkState === "copied"
                  ? browserOnly
                    ? "Copied · local"
                    : "Copied"
                  : linkState === "failed"
                    ? "Failed"
                    : browserOnly
                      ? "Local link"
                      : "Copy link"}
              </span>
            </button>
            <button
              type="button"
              onClick={download}
              className="flex items-center gap-1.5 border border-line px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-bone/65 transition hover:border-bone/40 hover:text-bone"
              aria-label="Download audit JSON"
            >
              <Download className="size-3.5" aria-hidden />
              <span className="hidden lg:inline">JSON</span>
            </button>
            <Link
              href={`/audit/${audit.id}/one-pager`}
              className="flex items-center gap-1.5 border border-line px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-bone/65 transition hover:border-bone/40 hover:text-bone"
              title="One printed page: the three findings that matter most"
            >
              <FileOutput className="size-3.5" aria-hidden />
              <span className="hidden lg:inline">One-pager</span>
            </Link>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-signal px-3 py-2 text-[11px] font-medium text-ink transition hover:bg-bone"
            >
              <Printer className="size-3.5" aria-hidden />
              Print / PDF
            </button>
            <Link
              href="/#audit"
              className="hidden items-center gap-1.5 border border-line px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-bone/65 transition hover:border-bone/40 hover:text-bone sm:flex"
            >
              New audit
            </Link>
          </div>
        </div>
      </header>

      {!isSample && (
        <div className="no-print border-b border-line bg-ink-soft">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-muted sm:px-6">
            <Info className="mt-px size-3 shrink-0" aria-hidden />
            <span>
              {browserOnly
                ? "Browser copy — saved on this device only. This link will not open on another device; download the JSON or print the PDF to keep a copy."
                : "Saved by this demo — the server copy can disappear when the site redeploys. Download the JSON or print the PDF for a copy you control."}
            </span>
          </p>
        </div>
      )}

      {isSample && (
        <div className="no-print border-b border-line bg-ink-soft">
          <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted sm:px-6">
            <span className="size-1.5 rounded-full bg-signal" aria-hidden />
            Fictional demonstration · {audit.target.host} · invented prospect
            and agency, generated by the live engine. Not a real client or
            result.
          </p>
        </div>
      )}

      <main
        id="main"
        className="dossier-route px-3 pb-16 pt-6 sm:px-6 print:p-0"
      >
        {view === "dossier" ? (
          <>
            <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-end justify-between gap-2 px-1">
              <div>
                <p className="kicker text-signal">
                  {isSample
                    ? "Sample dossier"
                    : browserOnly
                      ? "Browser copy · this device"
                      : "Audit report"}
                </p>
                <p className="mt-1 text-xs text-bone/55">
                  {audit.target.host} · {audit.stats.issuesFound} findings ·{" "}
                  {formatDate(audit.createdAt)}
                </p>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                Score {audit.score}/100
              </p>
            </div>
            <div className="dossier-shell mx-auto w-full max-w-[210mm] print:max-w-none">
              <DossierPages audit={audit} isSample={isSample} />
            </div>
            <div className="no-print mx-auto mt-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-1">
              <Link
                href="/#audit"
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition hover:text-signal"
              >
                <ArrowLeft className="size-3" aria-hidden />
                Audit another prospect
              </Link>
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                {audit.crawl.userAgent}
              </p>
            </div>
          </>
        ) : (
          <div className="pt-2">
            <PitchKitView audit={audit} isSample={isSample} />
          </div>
        )}
      </main>
    </div>
  );
}
