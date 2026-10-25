const WINDOW_MS = 10 * 60_000;
const MAX_REQUESTS = 5;

const requests = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  now = Date.now(),
): RateLimitResult {
  const recent = (requests.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );

  if (recent.length >= MAX_REQUESTS) {
    const oldest = recent[0];
    requests.set(key, recent);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
      ),
    };
  }

  recent.push(now);
  requests.set(key, recent);

  if (requests.size > 2_000) {
    for (const [candidate, timestamps] of requests) {
      if (now - (timestamps.at(-1) ?? 0) > WINDOW_MS) {
        requests.delete(candidate);
      }
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - recent.length,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimits(): void {
  requests.clear();
}
