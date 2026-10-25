import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Gauge,
  ListChecks,
  Mail,
  MousePointerClick,
  Search,
  ShieldCheck,
} from "lucide-react";
import { AuditForm } from "@/components/audit-form";
import sampleJson from "@/data/sample-audit.json";
import type { Audit } from "@/lib/audit/types";
import { mailtoHref } from "@/lib/contact";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const sample = sampleJson as unknown as Audit;
const sampleEmail = sample.pitch.emails[0];
const sampleBars = ["seo", "accessibility", "performance"].map(
  (key) => sample.categories.find((category) => category.key === key)!,
);

const categoryRows = [
  {
    icon: Search,
    label: "Search visibility",
    detail:
      "Titles, meta descriptions, heading order, canonicals, noindex, Open Graph, structured data.",
    weight: "25%",
    perPage: "12 / page",
  },
  {
    icon: Accessibility,
    label: "Accessibility",
    detail:
      "Alt text, form labels, accessible names, viewport, skip links, heading structure.",
    weight: "20%",
    perPage: "10 / page",
  },
  {
    icon: Gauge,
    label: "Performance",
    detail:
      "TTFB, HTML and page weight, render-blocking scripts, image dimensions, lazy loading.",
    weight: "20%",
    perPage: "9 / page",
  },
  {
    icon: ShieldCheck,
    label: "Security",
    detail:
      "HTTPS, HTTPS enforcement, mixed content, insecure form actions, six response headers.",
    weight: "15%",
    perPage: "9 / page",
  },
  {
    icon: MousePointerClick,
    label: "Conversion",
    detail:
      "Calls to action, contact paths, social proof, thin content, stale copyright.",
    weight: "20%",
    perPage: "2 / page",
  },
];

const steps = [
  {
    number: "01",
    title: "Paste the prospect",
    body: "A homepage is enough. Clinch reads the first response and prioritises the pages a buyer would actually visit: services, pricing, about, contact.",
    tag: "Input: one URL",
  },
  {
    number: "02",
    title: "The engine crawls",
    body: "Same origin. Up to eight pages, thirty link checks, twenty-four asset measurements. robots.txt is read before the first request and obeyed.",
    tag: "40-second budget",
  },
  {
    number: "03",
    title: "Findings become a score",
    body: "Forty-nine checks on a one-page audit, plus forty more for each extra page. Severity, prevalence, and impact are weighted so criticals lead and noise stays out.",
    tag: "Deterministic scoring",
  },
  {
    number: "04",
    title: "You send the work",
    body: "A print-ready dossier in your colors, two outreach emails in different registers, a follow-up, a call opener, and a 30/60/90 plan. Copy, export, send.",
    tag: "Your name on every page",
  },
];

const ticker = [
  "Search visibility",
  "Accessibility",
  "Performance",
  "Security",
  "Conversion",
  "White-label dossier",
  "Two outreach emails",
  "30 / 60 / 90 plan",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span className="display text-2xl leading-none">Clinch</span>
            <span className="mt-1 size-1.5 rounded-full bg-signal" aria-hidden />
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-muted sm:inline">
              Prospect audits
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 md:flex"
          >
            {[
              ["What you get", "#what"],
              ["How it works", "#how"],
              ["For agencies", "/for-agencies"],
              ["Sample dossier", "#sample"],
            ].map(([label, href]) =>
              href.startsWith("#") ? (
                <a
                  key={href}
                  href={href}
                  className="text-xs text-bone/60 transition hover:text-signal"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className="text-xs text-bone/60 transition hover:text-signal"
                >
                  {label}
                </Link>
              ),
            )}
          </nav>
          <a
            href="#audit"
            className="group flex items-center gap-2 border border-line-strong px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-bone transition hover:border-signal hover:text-signal"
          >
            Run an audit
            <ArrowUpRight
              className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
        </div>
      </header>

      <main id="main">
        <section className="relative overflow-hidden border-b border-line">
          <div className="absolute inset-0 grid-lines opacity-70" aria-hidden />
          <div
            className="absolute -right-40 -top-48 size-[38rem] rounded-full bg-signal/[0.07] blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-6 pb-16 pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-10 lg:pb-24 lg:pt-20">
            <div className="animate-rise">
              <div className="flex flex-wrap items-center gap-3">
                <span className="kicker text-signal">For web agencies</span>
                <span className="h-px w-8 bg-line-strong" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Prospect audit → pitch
                </span>
              </div>
              <h1 className="display mt-7 text-balance text-[clamp(3.4rem,8vw,6.6rem)]">
                Win the pitch <em className="italic text-signal">before</em> the
                first call.
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-bone/70 sm:text-lg">
                Paste a prospect&rsquo;s URL. Clinch crawls the public site,
                scores what is costing them customers, and writes the outreach
                that makes the first call inevitable — in about a minute.
              </p>

              <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-line pt-6">
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    First page
                  </dt>
                  <dd className="display mt-1 text-4xl leading-none">49</dd>
                  <p className="mt-1 text-[11px] text-muted">
                    checks, +40 per extra page
                  </p>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    Turnaround
                  </dt>
                  <dd className="display mt-1 text-4xl leading-none">≈60s</dd>
                  <p className="mt-1 text-[11px] text-muted">
                    URL to white-label dossier
                  </p>
                </div>
                <div>
                  <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    Deliverables
                  </dt>
                  <dd className="display mt-1 text-4xl leading-none">3</dd>
                  <p className="mt-1 text-[11px] text-muted">
                    dossier, pitch kit, fix plan
                  </p>
                </div>
              </dl>

              <p className="mt-8 flex max-w-md items-start gap-2.5 text-xs leading-relaxed text-muted">
                <Check className="mt-0.5 size-3.5 shrink-0 text-signal" aria-hidden />
                Deterministic checks, not an LLM. Every finding quotes the
                markup it read and names the fix.
              </p>
            </div>

            <AuditForm />
          </div>
        </section>

        <div
          className="overflow-hidden border-b border-line bg-ink-soft py-3"
          aria-hidden
        >
          <div className="flex w-max animate-marquee">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="flex shrink-0 items-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
              >
                {ticker.map((item) => (
                  <span key={item} className="flex items-center">
                    <span className="px-6">{item}</span>
                    <span className="size-1 rotate-45 bg-signal/60" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <section id="what" className="scroll-mt-24 border-b border-line">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16">
              <div>
                <p className="kicker text-signal">01 / Deliverables</p>
                <h2 className="display mt-5 max-w-xl text-balance text-4xl sm:text-5xl lg:text-6xl">
                  One crawl. Three things you can put in front of a client.
                </h2>
              </div>
              <p className="max-w-md text-pretty text-sm leading-relaxed text-bone/60 lg:justify-self-end">
                Most audits stop at a list of problems. Clinch packages the
                evidence, the argument, and the next step, so an agency can go
                from noticing a prospect to sounding like the obvious choice.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
              <article className="flex min-w-0 flex-col bg-ink p-6">
                <div className="relative mb-7 h-64 overflow-hidden border border-line bg-paper-deep p-5">
                  <div className="paper-grain absolute inset-0" aria-hidden />
                  <div className="relative bg-paper p-4 text-ink shadow-[0_18px_40px_-24px_rgba(10,11,9,0.6)]">
                    <div className="flex justify-between font-mono text-[8px] uppercase tracking-[0.16em] text-ink/50">
                      <span>Prospect audit</span>
                      <span>№ 001</span>
                    </div>
                    <p className="mt-3 font-mono text-[9px] text-ink/60">
                      {sample.target.host}
                    </p>
                    <div className="mt-1 flex items-end justify-between border-b border-ink/15 pb-3">
                      <span className="display text-6xl leading-none">
                        {sample.grade}
                      </span>
                      <div className="text-right">
                        <p className="display text-2xl leading-none">
                          {sample.score}
                        </p>
                        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-ink/50">
                          out of 100
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {sampleBars.map((category) => (
                        <div key={category.key} className="flex items-center gap-2">
                          <span className="w-16 truncate font-mono text-[8px] uppercase tracking-[0.08em] text-ink/55">
                            {category.label}
                          </span>
                          <span className="h-1 flex-1 bg-ink/10">
                            <span
                              className="block h-full bg-ink/70"
                              style={{ width: `${category.score}%` }}
                            />
                          </span>
                          <span className="w-5 text-right font-mono text-[8px] text-ink/60">
                            {category.score}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 border-t border-ink/10 pt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-ink/45">
                      Print-ready · A4 · 7 pages
                    </p>
                  </div>
                </div>
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  <FileText className="size-3.5 text-signal" aria-hidden />
                  The dossier
                </p>
                <h3 className="mt-2 font-serif text-2xl">
                  A report that survives scrutiny
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-bone/60">
                  Grade, verdict, category scores, severity-ranked findings, and
                  page-level evidence. Printable to PDF in one click.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-bone/55">
                  {[
                    "Weighted scores you can defend",
                    "Evidence from the live markup",
                    "Your logo, accent, and signature",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3 shrink-0 text-signal" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="flex min-w-0 flex-col bg-ink p-6">
                <div className="relative mb-7 flex h-64 flex-col overflow-hidden border border-line bg-ink-soft p-5">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    <span>Outreach</span>
                    <span>Variant A</span>
                  </div>
                  <div className="mt-4 border-l-2 border-ember pl-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                      Subject
                    </p>
                    <p className="mt-1 text-sm leading-snug text-bone">
                      {sampleEmail.subject}
                    </p>
                  </div>
                  <p className="mt-4 whitespace-pre-line text-[11px] leading-relaxed text-bone/55">
                    {sampleEmail.body.split("\n\n").slice(0, 4).join("\n\n")}
                  </p>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-soft to-transparent" />
                  <span className="absolute bottom-4 left-5 border border-line bg-ink px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-bone/70">
                    Grounded in {sample.stats.checksRun} checks
                  </span>
                </div>
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  <Mail className="size-3.5 text-signal" aria-hidden />
                  The pitch kit
                </p>
                <h3 className="mt-2 font-serif text-2xl">
                  Words that sound like you did the work
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-bone/60">
                  Two emails with different pressure levels, a follow-up, a call
                  opener, and three talking points tied to real findings.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-bone/55">
                  {[
                    "No templates that read like templates",
                    "Specific evidence, never vague praise",
                    "Booking link and signature included",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3 shrink-0 text-signal" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="flex min-w-0 flex-col bg-ink p-6">
                <div className="mb-7 flex h-64 flex-col border border-line bg-ink-soft p-5">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                    <span>Fix plan</span>
                    <span>{sample.issues.length} findings</span>
                  </div>
                  <div className="mt-2">
                    {sample.actionPlan.map((phase) => (
                      <div
                        key={phase.key}
                        className="border-t border-line py-3 first:border-t-0"
                      >
                        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em]">
                          <span className="text-signal">{phase.key}</span>
                          <span className="text-muted">{phase.window}</span>
                        </div>
                        <p className="mt-1 text-sm text-bone">{phase.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {phase.items[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    <span>Effort × impact</span>
                    <span className="text-signal">Prioritised</span>
                  </div>
                </div>
                <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  <ListChecks className="size-3.5 text-signal" aria-hidden />
                  The action plan
                </p>
                <h3 className="mt-2 font-serif text-2xl">
                  A first call about scope, not discovery
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-bone/60">
                  Every issue lands in Now, Next, or Later with an effort label
                  and a concrete fix — a proposal outline before the call begins.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-bone/55">
                  {[
                    "Criticals first, always",
                    "Grouped into 0–30 / 30–60 / 60–90",
                    "Effort and impact on every item",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3 shrink-0 text-signal" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-24 border-b border-line bg-ink-soft">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-10 lg:py-28">
            <div className="self-start lg:sticky lg:top-28">
              <p className="kicker text-signal">02 / Workflow</p>
              <h2 className="display mt-5 text-balance text-4xl sm:text-5xl">
                From a stranger&rsquo;s URL to a booked call.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone/60">
                Manual prospecting means an afternoon of browser tabs before you
                know whether the lead is worth a sentence. Clinch compresses
                that afternoon into a coffee.
              </p>
              <p className="mt-6 flex items-start gap-2 border-t border-line pt-5 text-xs text-muted">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-signal" aria-hidden />
                Same-origin crawl · robots.txt read first · eight-page cap ·
                no private areas, ever.
              </p>
            </div>

            <ol className="border-t border-line">
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="grid grid-cols-[3.5rem_1fr] gap-5 border-b border-line py-7 sm:grid-cols-[5rem_1fr]"
                >
                  <span className="display text-3xl text-bone/25">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-base font-medium text-bone">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-bone/60">
                      {step.body}
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-signal/80">
                      {step.tag}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="engine" className="scroll-mt-24 border-b border-line">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16">
              <div>
                <p className="kicker text-signal">03 / The engine</p>
                <h2 className="display mt-5 max-w-xl text-balance text-4xl sm:text-5xl lg:text-6xl">
                  The engine, not the vibes.
                </h2>
              </div>
              <p className="max-w-md text-pretty text-sm leading-relaxed text-bone/60 lg:justify-self-end">
                Every finding is produced by a fixed rule against the page it
                crawled, then weighted by severity and how widely it appears.
                Same site in, same audit out. No model improvisation.
              </p>
            </div>

            <div className="mt-14 grid gap-12 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="border-t border-line">
                {categoryRows.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[auto_1fr_auto] items-start gap-4 border-b border-line py-5"
                  >
                    <row.icon className="mt-1 size-4 text-signal" aria-hidden />
                    <div>
                      <h3 className="text-sm font-medium text-bone">
                        {row.label}
                      </h3>
                      <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
                        {row.detail}
                      </p>
                    </div>
                    <div className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      <p>{row.weight}</p>
                      <p className="mt-1">{row.perPage}</p>
                    </div>
                  </div>
                ))}
                <p className="mt-5 text-xs leading-relaxed text-muted">
                  <span className="text-signal">+</span> Seven site-wide checks:
                  HTTPS enforcement, broken links, duplicate titles and
                  descriptions, contact paths, social proof, stale copyright.
                </p>
              </div>

              <aside className="border border-line bg-ink-soft p-6">
                <p className="kicker text-signal">The boring parts are built</p>
                <ul className="mt-5 space-y-4">
                  {[
                    [
                      "SSRF-safe fetcher",
                      "DNS resolution and reserved-range blocking on every redirect hop.",
                    ],
                    [
                      "Robots-aware crawl",
                      "Disallowed paths are never requested.",
                    ],
                    [
                      "Capped and timed",
                      "8 pages, 2 MB per response, a 40-second overall budget.",
                    ],
                    [
                      "Rate-limited API",
                      "Five audits per IP every ten minutes.",
                    ],
                    [
                      "No accounts or keys",
                      "No LLM, no database, no third-party API in the demo path.",
                    ],
                  ].map(([title, detail]) => (
                    <li key={title} className="flex gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal/70" />
                      <div>
                        <p className="text-xs font-medium text-bone">{title}</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                          {detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-line pt-4 font-mono text-[10px] leading-relaxed text-muted">
                  <p>Next.js · Cheerio · Zod · Vitest</p>
                  <p className="mt-1">
                    {sample.stats.checksRun} checks on a{" "}
                    {sample.stats.pagesCrawled}-page run
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section
          id="white-label"
          className="relative scroll-mt-24 overflow-hidden bg-paper text-ink"
        >
          <div className="absolute inset-0 grid-lines-paper opacity-60" aria-hidden />
          <div className="paper-grain absolute inset-0" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:py-28">
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -left-3 top-6 h-full w-full border border-ink/15" aria-hidden />
              <div className="relative border-t-4 border-ink bg-[#fffdf6] p-6 shadow-[0_40px_80px_-40px_rgba(10,11,9,0.4)] sm:p-8">
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: sample.brand.accent }}
                  aria-hidden
                />
                <div className="flex items-center justify-between gap-4 border-b border-ink/15 pb-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-9 place-items-center font-serif text-lg text-ink"
                      style={{ backgroundColor: sample.brand.accent }}
                      aria-hidden
                    >
                      N
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {sample.brand.agencyName}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
                        Web strategy &amp; build
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-ink/40">
                    Confidential
                  </span>
                </div>

                <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
                  Prepared for
                </p>
                <p className="mt-1 font-serif text-2xl leading-tight">
                  {sample.target.host}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink/60">
                  {sample.verdict}
                </p>

                <div className="mt-6 flex items-end justify-between border-y border-ink/15 py-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-ink/45">
                      Overall grade
                    </p>
                    <p className="display mt-1 text-5xl leading-none">
                      {sample.grade}
                      <span className="ml-2 font-sans text-sm tracking-normal text-ink/50">
                        {sample.score}/100 · {sample.gradeLabel}
                      </span>
                    </p>
                  </div>
                  <div className="text-right font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-ink/45">
                    <p>{sample.stats.pagesCrawled} pages</p>
                    <p>{sample.stats.checksRun} checks</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {sample.topIssues.slice(0, 3).map((issue) => (
                    <div key={issue.checkId} className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 border px-1 py-px font-mono text-[8px] uppercase tracking-wider ${
                          issue.severity === "critical"
                            ? "border-ember text-ember"
                            : "border-ink/30 text-ink/60"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <p className="text-[11px] leading-snug text-ink/75">
                        {issue.title}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-ink/15 pt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-ink/45">
                  <span>
                    {sample.brand.senderName} · {sample.brand.agencyName}
                  </span>
                  <span>{new Date(sample.createdAt).toISOString().slice(0, 10)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="kicker text-ember">04 / White-label</p>
              <h2 className="display mt-5 text-balance text-4xl sm:text-5xl lg:text-6xl">
                Your name on the cover. Your accent on every page.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink/65">
                Clinch is infrastructure, not a destination. The prospect never
                sees our name. Add your agency, sender, accent, and logo, and
                the dossier arrives ready to send under your masthead.
              </p>
              <ul className="mt-8 grid gap-4 border-t border-ink/15 pt-6 sm:grid-cols-2">
                {[
                  ["Agency & sender", "Cover, signature, and reply-to."],
                  ["Accent & logo", "Hex accent plus a sanitised raster logo."],
                  ["Booking link", "Your calendar, in every email."],
                  ["PDF handoff", "A print-ready A4 file you can send as-is."],
                ].map(([title, detail]) => (
                  <li key={title}>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Check className="size-3.5 text-ember" aria-hidden />
                      {title}
                    </p>
                    <p className="mt-1 pl-5 text-xs text-ink/55">{detail}</p>
                  </li>
                ))}
              </ul>
              <a
                href="#audit"
                className="group mt-8 inline-flex items-center gap-2 bg-ink px-5 py-3 text-sm text-bone transition hover:bg-ink-raised"
              >
                Run one with your brand
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </a>
              <p className="mt-4 max-w-md text-[11px] leading-relaxed text-ink/45">
                Brand inputs are sanitised: hex-only accents, raster images,
                capped length. Nothing arbitrary is rendered.
              </p>
            </div>
          </div>
        </section>

        <section id="sample" className="scroll-mt-24 bg-signal text-ink">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-10 lg:py-20">
            <div>
              <p className="kicker text-ink/55">The sample dossier</p>
              <h2 className="display mt-4 max-w-2xl text-balance text-4xl sm:text-6xl">
                Judge the work, not the landing page.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink/70">
                The Northwind Dental report was generated by this engine, end to
                end: {sample.stats.pagesCrawled} pages,{" "}
                {sample.stats.checksRun} checks, {sample.issues.length} findings,
                and {sample.stats.criticalCount} critical. Open it, print it,
                read the outreach. Fictional prospect, real output.
              </p>
              <Link
                href="/audit/sample"
                className="group mt-8 inline-flex items-center gap-2 bg-ink px-5 py-3 text-sm text-bone transition hover:bg-ink-raised"
              >
                Open the sample dossier
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px border border-ink/20 bg-ink/15">
              <div className="bg-signal p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/50">
                  Overall
                </p>
                <p className="display mt-2 text-5xl leading-none">
                  {sample.grade}
                  <span className="ml-2 font-sans text-base text-ink/60">
                    {sample.score}
                  </span>
                </p>
              </div>
              <div className="bg-signal p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/50">
                  Findings
                </p>
                <p className="display mt-2 text-5xl leading-none">
                  {sample.issues.length}
                </p>
              </div>
              <div className="bg-signal p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/50">
                  Critical
                </p>
                <p className="display mt-2 text-5xl leading-none">
                  {sample.stats.criticalCount}
                </p>
              </div>
              <div className="bg-signal p-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/50">
                  Checks run
                </p>
                <p className="display mt-2 text-5xl leading-none">
                  {sample.stats.checksRun}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-bone text-ink">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-10 lg:py-20">
            <div>
              <p className="kicker text-ink/55">Done for you</p>
              <h2 className="display mt-4 max-w-2xl text-balance text-4xl sm:text-5xl">
                Clinch is the engine. I can run it for you.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink/65">
                Send five prospect URLs and your brand details. In 48 hours you
                get five white-label dossiers and the outreach to send them —
                reviewed by me, delivered under your name.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/for-agencies"
                  className="group inline-flex items-center gap-2 bg-ink px-5 py-3 text-sm text-bone transition hover:bg-ink-raised"
                >
                  See the agency pilot
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <a
                  href={mailtoHref("Question about the Clinch agency pilot")}
                  className="inline-flex items-center gap-2 border border-ink/25 px-5 py-3 text-sm text-ink/75 transition hover:border-ink/60 hover:text-ink"
                >
                  <Mail className="size-4" aria-hidden />
                  Ask a question
                </a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px border border-ink/20 bg-ink/15">
              {[
                ["05", "dossiers"],
                ["48h", "turnaround"],
                ["€300", "fixed fee"],
              ].map(([value, label]) => (
                <div key={label} className="bg-bone p-4 sm:p-5">
                  <p className="display text-3xl leading-none sm:text-4xl">
                    {value}
                  </p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:px-10 lg:py-20">
            <h2 className="display text-balance text-3xl sm:text-4xl">
              A diagnosis, not a takedown.
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                [
                  "Public pages only",
                  "If it needs a login, Clinch never sees it. No accounts, no private data, no forms submitted.",
                ],
                [
                  "robots.txt is law",
                  "Disallowed paths are skipped before the first request. The crawl announces itself honestly.",
                ],
                [
                  "No scare tactics",
                  "Findings cite the markup and name the fix. No invented screenshots, no fake urgency, no inflated counts.",
                ],
                [
                  "Built to say no",
                  "SSRF guards, response caps, and per-IP limits keep this a demo rather than a weapon.",
                ],
              ].map(([title, body]) => (
                <div key={title} className="border-t border-line pt-4">
                  <h3 className="text-sm font-medium text-bone">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
            <div>
              <Link href="/" className="display text-5xl leading-none">
                Clinch
              </Link>
              <p className="mt-3 max-w-sm text-sm text-bone/50">
                Read the room before you walk into it.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <a href="#what" className="transition hover:text-signal">
                Deliverables
              </a>
              <a href="#how" className="transition hover:text-signal">
                Workflow
              </a>
              <Link href="/for-agencies" className="transition hover:text-signal">
                For agencies
              </Link>
              <Link href="/audit/sample" className="transition hover:text-signal">
                Sample dossier
              </Link>
              <a
                href="https://github.com/momcilosavic1234567-creator/clinch"
                className="flex items-center gap-1 transition hover:text-signal"
                target="_blank"
                rel="noreferrer"
              >
                Source
                <ArrowUpRight className="size-3" aria-hidden />
              </a>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-line pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Momčilo Savić · MIT licensed</p>
            <p>No cookies · no accounts · no analytics</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
