"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Client wrapper around next-themes.
 *
 * next-themes owns the pre-paint script that restores the saved theme and puts
 * the `dark` class on <html>, which is what the CSS tokens in globals.css key
 * off. Rolling that script by hand is deceptively hard — it has to mutate the
 * DOM before React hydrates without breaking hydration — so we use the library.
 *
 * `enableSystem={false}` keeps it to an explicit light/dark choice (default
 * light) rather than following the OS setting.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
