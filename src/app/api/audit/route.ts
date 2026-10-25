import { NextResponse, type NextRequest } from "next/server";
import { runAudit } from "@/lib/audit/run-audit";
import { saveAudit } from "@/lib/audit/store";
import type { Audit, AuditErrorCode, AuditEvent } from "@/lib/audit/types";
import { AuditError } from "@/lib/audit/types";
import { parseAuditRequest } from "@/lib/audit/validate";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "local";
}

function errorBody(code: AuditErrorCode, message: string) {
  return { error: { code, message } };
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      errorBody("INVALID_URL", "Enter a website address to audit."),
      { status: 400 },
    );
  }

  let input;
  try {
    input = parseAuditRequest(payload);
  } catch (error) {
    const auditError =
      error instanceof AuditError
        ? error
        : new AuditError(
            "INVALID_URL",
            "That request could not be validated. Check the details and try again.",
            400,
          );
    return NextResponse.json(errorBody(auditError.code, auditError.message), {
      status: auditError.statusCode,
    });
  }

  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      errorBody(
        "RATE_LIMITED",
        `That is a lot of audits at once. Try again in ${Math.ceil(
          limit.retryAfterSeconds / 60,
        )} minute${limit.retryAfterSeconds > 90 ? "s" : ""}.`,
      ),
      {
        status: 429,
        headers: { "retry-after": String(limit.retryAfterSeconds) },
      },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: AuditEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          closed = true;
        }
      };

      try {
        let done: { type: "done"; audit: Audit } | null = null;
        const audit = await runAudit(input, {
          onEvent(event) {
            if (event.type === "done") {
              done = event;
              return;
            }
            send(event);
          },
        });
        await saveAudit(audit);
        send(done ?? { type: "done", audit });
      } catch (error) {
        const auditError =
          error instanceof AuditError
            ? error
            : new AuditError(
                "UNKNOWN",
                "The audit stopped before it finished. Please try again.",
                500,
              );
        send({
          type: "error",
          code: auditError.code,
          message: auditError.message,
        });
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          // Client disconnected mid-stream.
        }
      }
    },
    cancel() {
      // The crawl cannot be aborted yet; the stream simply stops accepting writes.
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
      "x-ratelimit-limit": "5",
      "x-ratelimit-remaining": String(limit.remaining),
    },
  });
}
