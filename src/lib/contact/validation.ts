/**
 * Contact form validation. Pure and client-safe: the form uses it for instant
 * feedback, and the route re-runs it because client checks are never trusted.
 */

export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_MESSAGE_LENGTH = 10;
export const MAX_MESSAGE_LENGTH = 2000;
/** Generous for a 2000-char message in multibyte text plus the other fields. */
export const MAX_CONTACT_BODY_BYTES = 16 * 1024;

export type ContactField = "name" | "email" | "message";

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export type ContactErrors = Partial<Record<ContactField, string>>;

export type ContactParseResult =
  { ok: true; value: ContactInput } | { ok: false; errors: ContactErrors };

// Characters that never belong in a name or an address: C0/C1 controls
// (including CR/LF and DEL), the Unicode line/paragraph separators, and the
// bidi embedding/override/isolate controls (e.g. U+202E) that can make a
// subject line or "From:" line read differently than it is. Keeping them out
// stops header injection and display spoofing at the source.
const CONTROL_CHARS =
  /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;
// Deliberately simple: one @, no spaces, a dot in the domain. The real check
// is whether the mail bounces.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Characters that would let an address carry a display name or a second
// address once it lands in Reply-To or the body's "From:" line.
const EMAIL_FORBIDDEN = /[<>()[\]",;:\\]/;

/** Validate untrusted input. Returns trimmed values or per-field errors. */
export function parseContactInput(input: unknown): ContactParseResult {
  const raw =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const name = str(raw.name);
  const email = str(raw.email);
  // Normalize line endings so the length limit counts a newline once.
  const message = str(raw.message).replace(/\r\n?/g, "\n");

  const errors: ContactErrors = {};

  if (!name) errors.name = "Enter your name.";
  else if (name.length > MAX_NAME_LENGTH)
    errors.name = `Keep your name under ${MAX_NAME_LENGTH} characters.`;
  else if (CONTROL_CHARS.test(name))
    errors.name = "Your name can't contain line breaks or control characters.";

  if (!email) errors.email = "Enter your email address.";
  else if (
    email.length > MAX_EMAIL_LENGTH ||
    CONTROL_CHARS.test(email) ||
    EMAIL_FORBIDDEN.test(email) ||
    !EMAIL_SHAPE.test(email)
  )
    errors.email = "Enter a valid email address, like name@example.com.";

  if (message.length < MIN_MESSAGE_LENGTH)
    errors.message = `Write at least ${MIN_MESSAGE_LENGTH} characters.`;
  else if (message.length > MAX_MESSAGE_LENGTH)
    errors.message = `Keep your message under ${MAX_MESSAGE_LENGTH} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, email, message } };
}
