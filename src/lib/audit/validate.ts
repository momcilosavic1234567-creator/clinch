import { z } from "zod";
import { AuditError } from "./types";
import type { AuditInput } from "./types";

const brandSchema = z
  .object({
    agencyName: z.string().max(200).optional(),
    senderName: z.string().max(200).optional(),
    email: z.string().max(200).optional(),
    website: z.string().max(500).optional(),
    bookingUrl: z.string().max(500).optional(),
    accent: z.string().max(20).optional(),
    logoDataUrl: z.string().max(220_000).optional(),
  })
  .strict();

const requestSchema = z
  .object({
    url: z
      .string({
        required_error: "Enter a website address to audit.",
        invalid_type_error: "Enter a website address to audit.",
      })
      .trim()
      .min(1, "Enter a website address to audit.")
      .max(2048, "That website address is too long."),
    brand: brandSchema.optional(),
  })
  .strict();

export function parseAuditRequest(value: unknown): AuditInput {
  const result = requestSchema.safeParse(value);
  if (!result.success) {
    const urlIssue = result.error.issues.find(
      (issue) => issue.path[0] === "url",
    );
    throw new AuditError(
      "INVALID_URL",
      urlIssue?.message ??
        "That request could not be validated. Check the details and try again.",
      400,
    );
  }

  return result.data;
}
