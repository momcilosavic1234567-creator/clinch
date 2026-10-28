"use client";

import type { Audit } from "@/lib/audit/types";
import { CopyButton } from "./copy-button";

function senderLine(audit: Audit): string {
  return [audit.brand.senderName, audit.brand.agencyName]
    .filter(Boolean)
    .join(" · ");
}

export function PitchKitView({
  audit,
  isSample = false,
}: {
  audit: Audit;
  isSample?: boolean;
}) {
  const { brand, pitch } = audit;
  const signature = [brand.senderName, brand.agencyName, brand.website]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="max-w-2xl">
        <p className="kicker text-signal">Agency workspace</p>
        <h1 className="display mt-4 text-balance text-4xl sm:text-5xl">
          The pitch, written from the evidence.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-bone/60">
          Two angles, one set of facts. Copy the version that fits the
          relationship, adjust the greeting, and keep the findings intact.
        </p>
        <p className="mt-4 inline-block border border-line px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
          Not part of the client-facing PDF
        </p>
        {isSample && (
          <p className="ml-2 mt-4 inline-block border border-signal/50 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-signal">
            Fictional demonstration · invented prospect and agency
          </p>
        )}
      </header>

      <div className="mt-9 space-y-6">
        {pitch.emails.map((email, index) => (
          <article key={email.id} className="border border-line bg-ink-soft">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div>
                <p className="kicker text-signal">{email.label}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {index === 0
                    ? "Short, specific, asks for the call."
                    : "Lower pressure, leads with what is working."}
                </p>
              </div>
              <CopyButton
                text={`Subject: ${email.subject}\n\n${email.body}`}
                label="Copy email"
                tone="paper"
              />
            </header>
            <div className="grid gap-px bg-line md:grid-cols-[0.75fr_1.25fr]">
              <div className="bg-ink-soft p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  Subject
                </p>
                <p className="mt-2 text-sm leading-snug text-bone">
                  {email.subject}
                </p>
                <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  From
                </p>
                <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-bone/70">
                  {signature || brand.agencyName}
                </p>
                {brand.bookingUrl && (
                  <>
                    <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                      Booking link
                    </p>
                    <p className="mt-2 break-all text-xs text-bone/70">
                      {brand.bookingUrl}
                    </p>
                  </>
                )}
              </div>
              <div className="bg-[#fffdf6] p-5 text-ink sm:p-6">
                <p className="whitespace-pre-line text-[12.5px] leading-relaxed sm:text-[13px]">
                  {email.body}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <article className="border border-line bg-ink-soft p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker text-signal">The follow-up</p>
            <CopyButton
              text={`Subject: ${pitch.followUp.subject}\n\n${pitch.followUp.body}`}
              label="Copy"
              tone="paper"
            />
          </div>
          <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            Subject
          </p>
          <p className="mt-1 text-sm text-bone">{pitch.followUp.subject}</p>
          <p className="mt-4 whitespace-pre-line text-xs leading-relaxed text-bone/60">
            {pitch.followUp.body}
          </p>
        </article>

        <article className="border border-line bg-ink-soft p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker text-signal">Call opener</p>
            <CopyButton text={pitch.callOpener} label="Copy" tone="paper" />
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-bone/75">
            {pitch.callOpener}
          </p>
          <div className="mt-5 border-t border-line pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Three grounded talking points
            </p>
            <ol className="mt-3 space-y-2.5">
              {pitch.talkingPoints.map((point, index) => (
                <li
                  key={point}
                  className="flex gap-3 text-xs leading-relaxed text-bone/65"
                >
                  <span className="font-mono text-[9px] text-signal">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          </div>
        </article>
      </div>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="max-w-xl text-[11px] leading-relaxed text-muted">
          Every line traces back to the crawl. Rewrite the tone in your own
          voice; keep the evidence and the numbers intact.
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-bone/50">
          {senderLine(audit)}
        </p>
      </footer>
    </div>
  );
}
