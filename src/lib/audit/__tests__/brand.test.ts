import { describe, expect, it } from "vitest";
import { createAuditId, sanitizeBrand } from "@/lib/audit/brand";
import { DEFAULT_BRAND } from "@/lib/audit/types";

describe("sanitizeBrand", () => {
  it("falls back to defaults when nothing is supplied", () => {
    expect(sanitizeBrand()).toEqual(DEFAULT_BRAND);
  });

  it("trims copy and drops empty optional fields", () => {
    const brand = sanitizeBrand({
      agencyName: "  Northlight Studio  ",
      senderName: "   ",
      email: "  ",
      website: "",
      bookingUrl: undefined,
      accent: "#ff5c35",
    });

    expect(brand.agencyName).toBe("Northlight Studio");
    expect(brand.senderName).toBeUndefined();
    expect(brand.email).toBeUndefined();
    expect(brand.website).toBeUndefined();
    expect(brand.bookingUrl).toBeUndefined();
    expect(brand.accent).toBe("#ff5c35");
  });

  it("accepts only hex accents", () => {
    expect(sanitizeBrand({ accent: "#abc" }).accent).toBe("#abc");
    expect(sanitizeBrand({ accent: "#D8FF4F" }).accent).toBe("#D8FF4F");
    expect(sanitizeBrand({ accent: "red" }).accent).toBe(DEFAULT_BRAND.accent);
    expect(sanitizeBrand({ accent: "#12345g" }).accent).toBe(
      DEFAULT_BRAND.accent,
    );
    expect(sanitizeBrand({ accent: "#D8FF4F; background:url(x)" }).accent).toBe(
      DEFAULT_BRAND.accent,
    );
  });

  it("keeps only http and https links", () => {
    expect(sanitizeBrand({ website: "https://acme.studio/work" }).website).toBe(
      "https://acme.studio/work",
    );
    expect(sanitizeBrand({ website: "http://acme.studio" }).website).toBe(
      "http://acme.studio/",
    );
    expect(
      sanitizeBrand({ bookingUrl: "javascript:alert(1)" }).bookingUrl,
    ).toBeUndefined();
    expect(sanitizeBrand({ website: "not a url" }).website).toBeUndefined();
  });

  it("validates the sender email", () => {
    expect(sanitizeBrand({ email: "mina@studio.co" }).email).toBe(
      "mina@studio.co",
    );
    expect(sanitizeBrand({ email: "mina at studio" }).email).toBeUndefined();
  });

  it("accepts only safe raster logos under the size cap", () => {
    const logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
    expect(sanitizeBrand({ logoDataUrl: logo }).logoDataUrl).toBe(logo);
    expect(
      sanitizeBrand({ logoDataUrl: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=" })
        .logoDataUrl,
    ).toBeUndefined();
    expect(
      sanitizeBrand({ logoDataUrl: "javascript:alert(1)" }).logoDataUrl,
    ).toBeUndefined();
    expect(
      sanitizeBrand({
        logoDataUrl: `data:image/png;base64,${"A".repeat(200_001)}`,
      }).logoDataUrl,
    ).toBeUndefined();
  });

  it("caps the agency name at a sane length", () => {
    const brand = sanitizeBrand({ agencyName: "A".repeat(120) });
    expect(brand.agencyName.length).toBe(80);
  });
});

describe("createAuditId", () => {
  it("produces a URL-safe id stamped with the audit date", () => {
    const id = createAuditId(new Date("2026-10-25T09:30:00.000Z"));

    expect(id).toMatch(/^20261025-[a-z0-9]{6,16}$/);
    expect(encodeURIComponent(id)).toBe(id);
  });

  it("does not repeat", () => {
    const date = new Date("2026-10-25T09:30:00.000Z");
    expect(createAuditId(date)).not.toBe(createAuditId(date));
  });
});
