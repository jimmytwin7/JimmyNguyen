"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_MESSAGE_LENGTH,
  parseContactInput,
  type ContactErrors,
  type ContactField,
} from "@/lib/contact/validation";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success" }
  | { kind: "error"; message: string };

interface ApiError {
  error?: string;
  code?: string;
  fields?: ContactErrors;
}

const FIELD_ORDER: ContactField[] = ["name", "email", "message"];

const controlClass =
  "mt-2 block w-full rounded-lg border border-muted bg-transparent px-3 py-2.5 text-base text-app aria-[invalid=true]:border-red-700 dark:aria-[invalid=true]:border-red-400";
const errorClass = "mt-1.5 text-sm font-medium text-red-700 dark:text-red-400";

/**
 * The home page's contact form. Rendered only when the server has Resend
 * configured (see src/app/page.tsx), so it never offers a dead end.
 *
 * Spam handling lives on the server; this component supplies two of the
 * signals: a signed "form opened" token fetched on mount, and a honeypot field
 * that real visitors can't reach or see.
 */
export default function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const token = useRef<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const loadToken = useCallback(async () => {
    token.current = null;
    try {
      const res = await fetch("/api/contact", { cache: "no-store" });
      if (!res.ok) return;
      const data: { token?: string } = await res.json();
      token.current = data.token ?? null;
    } catch {
      // Submitting without a token fails with a clear message instead.
    }
  }, []);

  useEffect(() => {
    void loadToken();
  }, [loadToken]);

  const focusFirstInvalid = (found: ContactErrors) => {
    const first = FIELD_ORDER.find((f) => found[f]);
    if (first === "name") nameRef.current?.focus();
    else if (first === "email") emailRef.current?.focus();
    else if (first === "message") messageRef.current?.focus();
  };

  const onChange =
    (field: ContactField) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      // Clear a field's error as soon as the visitor edits it.
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.kind === "sending") return;

    const parsed = parseContactInput(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setStatus({ kind: "idle" });
      focusFirstInvalid(parsed.errors);
      return;
    }
    setErrors({});
    setStatus({ kind: "sending" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.value,
          token: token.current,
          contact_ref: honeypot,
        }),
      });

      if (res.ok) {
        setValues({ name: "", email: "", message: "" });
        setStatus({ kind: "success" });
        void loadToken();
        return;
      }

      const data: ApiError = await res.json().catch(() => ({}));
      if (data.fields) {
        setErrors(data.fields);
        focusFirstInvalid(data.fields);
      }
      if (data.code === "token") void loadToken();
      setStatus({
        kind: "error",
        message: data.error ?? "Couldn't send your message. Try again.",
      });
    } catch {
      setStatus({
        kind: "error",
        message: "Couldn't reach the server. Check your connection and retry.",
      });
    }
  };

  const sending = status.kind === "sending";
  const describedBy = (field: ContactField) =>
    errors[field] ? `contact-${field}-error` : undefined;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="contact-form-heading"
      className="max-w-xl"
    >
      <h3
        id="contact-form-heading"
        className="font-display text-lg font-semibold text-app"
      >
        Send me a message
      </h3>
      <p className="mt-1 text-sm text-muted">
        All fields are required. I&apos;ll reply to the email you give here.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="contact-name" className="editorial-meta">
            Name
          </label>
          <input
            ref={nameRef}
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            value={values.name}
            onChange={onChange("name")}
            className={controlClass}
          />
          {errors.name && (
            <p id="contact-name-error" className={errorClass}>
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="editorial-meta">
            Email
          </label>
          <input
            ref={emailRef}
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            value={values.email}
            onChange={onChange("email")}
            className={controlClass}
          />
          {errors.email && (
            <p id="contact-email-error" className={errorClass}>
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-message" className="editorial-meta">
            Message
          </label>
          <textarea
            ref={messageRef}
            id="contact-message"
            name="message"
            rows={6}
            required
            aria-required="true"
            maxLength={MAX_MESSAGE_LENGTH}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message")}
            value={values.message}
            onChange={onChange("message")}
            className={`${controlClass} resize-y`}
          />
          {errors.message && (
            <p id="contact-message-error" className={errorClass}>
              {errors.message}
            </p>
          )}
        </div>

        {/* Honeypot: off-screen, unreachable by keyboard, hidden from
            assistive tech. Only a bot filling every input will touch it. */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
          <label htmlFor="contact-ref">Leave this field empty</label>
          <input
            id="contact-ref"
            name="contact_ref"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={sending}
          aria-disabled={sending}
          className="inline-flex min-h-11 items-center rounded-lg bg-[var(--accent)] px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none dark:text-slate-950"
        >
          {sending ? "Sending…" : "Send message"}
        </button>

        {/* Always mounted so screen readers announce changes to it. */}
        <p
          role="status"
          aria-live="polite"
          className={
            status.kind === "error"
              ? "text-sm font-medium text-red-700 dark:text-red-400"
              : "text-sm font-medium text-app"
          }
        >
          {status.kind === "success" && "Thanks, your message was sent."}
          {status.kind === "error" && status.message}
        </p>
      </div>
    </form>
  );
}
