"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_NAME } from "@/lib/contact";
import { buildOnePager } from "@/lib/audit/one-pager";
import type { Audit, Severity } from "@/lib/audit/types";

const severityStyle: Record<Severity, string> = {
  critical: "border-critical/45 bg-critical/[0.07] text-critical",
  high: "border-high/45 bg-high/[0.07] text-high",
  medium: "border-ink/25 text-ink/60",
  low: "border-ink/15 text-ink/45",
};

export function OnePager({
  audit,
  isSample = false,
}: {
  audit: Audit;
  isSample?: boolean;
}) {
  const model = buildOnePager(audit);
  const senderName = audit.brand.senderName ?? CONTACT_NAME;
  const email = audit.brand.email ?? CONTACT_EMAIL;
  const website = audit.brand.website ?? "clinch-audit.vercel.app";
  const pages = audit.stats.pagesCrawled;

  return (
    <div className="one-pager-view min-h-screen bg-ink px-3 py-6 text-bone sm:px-6 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <Link
          href={`/audit/${audit.id}`}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted transition hover:text-signal"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Back to dossier
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-muted sm:block">
            One page · A4
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-signal px-3 py-2 text-[11px] font-medium text-ink transition hover:bg-bone"
          >
            <Printer className="size-3.5" aria-hidden />
            Print / save PDF
          </button>
        </div>
      </div>

      <article className="one-pager-sheet mx-auto flex min-h-[265mm] w-full max-w-[210mm] flex-col border border-ink/10 bg-paper text-ink shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] print:min-h-0">
        <header className="flex items-center justify-between gap-4 bg-ink px-6 py-4 text-bone print:px-0 print:py-3">
          <div className="flex items-baseline gap-2">
            <span className="display text-xl leading-none">
              {audit.brand.agencyName}
            </span>
            <span className="size-1.5 rounded-full bg-signal" aria-hidden />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-bone/60">
            Website check · {model.date}
            {isSample ? " · sample" : ""}
          </p>
        </header>

        <section className="grid grid-cols-[1fr_auto] items-start gap-5 border-b border-ink/15 px-6 py-6 print:px-0">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink/40">
              Prepared for
            </p>
            <h1 className="display mt-1.5 text-[30px] leading-[1.05]">
              {model.siteTitle}
            </h1>
            <p className="mt-1.5 font-mono text-[10px] tracking-[0.04em] text-ink/50">
              {model.host}
            </p>
            <p className="mt-4 max-w-[108mm] text-[11.5px] leading-[1.55] text-ink/70">
              {model.verdict}
            </p>
          </div>
          <div className="text-right">
            <p className="display text-[62px] leading-none tabular-nums">
              {model.score}
            </p>
            <p className="mt-1.5 font-mono text-[8px] uppercase leading-[1.6] tracking-[0.14em] text-ink/45">
              of 100
              <br />
              {model.grade} · {model.gradeLabel}
            </p>
          </div>
        </section>

        <div className="px-6 pt-5 print:px-0">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink/40">
            Three things costing you customers
          </p>
        </div>

        <ol className="px-6 print:px-0">
          {model.findings.map((finding) => (
            <li
              key={`${finding.position}-${finding.title}`}
              className="avoid-break grid grid-cols-[9mm_1fr] gap-3 border-t border-ink/12 py-4 first:mt-2"
            >
              <span className="display text-[22px] leading-none text-ink/25">
                {finding.position}
              </span>
              <div>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[7.5px] uppercase tracking-[0.14em]">
                  <span
                    className={`inline-block border px-1.5 py-0.5 ${severityStyle[finding.severity]}`}
                  >
                    {finding.severityLabel}
                  </span>
                  <span className="text-ink/40">{finding.categoryLabel}</span>
                </p>
                <h2 className="mt-2 text-[14px] font-semibold leading-snug">
                  {finding.title}
                </h2>
                <p className="mt-1.5 text-[10.5px] leading-[1.5] text-ink/70">
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-ink/35">
                    Saw{" "}
                  </span>
                  {finding.evidence}
                </p>
                <p className="text-[10.5px] leading-[1.5] text-ink/70">
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-ink/35">
                    Why{" "}
                  </span>
                  {finding.why}
                </p>
                <p className="text-[10.5px] leading-[1.5] text-ink/90">
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.1em] text-ink/35">
                    Fix{" "}
                  </span>
                  {finding.fix}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <footer className="mt-auto border-t-2 border-ink px-6 py-5 print:px-0">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-ink/40">
                This is {model.findings.length} of {model.totalFindings} findings
              </p>
              <p className="mt-1.5 max-w-[112mm] text-[11px] leading-[1.55] text-ink/75">
                The full report covers all {model.totalFindings}, with the
                evidence for each and a 30/60/90 plan you can hand to your
                developer.
              </p>
              <p className="mt-2.5 text-[13px] font-semibold">
                Full report — €{model.price}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium">{senderName}</p>
              <p className="font-mono text-[9px] text-ink/60">{email}</p>
              <p className="font-mono text-[9px] text-ink/40">{website}</p>
            </div>
          </div>
          <p className="mt-4 border-t border-ink/10 pt-2.5 font-mono text-[7.5px] uppercase leading-[1.7] tracking-[0.08em] text-ink/35">
            {pages} public {pages === 1 ? "page" : "pages"} scanned ·{" "}
            {audit.stats.checksRun} automated checks · no access to your server,
            analytics, or customer data
          </p>
        </footer>
      </article>
    </div>
  );
}
