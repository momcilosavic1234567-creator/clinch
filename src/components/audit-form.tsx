"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  RotateCcw,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Audit, AuditEvent } from "@/lib/audit/types";

const ACCENTS = [
  { hex: "#D8FF4F", name: "Signal" },
  { hex: "#FF5C35", name: "Ember" },
  { hex: "#8AB4FF", name: "Coast" },
  { hex: "#E7C8A0", name: "Linen" },
  { hex: "#C7B9FF", name: "Iris" },
];

type Phase = "idle" | "running" | "opening" | "error";

interface LogLine {
  id: number;
  tone: "stage" | "page" | "note";
  text: string;
  meta?: string;
}

interface FormError {
  code: string;
  message: string;
}

function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
}

export function AuditForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [brandOpen, setBrandOpen] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [email, setEmail] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [accent, setAccent] = useState(ACCENTS[0].hex);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");
  const [logoError, setLogoError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [error, setError] = useState<FormError | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const logId = useRef(0);
  const nextLogId = () => {
    logId.current += 1;
    return logId.current;
  };
  const startedAt = useRef(0);
  const consoleRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = phase === "running" || phase === "opening";

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      setElapsed(Date.now() - startedAt.current);
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    const node = consoleRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [logs]);

  function pushLog(tone: LogLine["tone"], text: string, meta?: string) {
    setLogs((previous) => {
      const last = previous.at(-1);
      if (last && last.tone === tone && last.text === text) return previous;
      const next = [...previous, { id: nextLogId(), tone, text, meta }];
      return next.length > 60 ? next.slice(-60) : next;
    });
  }

  function reset() {
    setPhase("idle");
    setProgress(0);
    setLogs([]);
    setError(null);
    setElapsed(0);
  }

  function finish(audit: Audit) {
    try {
      window.localStorage.setItem(
        `clinch:audit:${audit.id}`,
        JSON.stringify(audit),
      );
    } catch {
      // The dossier page falls back to browser storage instead.
    }
    setProgress(100);
    setPhase("opening");
    router.push(`/audit/${audit.id}`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const target = url.trim();
    if (!target) {
      setError({
        code: "INVALID_URL",
        message: "Enter a website address to audit.",
      });
      setPhase("error");
      return;
    }

    setPhase("running");
    setProgress(0);
    setLogs([]);
    setError(null);
    setElapsed(0);
    startedAt.current = Date.now();
    pushLog("stage", "Reading the homepage");

    const brand: Record<string, string> = { accent };
    if (agencyName.trim()) brand.agencyName = agencyName.trim();
    if (senderName.trim()) brand.senderName = senderName.trim();
    if (email.trim()) brand.email = email.trim();
    if (bookingUrl.trim()) brand.bookingUrl = bookingUrl.trim();
    if (logoDataUrl) brand.logoDataUrl = logoDataUrl;

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: target, brand }),
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as {
          error?: FormError;
        } | null;
        setError(
          data?.error ?? {
            code: "UNKNOWN",
            message: "The audit could not start. Try again in a moment.",
          },
        );
        setPhase("error");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let sawDone = false;

      while (!sawDone) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          newline = buffer.indexOf("\n");
          if (!line) continue;

          let payload: AuditEvent;
          try {
            payload = JSON.parse(line) as AuditEvent;
          } catch {
            continue;
          }

          if (payload.type === "stage") {
            setProgress((current) => Math.max(current, payload.progress));
            pushLog("stage", payload.message, payload.detail);
          } else if (payload.type === "page") {
            setProgress((current) => Math.max(current, payload.progress));
            pushLog(
              "page",
              payload.path,
              `${payload.status} · ${payload.title || "untitled"}`,
            );
          } else if (payload.type === "error") {
            setError({ code: payload.code, message: payload.message });
            setPhase("error");
            sawDone = true;
          } else if (payload.type === "done") {
            sawDone = true;
            finish(payload.audit);
          }
        }
      }

      if (!sawDone) {
        setError({
          code: "UNKNOWN",
          message:
            "The connection closed before the audit finished. Try again — the site may be slow to respond.",
        });
        setPhase("error");
      }
    } catch {
      setError({
        code: "UNKNOWN",
        message:
          "The audit could not reach the server. Check your connection and try again.",
      });
      setPhase("error");
    }
  }

  function handleLogo(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setLogoError("Use a PNG, JPEG, WebP, or GIF file.");
      return;
    }
    if (file.size > 120_000) {
      setLogoError("Keep the logo under 120 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(String(reader.result));
      setLogoName(file.name);
      setLogoError(null);
    };
    reader.onerror = () => setLogoError("That file could not be read.");
    reader.readAsDataURL(file);
  }

  return (
    <div
      id="audit"
      className="relative border border-line bg-ink-soft/90 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2">
            <span
              className={`absolute inline-flex size-full rounded-full ${
                phase === "running"
                  ? "animate-ping bg-signal/70"
                  : "bg-signal"
              }`}
            />
            <span className="relative inline-flex size-2 rounded-full bg-signal" />
          </span>
          <span className="kicker text-bone/80">Live audit</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {busy ? formatElapsed(elapsed) : "≈ 60 sec"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6">
        <label
          htmlFor="prospect-url"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted"
        >
          Prospect website
        </label>
        <input
          id="prospect-url"
          name="url"
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          required
          maxLength={2048}
          placeholder="northwinddental.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={busy}
          aria-describedby="prospect-url-hint"
          className="mt-2 w-full border border-line-strong bg-ink px-3.5 py-3.5 font-mono text-sm text-bone placeholder:text-muted/60 focus:border-signal focus:outline-none focus:ring-0 disabled:opacity-60"
        />
        <p id="prospect-url-hint" className="mt-2 text-xs text-muted">
          Public homepage. Subpages are discovered automatically.
        </p>

        <button
          type="submit"
          disabled={busy}
          className="group mt-4 flex w-full items-center justify-between gap-3 bg-signal px-4 py-3.5 text-left font-medium text-ink transition hover:bg-bone disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="flex items-center gap-2.5 text-sm">
            {phase === "running" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : phase === "opening" ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <span className="size-1.5 rounded-full bg-ink" aria-hidden />
            )}
            {phase === "running"
              ? "Crawling and scoring…"
              : phase === "opening"
                ? "Opening your dossier"
                : "Audit this website"}
          </span>
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </button>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <Lock className="size-3" aria-hidden />
            Public pages only. Robots.txt respected.
          </span>
          <Link
            href="/audit/sample"
            className="text-bone/70 underline decoration-line-strong underline-offset-4 transition hover:text-signal"
          >
            See a sample
          </Link>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setBrandOpen((open) => !open)}
            aria-expanded={brandOpen}
            aria-controls="brand-panel"
            disabled={busy}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-bone/70">
              White-label it <span className="text-muted">· optional</span>
            </span>
            <ChevronDown
              className={`size-4 text-muted transition-transform ${
                brandOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
          </button>

          {brandOpen && (
            <div id="brand-panel" className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] text-muted">Agency name</span>
                  <input
                    type="text"
                    value={agencyName}
                    maxLength={80}
                    onChange={(event) => setAgencyName(event.target.value)}
                    disabled={busy}
                    placeholder="Northlight Studio"
                    className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-bone placeholder:text-muted/50 focus:border-signal focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-muted">Sender name</span>
                  <input
                    type="text"
                    value={senderName}
                    maxLength={80}
                    onChange={(event) => setSenderName(event.target.value)}
                    disabled={busy}
                    placeholder="Mina Kovac"
                    className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-bone placeholder:text-muted/50 focus:border-signal focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-muted">Reply-to email</span>
                  <input
                    type="email"
                    value={email}
                    maxLength={200}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={busy}
                    placeholder="mina@studio.com"
                    className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-bone placeholder:text-muted/50 focus:border-signal focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-muted">Booking link</span>
                  <input
                    type="url"
                    value={bookingUrl}
                    maxLength={500}
                    onChange={(event) => setBookingUrl(event.target.value)}
                    disabled={busy}
                    placeholder="https://studio.com/call"
                    className="mt-1 w-full border border-line bg-ink px-3 py-2 text-sm text-bone placeholder:text-muted/50 focus:border-signal focus:outline-none"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div>
                  <span className="text-[11px] text-muted">Accent</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    {ACCENTS.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setAccent(swatch.hex)}
                        aria-label={`Use ${swatch.name} accent`}
                        aria-pressed={accent.toLowerCase() === swatch.hex.toLowerCase()}
                        disabled={busy}
                        className={`size-6 rounded-full border-2 transition ${
                          accent.toLowerCase() === swatch.hex.toLowerCase()
                            ? "border-bone"
                            : "border-transparent hover:border-bone/40"
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                      />
                    ))}
                    <label
                      className="relative size-6 cursor-pointer overflow-hidden rounded-full border border-line-strong bg-[conic-gradient(#ff5c35,#d8ff4f,#8ab4ff,#c7b9ff,#ff5c35)] transition hover:border-bone/50"
                      title="Pick a custom accent"
                    >
                      <input
                        type="color"
                        value={accent}
                        onChange={(event) => setAccent(event.target.value)}
                        disabled={busy}
                        aria-label="Custom accent color"
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-muted">Logo</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="sr-only"
                      onChange={(event) => handleLogo(event.target.files?.[0])}
                      disabled={busy}
                    />
                    {logoDataUrl ? (
                      <div className="flex items-center gap-2 border border-line px-2 py-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoDataUrl}
                          alt=""
                          className="h-5 max-w-16 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoDataUrl(null);
                            setLogoName("");
                          }}
                          className="text-muted transition hover:text-ember"
                          aria-label={`Remove ${logoName || "logo"}`}
                          disabled={busy}
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={busy}
                        className="flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[11px] text-bone/75 transition hover:border-bone/40"
                      >
                        <Upload className="size-3" aria-hidden />
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {logoError && (
                <p className="text-[11px] text-ember" role="alert">
                  {logoError}
                </p>
              )}
            </div>
          )}
        </div>
      </form>

      {(phase === "running" || phase === "opening" || logs.length > 0) && (
        <div className="border-t border-line">
          <div className="h-0.5 w-full bg-line">
            <div
              className="h-full bg-signal transition-[width] duration-500"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
          <div className="flex items-center justify-between px-5 pt-3">
            <span className="kicker text-muted">Crawl log</span>
            <span className="font-mono text-[10px] text-signal">
              {Math.round(progress)}%
            </span>
          </div>
          <div
            ref={consoleRef}
            aria-live="polite"
            className="no-scrollbar h-44 overflow-y-auto px-5 pb-4 pt-2 font-mono text-[11px] leading-relaxed"
          >
            {logs.length === 0 && (
              <p className="text-muted">Waiting for the first byte…</p>
            )}
            {logs.map((line) => (
              <div key={line.id} className="flex gap-2 py-0.5">
                <span
                  className={
                    line.tone === "page" ? "text-bone/35" : "text-signal/80"
                  }
                  aria-hidden
                >
                  {line.tone === "page" ? "→" : "◆"}
                </span>
                <p className="min-w-0 flex-1 text-bone/80">
                  <span className={line.tone === "page" ? "text-bone" : ""}>
                    {line.text}
                  </span>
                  {line.meta && (
                    <span className="block truncate text-[10px] text-muted">
                      {line.meta}
                    </span>
                  )}
                </p>
              </div>
            ))}
            {phase === "running" && (
              <p className="mt-1 flex items-center gap-2 text-muted">
                <span className="inline-block h-3 w-1.5 animate-pulse-soft bg-signal" />
                working…
              </p>
            )}
            {phase === "opening" && (
              <p className="mt-1 text-signal">
                Dossier ready. Opening the report…
              </p>
            )}
          </div>
        </div>
      )}

      {phase === "error" && error && (
        <div
          role="alert"
          className="border-t border-ember/40 bg-ember/[0.07] px-5 py-4"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember">
            {error.code === "RATE_LIMITED" ? "Slow down" : "Audit stopped"}
          </p>
          <p className="mt-2 text-sm text-bone/90">{error.message}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-bone transition hover:text-signal"
            >
              <RotateCcw className="size-3" aria-hidden />
              Try another site
            </button>
            <Link
              href="/audit/sample"
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition hover:text-signal"
            >
              Open the sample dossier →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
