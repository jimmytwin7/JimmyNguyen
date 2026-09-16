"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Light/dark toggle backed by next-themes (see ThemeProvider).
 *
 * Both icons are always rendered and CSS `dark:` variants decide which is
 * visible, so the button's markup never differs between server and client.
 * `mounted` only gates the aria-label, since the resolved theme isn't known
 * during SSR.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggle = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        mounted && resolvedTheme === "dark"
          ? "Switch to light mode"
          : mounted
            ? "Switch to dark mode"
            : "Toggle light and dark mode"
      }
      title="Toggle light and dark mode"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-raised hover:text-app transition-colors"
    >
      {/* Moon shows in light mode (click → dark). */}
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="block dark:hidden"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      {/* Sun shows in dark mode (click → light). */}
      <svg
        aria-hidden="true"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="hidden dark:block"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    </button>
  );
}
