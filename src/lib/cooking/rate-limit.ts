/**
 * Minimal fixed-window rate limiter keyed by client id (IP).
 *
 * In-memory and per server instance: on Vercel each warm function instance has
 * its own counter, so this is a cheap guard against accidental hammering (e.g.
 * a stuck retry loop), not a security boundary. A shared store would be needed
 * for strict limits.
 */
export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string, now = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      // Opportunistic cleanup so the map can't grow without bound.
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
      }
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count += 1;
    return true;
  };
}

/** Best-effort client id from proxy headers. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon"
  );
}
