import { clientKey, createRateLimiter } from "@/lib/cooking/rate-limit";
import { getSubstitutions } from "@/lib/cooking/server/substitution-service";
import {
  MAX_SUBSTITUTION_BODY_BYTES,
  parseSubstitutionRequest,
} from "@/lib/cooking/validation";

/**
 * POST /api/substitutions
 * Body: { recipeTitle, missing: string[], available?: string[], diet?: string[] }
 *
 * 200 SubstitutionResponse (dictionary lookup — always succeeds once validated)
 * | 400 invalid body | 413 too large | 429 rate limited.
 */

// Tighter than search: this endpoint accepts a request body, so keep the
// per-IP ceiling low as a guard against abuse. (In-memory, per-instance — a
// runaway-loop guard, not a strict global limit; see rate-limit.ts.)
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!limiter(clientKey(request))) {
    return json({ error: "Too many requests — try again in a minute." }, 429);
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_SUBSTITUTION_BODY_BYTES) {
    return json({ error: "Request is too large." }, 413);
  }

  let body: unknown;
  try {
    const text = await request.text();
    // Measure actual UTF-8 bytes, not UTF-16 code units, so multibyte input
    // can't slip past the limit unnoticed.
    if (new TextEncoder().encode(text).length > MAX_SUBSTITUTION_BODY_BYTES) {
      return json({ error: "Request is too large." }, 413);
    }
    body = JSON.parse(text);
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  const parsed = parseSubstitutionRequest(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  return json(await getSubstitutions(parsed.value));
}
