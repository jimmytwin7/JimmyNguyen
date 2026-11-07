/**
 * Server-only. The contact form is optional: it exists only when all three
 * values are set. Never import this from a client component.
 */

export interface ContactConfig {
  apiKey: string;
  to: string;
  from: string;
}

/** The Resend config, or null when any of the three values is missing. */
export function getContactConfig(
  env: Record<string, string | undefined> = process.env,
): ContactConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const to = env.CONTACT_TO_EMAIL?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim();
  if (!apiKey || !to || !from) return null;
  return { apiKey, to, from };
}

/** For the home page: only a boolean, never the values themselves. */
export function isContactConfigured(): boolean {
  return getContactConfig() !== null;
}
