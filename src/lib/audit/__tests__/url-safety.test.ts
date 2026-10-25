import { describe, expect, it } from "vitest";
import {
  isPrivateHostname,
  isPrivateIp,
  normalizeAndValidateUrl,
  type HostLookup,
} from "@/lib/audit/url-safety";

const publicLookup: HostLookup = async () => [
  { address: "93.184.216.34", family: 4 },
];

const privateLookup: HostLookup = async () => [
  { address: "10.0.0.5", family: 4 },
];

describe("normalizeAndValidateUrl", () => {
  it("adds https to a bare domain and normalizes the root path", async () => {
    const url = await normalizeAndValidateUrl("example.com", { lookup: publicLookup });
    expect(url.toString()).toBe("https://example.com/");
  });

  it("preserves path and query while dropping the hash", async () => {
    const url = await normalizeAndValidateUrl("https://example.com/services?ref=pitch#top", {
      lookup: publicLookup,
    });
    expect(url.toString()).toBe("https://example.com/services?ref=pitch");
  });

  it.each(["javascript:alert(1)", "data:text/html,hi", "ftp://example.com", "file:///etc/passwd"])(
    "rejects unsafe scheme %s",
    async (input) => {
      await expect(normalizeAndValidateUrl(input, { lookup: publicLookup })).rejects.toMatchObject({
        code: "INVALID_URL",
      });
    },
  );

  it("rejects credentials embedded in the URL", async () => {
    await expect(
      normalizeAndValidateUrl("https://user:pass@example.com", { lookup: publicLookup }),
    ).rejects.toMatchObject({ code: "INVALID_URL" });
  });

  it("rejects non-standard ports but allows 443", async () => {
    await expect(
      normalizeAndValidateUrl("https://example.com:8443", { lookup: publicLookup }),
    ).rejects.toMatchObject({ code: "INVALID_URL" });

    const allowed = await normalizeAndValidateUrl("https://example.com:443/path", {
      lookup: publicLookup,
    });
    expect(allowed.port).toBe("");
  });

  it.each([
    "http://localhost",
    "http://app.localhost:8080/admin",
    "http://printer.local",
    "https://metadata.google.internal",
  ])("blocks private hostnames: %s", async (input) => {
    await expect(normalizeAndValidateUrl(input, { lookup: publicLookup })).rejects.toMatchObject({
      code: "PRIVATE_HOST",
    });
  });

  it("blocks a public hostname that resolves to a private address", async () => {
    await expect(
      normalizeAndValidateUrl("https://internal.example.com", { lookup: privateLookup }),
    ).rejects.toMatchObject({ code: "PRIVATE_HOST" });
  });

  it("fails closed when any resolved address is private", async () => {
    const mixedLookup: HostLookup = async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "192.168.1.20", family: 4 },
    ];
    await expect(
      normalizeAndValidateUrl("https://rebind.example.com", { lookup: mixedLookup }),
    ).rejects.toMatchObject({ code: "PRIVATE_HOST" });
  });

  it("allows private hosts only with an explicit test override", async () => {
    const url = await normalizeAndValidateUrl("http://127.0.0.1:4310/fixture", {
      allowPrivateHosts: true,
    });
    expect(url.toString()).toBe("http://127.0.0.1:4310/fixture");
  });

  it("reports DNS failures as unreachable", async () => {
    const failingLookup: HostLookup = async () => {
      throw new Error("ENOTFOUND");
    };
    await expect(
      normalizeAndValidateUrl("https://does-not-exist.example", { lookup: failingLookup }),
    ).rejects.toMatchObject({ code: "UNREACHABLE" });
  });
});

describe("isPrivateIp", () => {
  it.each([
    "0.0.0.0",
    "10.1.2.3",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.0.1",
    "192.0.2.10",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "fe80::1",
    "fd12:3456::1",
    "ff02::1",
    "2001:db8::1",
    "::ffff:127.0.0.1",
  ])("treats %s as private or reserved", (address) => {
    expect(isPrivateIp(address)).toBe(true);
  });

  it.each(["8.8.8.8", "93.184.216.34", "172.32.0.1", "2606:4700:4700::1111"])(
    "treats public address %s as allowed",
    (address) => {
      expect(isPrivateIp(address)).toBe(false);
    },
  );
});

describe("isPrivateHostname", () => {
  it.each(["localhost", "foo.localhost", "printer.local", "metadata.google.internal", "intranet.lan"])(
    "identifies %s as private",
    (host) => {
      expect(isPrivateHostname(host)).toBe(true);
    },
  );

  it("does not flag a normal public host", () => {
    expect(isPrivateHostname("northwinddental.com")).toBe(false);
  });
});
