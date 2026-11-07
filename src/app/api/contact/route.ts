import { Resend } from "resend";
import { clientKey, createRateLimiter } from "@/lib/cooking/rate-limit";
import { getContactConfig } from "@/lib/contact/server/config";
import { checkFormToken, createFormToken } from "@/lib/contact/server/token";
import {
  MAX_CONTACT_BODY_BYTES,
  parseContactInput,
} from "@/lib/contact/validation";

/**
 * GET  /api/contact -> { token }  A signed "form opened" timestamp.
 * POST /api/contact
 * Body: { name, email, message, token, website }  (`website` is the honeypot)
 *
 * 200 { ok: true } | 400 invalid body, fields or token | 413 too large
 * | 429 rate limited | 502 send failed | 503 not configured.
 *
 * Spam layers: honeypot, signed minimum-fill-time token, per-IP rate limit,
 * strict validation and a body size cap. The limiter is in-memory and per
 * serverless instance, so it's a guard against floods, not a strict boundary
 * (see rate-limit.ts). Errors are generic and never echo the key or Resend's
 * response.
 */

const sendLimiter = createRateLimiter({ limit: 3, windowMs: 10 * 60_000 });
const tokenLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const unavailable = () =>
  json({ error: "The contact form is unavailable.", retryable: false }, 503);

export async function GET(request: Request) {
  const config = getContactConfig();
  if (!config) return unavailable();
  if (!tokenLimiter(clientKey(request))) {
    return json(
      { error: "Too many requests. Try again in a minute.", retryable: true },
      429,
    );
  }
  return json({ token: createFormToken(config.apiKey) });
}

export async function POST(request: Request) {
  const config = getContactConfig();
  if (!config) return unavailable();

  if (!sendLimiter(clientKey(request))) {
    return json(
      {
        error: "Too many messages. Please try again in a few minutes.",
        retryable: true,
      },
      429,
    );
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_CONTACT_BODY_BYTES) {
    return json({ error: "Request is too large.", retryable: false }, 413);
  }

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    // Measure real UTF-8 bytes, not UTF-16 code units.
    if (new TextEncoder().encode(text).length > MAX_CONTACT_BODY_BYTES) {
      return json({ error: "Request is too large.", retryable: false }, 413);
    }
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return json(
      { error: "Request body must be valid JSON.", retryable: false },
      400,
    );
  }

  // Honeypot: real visitors never see or fill this field. Pretend it worked so
  // the bot learns nothing, and send nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return json({ ok: true });
  }

  const tokenState = checkFormToken(config.apiKey, body.token);
  if (tokenState !== "ok") {
    return json(
      {
        error:
          tokenState === "too-fast"
            ? "That was quick. Give it a moment and send again."
            : "The form timed out. Send again to continue.",
        retryable: true,
        code: "token",
      },
      400,
    );
  }

  const parsed = parseContactInput(body);
  if (!parsed.ok) {
    return json(
      {
        error: "Check the highlighted fields.",
        retryable: false,
        fields: parsed.errors,
      },
      400,
    );
  }
  const { name, email, message } = parsed.value;

  try {
    const { error } = await new Resend(config.apiKey).emails.send({
      from: config.from,
      to: config.to,
      replyTo: email,
      // Fixed text plus a name that validation kept free of control chars.
      subject: `Portfolio contact from ${name}`,
      // Plain text only: nothing the visitor typed is ever rendered as HTML.
      text: `From: ${name} <${email}>\n\n${message}\n`,
    });
    if (error) throw new Error("send failed");
  } catch {
    return json(
      {
        error: "Couldn't send your message. Please try again shortly.",
        retryable: true,
      },
      502,
    );
  }

  return json({ ok: true });
}
