import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Github,
  Mail,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { CONTACT_EMAIL, mailtoHref } from "@/lib/contact";
import {
  AGENCY_DELIVERABLES,
  AGENCY_INPUTS,
  AGENCY_INTRO,
  AGENCY_PILOT,
} from "@/lib/offer";

const introHref = mailtoHref(
  `Clinch €${AGENCY_INTRO.priceEur} first-audit pilot`,
);
const packageHref = mailtoHref(
  `Clinch five-audit package (€${AGENCY_PILOT.priceEur})`,
);
const questionHref = mailtoHref("Question about Clinch audits");

const title = "Done-for-you prospect audits for web agencies";
const description = `Start with one manually reviewed audit for €${AGENCY_INTRO.priceEur}, or the five-audit package for €${AGENCY_PILOT.priceEur}. White-label dossiers with evidence-backed findings, a pitch kit, and a 30/60/90 plan, delivered in ${AGENCY_PILOT.turnaroundHours} hours.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/for-agencies" },
  openGraph: {
    title,
    description,
    url: "/for-agencies",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Clinch — the prospect audit engine for web agencies",
      },
    ],
  },
};

const included = AGENCY_DELIVERABLES;

const steps = [
  {
    number: "01",
    title: "Send the brief",
    body: `${AGENCY_INTRO.dossierCount} public prospect URL for the €${AGENCY_INTRO.priceEur} pilot, or ${AGENCY_PILOT.dossierCount} for the standard package — plus your logo or wordmark, accent hex, sender name, reply-to email, and booking link. One email is enough.`,
  },
  {
    number: "02",
    title: "I run and review the audits",
    body: "Clinch crawls each public site and runs the deterministic checks. I review every finding, remove noise, and make sure the report reads like a person wrote it.",
  },
  {
    number: "03",
    title: "You send under your name",
    body: `Within ${AGENCY_PILOT.turnaroundHours} hours you get a print-ready dossier and pitch kit per prospect — one for the pilot, ${AGENCY_PILOT.dossierCount} for the package. Your prospect never sees Clinch, and you never hand over a tool login.`,
  },
];

const stats = [
  { value: "49", label: "checks on the first page" },
  { value: "8", label: "pages max per prospect" },
  { value: `€${AGENCY_INTRO.priceEur}`, label: "to start, paid once" },
  { value: "0", label: "LLM calls in the engine" },
];

const fit = [
  "You already run outbound and need the proof artifact faster.",
  "You want your brand on the report, not a generic tool export.",
  "You would rather sell the fix than assemble the audit.",
];

const notFit = [
  "You need a full redesign or ongoing SEO implementation.",
  "You want a bulk scan of hundreds of domains.",
  "You need private analytics or Search Console data.",
];

const faqs = [
  [
    `What is the €${AGENCY_INTRO.priceEur} first-audit pilot?`,
    `A one-time introductory offer for a first customer: one manually reviewed audit of one public website. You get one white-label dossier with evidence-backed findings, a personalized pitch kit, and a prioritized 30/60/90-day plan, delivered within ${AGENCY_INTRO.turnaroundHours} hours after all required inputs are received. It is a single audit, not a subscription.`,
  ],
  [
    `Is €${AGENCY_PILOT.priceEur} the full price for the five-audit package?`,
    `Yes. €${AGENCY_PILOT.priceEur} covers ${AGENCY_PILOT.dossierCount} separate prospect websites at €${AGENCY_PILOT.perDossierEur} per dossier, each with the full deliverable set: dossier, pitch kit, 30/60/90 plan, evidence, and JSON export. There is no subscription, no per-seat fee, and no add-on needed to use the reports.`,
  ],
  [
    "What is the difference between the pilot and the package?",
    `The pilot is one audit of one website for €${AGENCY_INTRO.priceEur}, so you can judge the deliverable on a single prospect. The standard package is ${AGENCY_PILOT.dossierCount} separate prospect websites for €${AGENCY_PILOT.priceEur} — the same deliverables per dossier at €${AGENCY_PILOT.perDossierEur} each. Both are paid once.`,
  ],
  [
    "What exactly do I need to send?",
    `Everything in the “You send” list above: one public prospect URL for the pilot or ${AGENCY_PILOT.dossierCount} for the package, your logo (PNG or JPG) or a wordmark, accent hex, sender name, reply-to email, and booking link. If you do not have a logo, a clean wordmark is enough.`,
  ],
  [
    `How does the ${AGENCY_PILOT.turnaroundHours}-hour clock work?`,
    "It starts when the URL or URLs and brand inputs are complete. If a site blocks the audit, I will flag it and swap in another prospect rather than quietly deliver fewer reports.",
  ],
  [
    "Will Clinch appear anywhere on the report?",
    "No. The PDF dossier and pitch kit carry your agency's name, colors, and sender. The live demo on this site is Clinch-branded; the files you send to prospects are yours.",
  ],
  [
    "What if a prospect site blocks the crawl?",
    "Clinch respects robots.txt and never bypasses a block. I will tell you before delivery and replace that URL with another prospect from your list.",
  ],
  [
    `Can I order more after the €${AGENCY_INTRO.priceEur} pilot?`,
    `Yes. The five-audit package is €${AGENCY_PILOT.priceEur}, and monthly batches are available after that at a per-dossier rate we agree before the next batch.`,
  ],
];

export default function ForAgenciesPage() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span className="display text-2xl leading-none">Clinch</span>
            <span className="mt-1 size-1.5 rounded-full bg-signal" aria-hidden />
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-muted sm:inline">
              Done-for-you audits
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-bone/55 transition hover:text-bone sm:inline"
            >
              Back to Clinch
            </Link>
            <a
              href={introHref}
              className="group flex items-center gap-2 bg-signal px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink transition hover:bg-bone"
            >
              Start at €{AGENCY_INTRO.priceEur}
              <ArrowUpRight
                className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden
              />
            </a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden border-b border-line">
          <div className="absolute inset-0 grid-lines opacity-60" aria-hidden />
          <div
            className="absolute -right-40 -top-48 size-[38rem] rounded-full bg-signal/[0.06] blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:pb-24 lg:pt-20">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="kicker text-signal">For web agencies</span>
                <span className="h-px w-8 bg-line-strong" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Done-for-you prospect audits
                </span>
              </div>
              <h1 className="display mt-7 max-w-3xl text-balance text-[clamp(3rem,7vw,5.6rem)]">
                Your prospect audits, delivered under your name.
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-bone/70 sm:text-lg">
                I built Clinch, the audit engine on this site. Start with a
                one-time first-audit pilot: one public URL, €
                {AGENCY_INTRO.priceEur}, and one manually reviewed white-label
                dossier in {AGENCY_INTRO.turnaroundHours} hours. When you want
                more, the standard package covers{" "}
                {AGENCY_PILOT.dossierCount} separate prospect websites for €
                {AGENCY_PILOT.priceEur} — €{AGENCY_PILOT.perDossierEur} per
                dossier, each with the same deliverables. Both are paid once and
                delivered under your name.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={introHref}
                  className="group inline-flex items-center gap-2 bg-signal px-5 py-3 text-sm font-medium text-ink transition hover:bg-bone"
                >
                  Start the €{AGENCY_INTRO.priceEur} pilot
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
                <Link
                  href="/audit/sample"
                  className="group inline-flex items-center gap-2 border border-line-strong px-5 py-3 text-sm text-bone/85 transition hover:border-signal hover:text-signal"
                >
                  Read a sample dossier
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </div>
              <p className="mt-6 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-muted">
                From Momčilo Savić · Independent engineer · Replies within one
                business day
              </p>
            </div>

            <aside
              aria-label="Pricing"
              className="relative border border-line-strong bg-bone p-6 text-ink shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="kicker text-ink/50">Two ways to start</p>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/40">
                  Pay once · no subscription
                </span>
              </div>

              <div className="mt-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/45">
                  Introductory offer · one audit
                </p>
                <div className="mt-2 flex items-end gap-3">
                  <p className="display text-6xl leading-none">
                    €{AGENCY_INTRO.priceEur}
                  </p>
                  <p className="pb-1.5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-ink/50">
                    one-time
                    <br />
                    first-customer pilot
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">
                  One manually reviewed audit of one public website: one
                  white-label dossier with evidence-backed findings, a
                  personalized pitch kit, and a prioritized 30/60/90-day plan.
                  Delivered within {AGENCY_INTRO.turnaroundHours} hours after
                  all required inputs are received.
                </p>
                <a
                  href={introHref}
                  className="group mt-4 flex items-center justify-between gap-3 bg-ink px-4 py-3 text-sm font-medium text-bone transition hover:bg-ink-raised"
                >
                  Start the €{AGENCY_INTRO.priceEur} pilot
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </div>

              <div className="mt-7 border-t border-ink/15 pt-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/45">
                  Standard package · five audits
                </p>
                <div className="mt-2 flex items-end gap-3">
                  <p className="display text-6xl leading-none">
                    €{AGENCY_PILOT.priceEur}
                  </p>
                  <p className="pb-1.5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-ink/50">
                    fixed fee
                    <br />
                    {AGENCY_PILOT.dossierCount} prospect websites
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">
                  {AGENCY_PILOT.dossierCount} separate prospect websites at €
                  {AGENCY_PILOT.perDossierEur} per dossier. Each dossier
                  includes the same deliverable set listed below.{" "}
                  {AGENCY_PILOT.turnaroundHours} hours. No subscription.
                </p>
                <a
                  href={packageHref}
                  className="group mt-4 flex items-center justify-between gap-3 border border-ink/25 px-4 py-3 text-sm font-medium text-ink transition hover:border-ink/70"
                >
                  Start the five-audit package
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </div>

              <p className="mt-6 border-t border-ink/15 pt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/45">
                Each dossier includes
              </p>
              <ul className="mt-3 space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-ink/75">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-ink" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-ink/15 pt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/45">
                You send
              </p>
              <ul className="mt-2 space-y-1.5">
                {AGENCY_INPUTS.map((item) => (
                  <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-ink/65">
                    <span className="mt-1.5 size-1 shrink-0 bg-ink/40" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/45">
                <ShieldCheck className="size-3" aria-hidden />
                Public pages only · robots.txt respected
              </p>
            </aside>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:px-10 lg:py-24">
            <div>
              <p className="kicker text-signal">The deliverable</p>
              <h2 className="display mt-4 max-w-md text-balance text-4xl sm:text-5xl">
                The artifact, without the production time.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/65">
                Your team keeps the client relationship and the pitch. I do the
                crawling, checking, scoring, and assembly.
              </p>
            </div>
            <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
              {[
                {
                  icon: FileText,
                  title: "The dossier",
                  body: "A seven-page A4 report: overall grade, weighted category scores, the three highest-leverage fixes, and a page-by-page register with the exact evidence.",
                },
                {
                  icon: Mail,
                  title: "The pitch kit",
                  body: "Two outreach emails in different registers, a follow-up, a call opener, and three talking points. Every line is tied to a real finding.",
                },
                {
                  icon: ArrowRight,
                  title: "The plan",
                  body: "A 30/60/90 sequence with effort and impact labels, so the prospect sees a project with a shape — not a list of complaints.",
                },
              ].map(({ icon: Icon, title: cardTitle, body }) => (
                <div key={cardTitle} className="bg-ink-soft p-6 sm:p-7">
                  <Icon className="size-4 text-signal" aria-hidden />
                  <h3 className="mt-5 text-sm font-medium text-bone">{cardTitle}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-bone/55">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-ink-soft">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="kicker text-signal">The process</p>
                <h2 className="display mt-4 max-w-md text-balance text-4xl sm:text-5xl">
                  One brief. {AGENCY_PILOT.turnaroundHours} hours. Reports under
                  your name.
                </h2>
              </div>
              <ol className="grid gap-8 sm:grid-cols-3">
                {steps.map((step) => (
                  <li key={step.number} className="border-t border-line-strong pt-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                      {step.number}
                    </p>
                    <h3 className="mt-3 text-sm font-medium text-bone">{step.title}</h3>
                    <p className="mt-3 text-xs leading-relaxed text-bone/55">{step.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-10 lg:py-24">
            <div>
              <p className="kicker text-signal">The engine behind the promise</p>
              <h2 className="display mt-4 max-w-lg text-balance text-4xl sm:text-5xl">
                Deterministic by design.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-bone/65">
                Clinch is not a prompt wrapped in a template. Every finding comes
                from a fixed rule against the page&rsquo;s markup, weighted by
                severity and prevalence. The same site produces the same audit.
                I built it, tested it, and published the source.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                <Link href="/#audit" className="inline-flex items-center gap-1 text-bone/70 transition hover:text-signal">
                  Run the live demo
                  <ArrowUpRight className="size-3" aria-hidden />
                </Link>
                <Link href="/audit/sample" className="inline-flex items-center gap-1 text-bone/70 transition hover:text-signal">
                  Open the sample
                  <ArrowUpRight className="size-3" aria-hidden />
                </Link>
                <a
                  href="https://github.com/momcilosavic1234567-creator/clinch"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-bone/70 transition hover:text-signal"
                >
                  Read the source
                  <Github className="size-3" aria-hidden />
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px self-start border border-line bg-line">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-ink-soft p-6 sm:p-8">
                  <p className="display text-5xl leading-none text-signal">{stat.value}</p>
                  <p className="mt-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10 lg:py-24">
            <div>
              <p className="kicker text-signal">Fit</p>
              <h2 className="display mt-4 max-w-md text-balance text-4xl sm:text-5xl">
                Built for agencies that sell the work.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/65">
                This is a diagnostics service for teams with an outbound motion.
                It is not a redesign retainer, and it does not pretend to be one.
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                  A good fit
                </h3>
                <ul className="mt-4 space-y-3">
                  {fit.map((item) => (
                    <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-bone/65">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-signal" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
                  Not a fit
                </h3>
                <ul className="mt-4 space-y-3">
                  {notFit.map((item) => (
                    <li key={item} className="flex gap-2.5 text-xs leading-relaxed text-bone/55">
                      <Minus className="mt-0.5 size-3.5 shrink-0 text-ember" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-signal text-ink">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:px-10 lg:py-20">
            <div>
              <p className="kicker text-ink/55">Next step</p>
              <h2 className="display mt-4 max-w-2xl text-balance text-4xl sm:text-6xl">
                Start with one audit for €{AGENCY_INTRO.priceEur}, or five for €
                {AGENCY_PILOT.priceEur}.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink/70">
                The pilot is one manually reviewed audit of one public website
                for €{AGENCY_INTRO.priceEur}: dossier, evidence, pitch kit, and
                30/60/90 plan in {AGENCY_INTRO.turnaroundHours} hours. The
                standard package is {AGENCY_PILOT.dossierCount} separate
                prospect websites for €{AGENCY_PILOT.priceEur} — €
                {AGENCY_PILOT.perDossierEur} per dossier, each with the same
                deliverables. Send your URL or URLs and brand details; I will
                confirm the scope and the fixed fee before starting.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={introHref}
                className="group flex items-center justify-between gap-3 bg-ink px-5 py-4 text-sm font-medium text-bone transition hover:bg-ink-raised"
              >
                Start the €{AGENCY_INTRO.priceEur} pilot
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </a>
              <a
                href={questionHref}
                className="flex items-center justify-between gap-3 border border-ink/25 px-5 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/75 transition hover:border-ink/60 hover:text-ink"
              >
                <span className="break-all">{CONTACT_EMAIL}</span>
                <Mail className="size-3.5 shrink-0" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
              <div>
                <p className="kicker text-signal">Questions</p>
                <h2 className="display mt-4 max-w-md text-balance text-4xl sm:text-5xl">
                  The details, before you send an email.
                </h2>
              </div>
              <div>
                {faqs.map(([question, answer]) => (
                  <details key={question} className="group border-t border-line py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-sm font-medium text-bone [&::-webkit-details-marker]:hidden">
                      {question}
                      <Plus
                        className="size-4 shrink-0 text-signal transition group-open:rotate-45"
                        aria-hidden
                      />
                    </summary>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-bone/60">
                      {answer}
                    </p>
                  </details>
                ))}
                <div className="border-t border-line" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-bone/60 transition hover:text-signal"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Clinch
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            <a href={questionHref} className="transition hover:text-signal">
              {CONTACT_EMAIL}
            </a>
            <Link href="/audit/sample" className="transition hover:text-signal">
              Sample dossier
            </Link>
            <a
              href="https://github.com/momcilosavic1234567-creator/clinch"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition hover:text-signal"
            >
              Source
              <Github className="size-3" aria-hidden />
            </a>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            © 2026 Momčilo Savić
          </p>
        </div>
      </footer>
    </div>
  );
}
