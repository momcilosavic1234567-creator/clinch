import type { Audit, Issue, Severity } from "@/lib/audit/types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getUTCDate()).padStart(2, "0")} ${
    MONTHS[date.getUTCMonth()]
  } ${date.getUTCFullYear()}`;
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

const severityBadge: Record<Severity, string> = {
  critical: "border-ember/70 bg-ember/[0.08] text-critical",
  high: "border-high/40 bg-high/[0.07] text-high",
  medium: "border-ink/25 text-ink/60",
  low: "border-ink/15 text-ink/45",
};

function pagesSummary(pages: string[], totalPages: number): string {
  if (pages.length === 0) return "Site-wide";
  if (pages.length >= totalPages) return "All audited pages";
  if (pages.length === 1) return pages[0];
  return `${pages.length} pages`;
}

function BrandMark({ brand }: { brand: Audit["brand"] }) {
  if (brand.logoDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logoDataUrl}
        alt={`${brand.agencyName} logo`}
        className="h-8 w-auto max-w-32 object-contain"
      />
    );
  }
  return (
    <span
      className="grid size-9 shrink-0 place-items-center font-serif text-lg leading-none text-ink"
      style={{ backgroundColor: brand.accent }}
      aria-hidden
    >
      {brand.agencyName.trim().charAt(0).toUpperCase() || "A"}
    </span>
  );
}

function Sheet({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`dossier-sheet relative w-full bg-paper px-7 py-10 text-ink shadow-[0_36px_80px_-34px_rgba(0,0,0,0.85)] sm:px-10 sm:py-12 lg:px-12 ${className}`}
    >
      {children}
    </section>
  );
}

function SheetHeader({
  index,
  title,
  host,
}: {
  index: string;
  title: string;
  host: string;
}) {
  return (
    <header className="flex items-start justify-between gap-6 border-b border-ink/20 pb-4">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/45">
          {index}
        </p>
        <h2 className="mt-1 font-serif text-3xl leading-tight">{title}</h2>
      </div>
      <p className="max-w-[12rem] truncate pt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/40">
        {host}
      </p>
    </header>
  );
}

function SheetFooter({ audit, section }: { audit: Audit; section: string }) {
  return (
    <div className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-ink/15 pt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-ink/40">
      <span>
        Prepared by {audit.brand.agencyName} · Confidential
      </span>
      <span>{section}</span>
    </div>
  );
}

function IssueBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-block border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] ${severityBadge[severity]}`}
    >
      {severity}
    </span>
  );
}

export function DossierPages({ audit }: { audit: Audit }) {
  const { brand, target, stats, topIssues, categories, pages } = audit;
  const date = formatDate(audit.createdAt);
  const senderLine = [brand.senderName, brand.agencyName]
    .filter(Boolean)
    .join(" · ");
  const sortedCategories = [...categories].sort((a, b) => b.score - a.score);
  const strongest = sortedCategories[0];
  const weakest = sortedCategories[sortedCategories.length - 1];
  const categoryLabel = (key: Issue["category"]) =>
    categories.find((category) => category.key === key)?.label ?? key;
  const criticalHigh = stats.criticalCount + stats.highCount;
  const coverage = audit.crawl.coverage;
  const notChecked: string[] = [];
  if (coverage) {
    if (coverage.pagesSkipped > 0) {
      notChecked.push(
        `${coverage.pagesSkipped} ${
          coverage.pagesSkipped === 1 ? "page" : "pages"
        } could not be read`,
      );
    }
    if (coverage.pagesBlockedByRobots > 0) {
      notChecked.push(
        `${coverage.pagesBlockedByRobots} disallowed by robots.txt`,
      );
    }
    if (coverage.linksUnverified > 0) {
      notChecked.push(
        `${coverage.linksUnverified} ${
          coverage.linksUnverified === 1 ? "link" : "links"
        } could not be verified`,
      );
    }
  }

  return (
    <div className="dossier-stack space-y-6 lg:space-y-8">
      <Sheet className="flex min-h-[250mm] flex-col">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: brand.accent }}
          aria-hidden
        />
        <header className="mt-6 flex items-start justify-between gap-6 border-b border-ink/20 pb-5">
          <div className="flex items-center gap-3">
            <BrandMark brand={brand} />
            <div>
              <p className="text-sm font-medium">{brand.agencyName}</p>
              {brand.website && (
                <p className="font-mono text-[9px] text-ink/50">
                  {displayUrl(brand.website)}
                </p>
              )}
            </div>
          </div>
          <div className="text-right font-mono text-[8px] uppercase leading-relaxed tracking-[0.16em] text-ink/45">
            <p>Prospect audit</p>
            <p>{date}</p>
            <p>Confidential</p>
          </div>
        </header>

        <div className="mt-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
            Prepared for
          </p>
          <h1 className="dossier-cover-title mt-3 break-words font-serif">
            {target.host}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/70 sm:text-base">
            {audit.verdict}
          </p>
        </div>

        <div className="mt-10 grid gap-8 border-t border-ink/15 pt-8 sm:grid-cols-[auto_1fr] sm:gap-12">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
              Overall grade
            </p>
            <div className="mt-1 flex items-end gap-3">
              <span className="font-serif text-[7rem] leading-[0.8]">
                {audit.grade}
              </span>
              <div className="pb-2">
                <p className="font-serif text-3xl leading-none">{audit.score}</p>
                <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-ink/45">
                  out of 100
                </p>
              </div>
            </div>
            <span className="mt-3 inline-block border border-ink/20 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-ink/55">
              {audit.gradeLabel}
            </span>
          </div>

          <div className="sm:border-l sm:border-ink/15 sm:pl-10">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
              The three that matter most
            </p>
            <ol className="mt-4 space-y-4">
              {topIssues.map((issue, index) => (
                <li
                  key={issue.checkId}
                  className="grid grid-cols-[1.5rem_1fr] gap-3"
                >
                  <span className="font-serif text-lg leading-none text-ink/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <IssueBadge severity={issue.severity} />
                      <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink/40">
                        {categoryLabel(issue.category)}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] font-medium leading-snug">
                      {issue.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-ink/40">
                      {pagesSummary(issue.pagesAffected, pages.length)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-t border-ink/15 pt-6 sm:grid-cols-4">
          {[
            ["Pages audited", String(stats.pagesCrawled)],
            ["Checks run", String(stats.checksRun)],
            ["Findings", String(stats.issuesFound)],
            ["Critical + high", String(criticalHigh)],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink/40">
                {label}
              </p>
              <p className="mt-1 font-serif text-2xl leading-none">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/15 pt-4 font-mono text-[8px] uppercase tracking-[0.14em] text-ink/40">
            <span>Prepared by {senderLine}</span>
            <span>
              {brand.bookingUrl
                ? displayUrl(brand.bookingUrl)
                : brand.email || brand.website
                  ? displayUrl(brand.email || brand.website || "")
                  : "Prospect audit"}
            </span>
          </div>
        </div>
      </Sheet>

      <Sheet>
        <SheetHeader
          index="01 · The read"
          title="Where the site stands"
          host={target.host}
        />
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink/75">
          {audit.summary}
        </p>

        <div className="dossier-summary-grid mt-8 grid gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
              The scores
            </p>
            <div className="mt-4 space-y-4">
              {categories.map((category) => (
                <div key={category.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-medium">{category.label}</p>
                    <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-ink/45">
                      {category.issueCount} issues ·{" "}
                      {Math.round(category.weight * 100)}% weight
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="h-1.5 flex-1 bg-ink/10">
                      <span
                        className="block h-full"
                        style={{
                          width: `${category.score}%`,
                          backgroundColor:
                            category.key === weakest.key
                              ? "#FF5C35"
                              : "#0A0B09",
                        }}
                      />
                    </span>
                    <span className="w-7 text-right font-serif text-lg leading-none">
                      {category.score}
                    </span>
                  </div>
                  {category.criticalCount > 0 && (
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-critical">
                      {category.criticalCount} critical
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <aside className="dossier-summary-aside md:border-l md:border-ink/15 md:pl-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
              At a glance
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              {[
                ["Pages", String(stats.pagesCrawled)],
                ["Checks", String(stats.checksRun)],
                ["Findings", String(stats.issuesFound)],
                ["Critical", String(stats.criticalCount)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-ink/40">
                    {label}
                  </dt>
                  <dd className="mt-1 font-serif text-2xl leading-none">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 space-y-2.5 border-t border-ink/10 pt-4 text-[11px] leading-relaxed text-ink/70">
              {audit.business && (
                <p>
                  <span className="font-medium text-ink">Business type:</span>{" "}
                  {audit.business.confident
                    ? audit.business.label
                    : "not confidently detected, so the advice stays general."}
                </p>
              )}
              <p>
                <span className="font-medium text-ink">Strongest:</span>{" "}
                {strongest.label} at {strongest.score}/100.
              </p>
              <p>
                <span className="font-medium text-ink">Weakest:</span>{" "}
                {weakest.label} at {weakest.score}/100.
              </p>
              {stats.brokenLinks > 0 && (
                <p>
                  <span className="font-medium text-ink">Broken links:</span>{" "}
                  {stats.brokenLinks} of {stats.linkChecks} checked.
                </p>
              )}
              {stats.homepageWeightKb !== null && (
                <p>
                  <span className="font-medium text-ink">Homepage weight:</span>{" "}
                  {(stats.homepageWeightKb / 1000).toFixed(1)} MB.
                </p>
              )}
              <p>
                <span className="font-medium text-ink">Crawl:</span>{" "}
                {audit.crawl.robots === "respected"
                  ? "robots.txt respected"
                  : "robots.txt unavailable"}
                , same origin only.
              </p>
              {notChecked.length > 0 && (
                <p>
                  <span className="font-medium text-ink">Not checked:</span>{" "}
                  {notChecked.join(", ")}.
                </p>
              )}
            </div>
          </aside>
        </div>

        <div className="mt-10 border-t border-ink/15 pt-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
            Pages audited
          </p>
          <div className="mt-2">
            {pages.map((page) => (
              <div
                key={page.path}
                className="grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-3 border-b border-ink/10 py-2 text-[10px]"
              >
                <span className="font-mono text-ink/70">{page.path}</span>
                <span className="truncate text-ink/60">
                  {page.title || "Untitled page"}
                </span>
                <span className="font-mono text-[9px] text-ink/40">
                  {page.issueCount} issues
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-ink/55">
            Scope: public pages only. Pages behind a login, disallowed by
            robots.txt, or that timed out are not audited.
          </p>
        </div>

        <SheetFooter audit={audit} section="Summary" />
      </Sheet>

      <Sheet>
        <SheetHeader
          index="02 · Priority fixes"
          title="The three that move the needle"
          host={target.host}
        />
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/70">
          Ordered by severity, prevalence, and business impact. Clearing these
          three removes the most risk with the least engineering time.
        </p>

        <div className="mt-8">
          {topIssues.map((issue, index) => (
            <article
              key={issue.checkId}
              className="avoid-break border-t border-ink/20 py-6 first:border-t-0 first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-serif text-3xl leading-none text-ink/20">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <IssueBadge severity={issue.severity} />
                      <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink/40">
                        {categoryLabel(issue.category)}
                      </span>
                    </div>
                    <h3 className="mt-1 font-serif text-2xl leading-tight">
                      {issue.title}
                    </h3>
                  </div>
                </div>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink/40">
                  {issue.effort} effort · {issue.impact} impact
                </p>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-[1.05fr_0.95fr] sm:pl-12">
                <div>
                  <p className="text-[11px] leading-relaxed text-ink/70">
                    {issue.why}
                  </p>
                  <div className="mt-2 bg-ink/[0.045] px-3 py-2 font-mono text-[9px] leading-relaxed text-ink/60">
                    {issue.evidence}
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink/40">
                    Fix
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink/75">
                    {issue.fix}
                  </p>
                  <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-ink/40">
                    {pagesSummary(issue.pagesAffected, pages.length)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <SheetFooter audit={audit} section="Priority fixes" />
      </Sheet>

      <Sheet>
        <SheetHeader
          index="03 · Full register"
          title="Every finding, grouped by area"
          host={target.host}
        />
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/70">
          The complete record behind the score: {stats.issuesFound} findings
          across {categories.filter((category) => category.issueCount > 0).length}{" "}
          areas. Each row cites what was observed so nothing depends on trust.
        </p>

        <div className="mt-6">
          {categories.map((category) => {
            const issues = audit.issues.filter(
              (issue) => issue.category === category.key,
            );
            if (issues.length === 0) return null;
            return (
              <section key={category.key} className="avoid-break mt-6">
                <div className="flex items-baseline justify-between gap-3 border-b border-ink/20 pb-2">
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/60">
                    {category.label}
                  </h3>
                  <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-ink/40">
                    {category.score}/100 · {issues.length} findings
                  </p>
                </div>
                {issues.map((issue) => (
                  <div
                    key={issue.checkId}
                    className="avoid-break grid grid-cols-[4.7rem_1fr_auto] gap-3 border-b border-ink/10 py-2.5"
                  >
                    <span>
                      <IssueBadge severity={issue.severity} />
                    </span>
                    <div>
                      <p className="text-[11px] font-medium leading-snug">
                        {issue.title}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-snug text-ink/55">
                        {issue.evidence}
                      </p>
                    </div>
                    <span className="pt-0.5 text-right font-mono text-[8px] uppercase leading-relaxed tracking-[0.06em] text-ink/35">
                      {pagesSummary(issue.pagesAffected, pages.length)}
                    </span>
                  </div>
                ))}
              </section>
            );
          })}
        </div>

        <SheetFooter audit={audit} section="Full register" />
      </Sheet>

      <Sheet>
        <SheetHeader
          index="04 · Action plan"
          title="The next ninety days"
          host={target.host}
        />
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/70">
          A sequence, not a wish list. Stop active leaks first, rebuild the
          foundation second, then compound the gains.
        </p>

        <div className="dossier-plan-grid mt-8 grid gap-6 md:grid-cols-3">
          {audit.actionPlan.map((phase) => (
            <section
              key={phase.key}
              className="avoid-break border-t-2 border-ink pt-4"
            >
              <div className="flex items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.12em]">
                <span>{phase.key}</span>
                <span className="text-ink/45">{phase.window}</span>
              </div>
              <h3 className="mt-2 font-serif text-xl leading-tight">
                {phase.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {phase.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[10px] leading-relaxed text-ink/70"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-ink/20 pt-6">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/45">
              Next step
            </p>
            <p className="mt-1 font-serif text-2xl">
              {brand.bookingUrl
                ? "Book a 15-minute walkthrough."
                : "Reply to talk through the findings."}
            </p>
            <p className="mt-1 font-mono text-[9px] text-ink/55">
              {brand.bookingUrl
                ? displayUrl(brand.bookingUrl)
                : brand.email || displayUrl(brand.website || "")}
            </p>
          </div>
          <BrandMark brand={brand} />
        </div>

        <SheetFooter audit={audit} section="Action plan" />
      </Sheet>
    </div>
  );
}
