import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContactForm from "../ContactForm";

const fetchMock = vi.fn();

const reply = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );

beforeEach(() => {
  fetchMock
    .mockReset()
    .mockImplementation((_url, init?: RequestInit) =>
      init?.method === "POST"
        ? reply(200, { ok: true })
        : reply(200, { token: "tok.en" }),
    );
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Name"), "Ada");
  await user.type(screen.getByLabelText("Email"), "ada@example.com");
  await user.type(
    screen.getByLabelText("Message"),
    "Hello there, nice portfolio.",
  );
};

describe("ContactForm", () => {
  it("fetches a token on mount and sends it with the message", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await screen.findByText("Thanks, your message was sent."),
    ).toBeVisible();
    const post = fetchMock.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(JSON.parse(post[1].body)).toEqual({
      name: "Ada",
      email: "ada@example.com",
      message: "Hello there, nice portfolio.",
      token: "tok.en",
      website: "",
    });
    expect(screen.getByLabelText("Name")).toHaveValue("");
  });

  it("shows linked errors and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    const name = screen.getByLabelText("Name");
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Enter your name.");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      /valid email/i,
    );
    expect(fetchMock.mock.calls.some(([, i]) => i?.method === "POST")).toBe(
      false,
    );

    // Editing a field clears its error.
    await user.type(name, "Ada");
    expect(name).not.toHaveAttribute("aria-invalid");
  });

  it("announces a server failure and keeps the message", async () => {
    fetchMock.mockImplementation((_url, init?: RequestInit) =>
      init?.method === "POST"
        ? reply(502, { error: "Couldn't send your message." })
        : reply(200, { token: "tok.en" }),
    );
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Couldn't send your message.",
    );
    expect(screen.getByLabelText("Message")).toHaveValue(
      "Hello there, nice portfolio.",
    );
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  });

  it("refreshes the token after a token error", async () => {
    let posts = 0;
    fetchMock.mockImplementation((_url, init?: RequestInit) => {
      if (init?.method === "POST") {
        posts++;
        return reply(400, { error: "The form timed out.", code: "token" });
      }
      return reply(200, { token: "tok.en" });
    });
    const user = userEvent.setup();
    render(<ContactForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByText("The form timed out.");
    expect(posts).toBe(1);
    // mount fetch + refresh after the token error
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([, i]) => i?.method !== "POST"),
      ).toHaveLength(2),
    );
  });

  it("hides the honeypot from assistive tech and the tab order", () => {
    render(<ContactForm />);
    const trap = document.getElementById("contact-website")!;
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ContactForm />);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } }, // jsdom can't compute it
    });
    expect(results.violations).toEqual([]);
  });
});
