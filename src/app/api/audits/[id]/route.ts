import { NextResponse } from "next/server";
import { loadAudit } from "@/lib/audit/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const audit = await loadAudit(id);

  if (!audit) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "That audit does not exist or has expired.",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json(audit, {
    headers: {
      "cache-control": id === "sample" ? "public, max-age=300" : "no-store",
    },
  });
}
