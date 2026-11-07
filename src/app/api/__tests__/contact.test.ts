// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFormToken } from "@/lib/contact/server/token";
import { GET, POST } from "../contact/route";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const KEY = "re_test_key";

// A fresh client IP per request unless a test says otherwise, so the
// module-level limiter never couples tests together.
let ip = 0;
const nextIp = () => `10.1.0.${ip++}`;

const aged = () => createFormToken(KEY, Date.now() - 10_000);
const valid = () => ({
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello there, I liked your portfolio.",
  token: aged(),
  contact_ref: "",
});

const post = (body: unknown, opts: { ip?: string; raw?: string } = {}) =>
  POST(
    new Request("http://test/api/contact", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": opts.ip ?? nextIp(),
      },
      body: opts.raw ?? JSON.stringify(body),
    }),
  );

beforeEach(() => {
  send.mockReset().mockResolvedValue({ data: { id: "1" }, error: null });
  vi.stubEnv("RESEND_API_KEY", KEY);
  vi.stubEnv("CONTACT_TO_EMAIL", "me@example.com");
  vi.stubEnv("CONTACT_FROM_EMAIL", "Site <site@example.com>");
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/contact", () => {
  it("issues a token, uncached", async () => {
    const res = await GET(new Request("http://test/api/contact"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await res.json()).token).toMatch(/^\d+\.[0-9a-f]{64}$/);
  });

  it("is 503 when not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await GET(new Request("http://test/api/contact"))).status).toBe(
      503,
    );
  });
});

describe("POST /api/contact", () => {
  it("sends a plain-text email with reply-to set", async () => {
    const res = await post(valid());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(send).toHaveBeenCalledTimes(1);
    const arg = send.mock.calls[0][0];
    expect(arg).toMatchObject({
      from: "Site <site@example.com>",
      to: "me@example.com",
      replyTo: "ada@example.com",
      subject: "Portfolio contact from Ada Lovelace",
    });
    expect(arg.text).toContain("Hello there");
    expect(arg.html).toBeUndefined();
  });

  it("is 503 and sends nothing when not configured", async () => {
    vi.stubEnv("CONTACT_TO_EMAIL", "");
    expect((await post(valid())).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });

  it("silently drops honeypot submissions", async () => {
    const res = await post({ ...valid(), contact_ref: "http://spam.example" });
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects missing, forged, and too-fast tokens", async () => {
    for (const token of [
      undefined,
      "1.deadbeef",
      createFormToken(KEY, Date.now()),
      createFormToken("other-key", Date.now() - 10_000),
    ]) {
      const res = await post({ ...valid(), token });
      expect(res.status).toBe(400);
      expect((await res.json()).code).toBe("token");
    }
    expect(send).not.toHaveBeenCalled();
  });

  it("returns per-field errors for invalid input", async () => {
    const res = await post({ ...valid(), email: "nope", message: "hi" });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(Object.keys(data.fields).sort()).toEqual(["email", "message"]);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON and non-objects", async () => {
    expect((await post(null, { raw: "{nope" })).status).toBe(400);
    expect((await post(null, { raw: "[]" })).status).toBe(400);
  });

  it("rejects oversized bodies", async () => {
    const res = await post({ ...valid(), message: "a".repeat(40_000) });
    expect(res.status).toBe(413);
  });

  it("rate limits a single client", async () => {
    const same = "10.9.9.9";
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++)
      statuses.push((await post(valid(), { ip: same })).status);
    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("returns a generic 502 when Resend fails, without leaking details", async () => {
    send.mockResolvedValue({
      data: null,
      error: { message: `secret ${KEY} detail`, name: "x" },
    });
    const res = await post(valid());
    expect(res.status).toBe(502);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain(KEY);
    expect(text).not.toContain("detail");
  });

  it("handles a thrown send error the same way", async () => {
    send.mockRejectedValue(new Error("network"));
    expect((await post(valid())).status).toBe(502);
  });
});
