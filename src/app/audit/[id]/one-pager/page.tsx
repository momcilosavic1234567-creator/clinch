import type { Metadata } from "next";
import { OnePager } from "@/components/dossier/one-pager";
import { OnePagerFallback } from "@/components/dossier/one-pager-fallback";
import { loadAudit } from "@/lib/audit/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const audit = await loadAudit(id);

  return {
    title: audit
      ? `One-page check — ${audit.target.host}`
      : "One-page website check",
    description:
      "A single-page summary of the three findings that matter most, ready to print.",
    robots: { index: false, follow: false },
  };
}

export default async function OnePagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await loadAudit(id);

  if (!audit) {
    return <OnePagerFallback id={id} />;
  }

  return <OnePager audit={audit} isSample={id === "sample"} />;
}
