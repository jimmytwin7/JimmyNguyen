import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Server-only. A signed "form opened at" timestamp, one of the spam layers.
 *
 * The browser fetches a token when the form mounts (the home page is static,
 * so the time can't be baked into the HTML). The route rejects submissions
 * that arrive too fast, too late, or with a token it didn't sign. A bot that
 * never runs the page's JavaScript has no token at all.
 *
 * The HMAC key is the Resend API key, so no extra secret is needed. Rotating
 * the key simply invalidates open forms.
 */

export const MIN_FILL_MS = 3_000;
export const MAX_AGE_MS = 60 * 60 * 1000;

export type TokenCheck = "ok" | "invalid" | "too-fast" | "expired";

const sign = (secret: string, issuedAt: string) =>
  createHmac("sha256", secret).update(`contact:${issuedAt}`).digest("hex");

export function createFormToken(secret: string, now = Date.now()): string {
  const issuedAt = String(now);
  return `${issuedAt}.${sign(secret, issuedAt)}`;
}

export function checkFormToken(
  secret: string,
  token: unknown,
  now = Date.now(),
): TokenCheck {
  if (typeof token !== "string" || token.length > 200) return "invalid";
  const [issuedAt, signature, ...rest] = token.split(".");
  if (!issuedAt || !signature || rest.length > 0 || !/^\d+$/.test(issuedAt))
    return "invalid";

  const expected = Buffer.from(sign(secret, issuedAt));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    return "invalid";

  const age = now - Number(issuedAt);
  if (age < MIN_FILL_MS) return "too-fast";
  if (age > MAX_AGE_MS) return "expired";
  return "ok";
}
