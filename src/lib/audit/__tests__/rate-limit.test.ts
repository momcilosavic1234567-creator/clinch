import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit";

const MINUTE = 60_000;

beforeEach(() => {
  resetRateLimits();
});

describe("checkRateLimit", () => {
  it("allows five audits per window and blocks the sixth", () => {
    const now = Date.UTC(2026, 9, 25, 12, 0, 0);

    for (let index = 0; index < 5; index += 1) {
      expect(checkRateLimit("203.0.113.7", now + index * 100).allowed).toBe(
        true,
      );
    }

    const blocked = checkRateLimit("203.0.113.7", now + 600);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts each address separately", () => {
    const now = Date.UTC(2026, 9, 25, 12, 0, 0);

    for (let index = 0; index < 5; index += 1) {
      checkRateLimit("198.51.100.1", now);
    }

    expect(checkRateLimit("198.51.100.2", now).allowed).toBe(true);
  });

  it("forgets requests outside the window", () => {
    const now = Date.UTC(2026, 9, 25, 12, 0, 0);

    for (let index = 0; index < 5; index += 1) {
      checkRateLimit("192.0.2.9", now);
    }
    expect(checkRateLimit("192.0.2.9", now + MINUTE).allowed).toBe(false);
    expect(checkRateLimit("192.0.2.9", now + 11 * MINUTE).allowed).toBe(true);
  });
});
