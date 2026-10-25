import { describe, expect, it } from "vitest";
import { parseAuditRequest } from "@/lib/audit/validate";

describe("parseAuditRequest", () => {
  it("accepts a bare URL", () => {
    expect(parseAuditRequest({ url: "  acme.com  " })).toEqual({
      url: "acme.com",
    });
  });

  it("accepts optional branding fields", () => {
    const parsed = parseAuditRequest({
      url: "acme.com",
      brand: {
        agencyName: "Acme Studio",
        senderName: "Mina",
        email: "mina@acme.studio",
        website: "https://acme.studio",
        bookingUrl: "https://acme.studio/call",
        accent: "#ff5c35",
      },
    });

    expect(parsed.brand?.agencyName).toBe("Acme Studio");
    expect(parsed.brand?.accent).toBe("#ff5c35");
  });

  it("rejects a missing or empty URL", () => {
    expect(() => parseAuditRequest({})).toThrow(/website address/i);
    expect(() => parseAuditRequest({ url: "   " })).toThrow(/website address/i);
  });

  it("rejects malformed payloads", () => {
    expect(() => parseAuditRequest("acme.com")).toThrow();
    expect(() => parseAuditRequest({ url: 42 })).toThrow();
    expect(() => parseAuditRequest({ url: "a".repeat(3000) })).toThrow();
  });

  it("rejects unknown top-level fields", () => {
    expect(() =>
      parseAuditRequest({ url: "acme.com", callback: "https://evil.test" }),
    ).toThrow();
  });

  it("rejects an oversized logo payload", () => {
    expect(() =>
      parseAuditRequest({
        url: "acme.com",
        brand: { logoDataUrl: `data:image/png;base64,${"A".repeat(400_000)}` },
      }),
    ).toThrow();
  });

  it("reports a friendly message on failure", () => {
    try {
      parseAuditRequest({ url: "" });
      throw new Error("expected a validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toMatch(/website address/i);
      }
    }
  });
});
