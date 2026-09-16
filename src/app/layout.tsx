import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Nav from "@/components/nav/Nav";
import CursorDot from "@/components/ui/CursorDot";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ThemeProvider from "@/components/ui/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jimmy Nguyen",
  description:
    "Personal portfolio of Jimmy Nguyen — software engineer, traveler, and builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <CursorDot />
          <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-sm">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="font-semibold text-lg tracking-tight"
                style={{ color: "var(--accent)" }}
              >
                Jimmy Nguyen
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
