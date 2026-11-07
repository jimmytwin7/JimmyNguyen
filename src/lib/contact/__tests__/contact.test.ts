// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getContactConfig } from "../server/config";
import {
  checkFormToken,
  createFormToken,
  MAX_AGE_MS,
  MIN_FILL_MS,
} from "../server/token";
import {
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  parseContactInput,
} from "../validation";

const good = {
  name: "  Ada Lovelace ",
  email: " ada@example.com ",
  message: "Hello there, I liked your portfolio.",
};

describe("parseContactInput", () => {
  it("trims and accepts valid input", () => {
    expect(parseContactInput(good)).toEqual({
      ok: true,
      value: {
        name: "Ada Lovelace",
        email: "ada@example.com",
        message: "Hello there, I liked your portfolio.",
      },
    });
  });

  it("reports every missing field", () => {
    const r = parseContactInput({});
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(Object.keys(r.errors).sort()).toEqual([
        "email",
        "message",
        "name",
      ]);
  });

  it("rejects non-object and non-string input", () => {
    expect(parseContactInput(null).ok).toBe(false);
    expect(parseContactInput({ name: 1, email: [], message: {} }).ok).toBe(
      false,
    );
  });

  it("rejects bad emails and header-injection attempts", () => {
    for (const email of ["nope", "a@b", "a b@c.com", "a@c.com\nBcc: x@y.com"]) {
      const r = parseContactInput({ ...good, email });
      expect(r.ok, email).toBe(false);
    }
  });

  it("rejects emails that could carry a display name or second address", () => {
    for (const email of [
      '"x"<a@b.com>',
      "Name<a@b.com>",
      "a@b.com,c",
      "a@b.com;c",
      "a(b)@c.com",
      "a@[1.2.3.4]",
      "a\\@b.com",
      "a@b.com:c",
      "a@b.com>",
      "a@b.c\u202eom",
    ]) {
      expect(parseContactInput({ ...good, email }).ok, email).toBe(false);
    }
  });

  it("accepts ordinary real-world emails", () => {
    for (const email of [
      "ada+tag@example.co.uk",
      "o'brien@example.com",
      "first.last@sub-domain.example.com",
    ]) {
      expect(parseContactInput({ ...good, email }).ok, email).toBe(true);
    }
  });

  it("rejects control, separator and bidi characters in the name", () => {
    for (const ch of ["\n", "\u202e", "\u2028", "\u2029", "\u0085", "\u2066"]) {
      const r = parseContactInput({ ...good, name: `Ada${ch}Lovelace` });
      expect(r.ok, JSON.stringify(ch)).toBe(false);
    }
  });

  it("accepts non-ASCII letters in the name", () => {
    for (const name of ["José Núñez", "李雷", "Zoë O'Neil-Smith"]) {
      expect(parseContactInput({ ...good, name }).ok, name).toBe(true);
    }
  });

  it("enforces length limits", () => {
    expect(
      parseContactInput({ ...good, name: "a".repeat(MAX_NAME_LENGTH + 1) }).ok,
    ).toBe(false);
    expect(parseContactInput({ ...good, message: "short" }).ok).toBe(false);
    expect(
      parseContactInput({
        ...good,
        message: "a".repeat(MAX_MESSAGE_LENGTH + 1),
      }).ok,
    ).toBe(false);
  });

  it("keeps newlines in the message", () => {
    const r = parseContactInput({ ...good, message: "line one\r\nline two!" });
    expect(r.ok && r.value.message).toBe("line one\nline two!");
  });
});

describe("form token", () => {
  const secret = "test-secret";
  const t0 = 1_000_000;
  const token = createFormToken(secret, t0);

  it("accepts a token within the allowed window", () => {
    expect(checkFormToken(secret, token, t0 + MIN_FILL_MS)).toBe("ok");
    expect(checkFormToken(secret, token, t0 + MAX_AGE_MS)).toBe("ok");
  });

  it("rejects too-fast and expired submissions", () => {
    expect(checkFormToken(secret, token, t0 + 500)).toBe("too-fast");
    expect(checkFormToken(secret, token, t0 + MAX_AGE_MS + 1)).toBe("expired");
  });

  it("rejects tampered, foreign, and malformed tokens", () => {
    const [ts, sig] = token.split(".");
    expect(checkFormToken("other", token, t0 + 5000)).toBe("invalid");
    expect(checkFormToken(secret, `${Number(ts) - 9000}.${sig}`, t0)).toBe(
      "invalid",
    );
    for (const bad of [undefined, null, 5, "", "abc", "1.2.3", "x.y", `${ts}.`])
      expect(checkFormToken(secret, bad, t0 + 5000), String(bad)).toBe(
        "invalid",
      );
  });
});

describe("getContactConfig", () => {
  const all = {
    RESEND_API_KEY: "re_key",
    CONTACT_TO_EMAIL: "me@example.com",
    CONTACT_FROM_EMAIL: "Site <site@example.com>",
  };

  it("returns the config only when all three values are set", () => {
    expect(getContactConfig(all)).toEqual({
      apiKey: "re_key",
      to: "me@example.com",
      from: "Site <site@example.com>",
    });
    for (const key of Object.keys(all)) {
      expect(getContactConfig({ ...all, [key]: undefined }), key).toBeNull();
      expect(getContactConfig({ ...all, [key]: "  " }), key).toBeNull();
    }
    expect(getContactConfig({})).toBeNull();
  });
});
