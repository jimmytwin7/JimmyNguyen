import type { Metadata } from "next";
import Link from "next/link";
import { Figtree, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Nav from "@/components/nav/Nav";
import CursorDot from "@/components/ui/CursorDot";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ThemeProvider from "@/components/ui/ThemeProvider";

// Figtree — a warm, slightly rounded sans for body text. Keeps the
// `--font-geist-sans` CSS variable name so globals.css and the font-sans
// utility pick it up without further changes.
const fontSans = Figtree({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Space Grotesk — a geometric grotesque for expressive editorial headings.
// globals.css maps --font-space-grotesk to the `font-display` utility.
const fontDisplay = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// JetBrains Mono — for small technical metadata: section numbers, dates,
// labels, and tech tags. Mapped to the `font-mono` utility in globals.css.
const fontMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://heyjimmynguyen.com";
const SITE_TITLE = "Jimmy Nguyen";
const SITE_DESCRIPTION =
  "Hey I'm Jimmy Nguyen, software engineer. Explore my work, an interactive travel map, and the things I'm into.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    type: "website",
    // Controls the image shown when the link is shared. header-icon.png is
    // ~square (921x922), so cards that expect a wide image may crop it.
    images: [
      {
        url: "/header-icon.png",
        width: 921,
        height: 922,
        alt: "Jimmy Nguyen logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/header-icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable}`}
    >
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <ThemeProvider>
          <CursorDot />
          <header className="sticky top-0 z-30 border-b border-line bg-surface/80 backdrop-blur-sm">
            <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center font-display font-semibold text-lg tracking-tight text-app"
              >
                <img
                  src="/header-icon.png"
                  alt="Hey Jimmy Nguyen"
                  className="h-9 w-auto"
                />
                <span className="pl-2">Jimmy Nguyen</span>
              </Link>
              <div className="flex items-center gap-2">
                <Nav />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
