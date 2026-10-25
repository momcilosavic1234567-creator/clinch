"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Tone = "ink" | "paper";

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  tone = "paper",
  className = "",
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  tone?: Tone;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = text;
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

    setStatus(ok ? "copied" : "failed");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 2200);
  }

  const palette =
    tone === "ink"
      ? "border-ink/25 text-ink/75 hover:border-ink hover:text-ink"
      : "border-line text-bone/70 hover:border-bone/50 hover:text-bone";

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition ${palette} ${className}`}
    >
      {status === "copied" ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
      <span aria-live="polite">
        {status === "copied" ? copiedLabel : status === "failed" ? "Copy failed" : label}
      </span>
    </button>
  );
}
