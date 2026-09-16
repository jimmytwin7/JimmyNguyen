"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import NavLink from "@/components/nav/NavLink";
import FocusTrapper from "@/components/ui/FocusTrapper";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/resume", label: "Resume" },
  { href: "/travel", label: "Travel" },
] as const;

const DRAWER_ID = "mobile-nav-drawer";
const ANIM_MS = 300;

export default function NavMobile() {
  const [isOpen, setIsOpen] = useState(false);
  // Keeps the drawer mounted through its closing animation
  const [isMounted, setIsMounted] = useState(false);
  // Drives the slide-in transition after mount
  const [isVisible, setIsVisible] = useState(false);
  // Guards createPortal for SSR — document only exists on the client
  const [portalReady, setPortalReady] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Mount → next frame → slide in. Close → slide out → unmount.
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Wait a frame so the initial (off-screen) styles apply before transitioning
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    setIsVisible(false);
    const timer = setTimeout(() => setIsMounted(false), ANIM_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isMounted) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isMounted]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isMounted) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMounted]);

  const overlay = (
    <FocusTrapper active={isVisible}>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={[
          "fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm",
          "transition-opacity ease-out",
          isVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{ transitionDuration: `${ANIM_MS}ms` }}
      />

      {/* Drawer */}
      <nav
        id={DRAWER_ID}
        aria-label="Mobile navigation"
        className={[
          "fixed top-0 right-0 h-full w-72 max-w-[80vw] z-[101]",
          "bg-surface shadow-2xl flex flex-col",
          "transition-transform ease-out",
          isVisible ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        style={{ transitionDuration: `${ANIM_MS}ms` }}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-line">
          <span className="font-semibold text-lg tracking-tight text-app">
            Menu
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="p-2 -mr-2 rounded-lg text-muted hover:bg-surface-raised hover:text-app transition-colors"
          >
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col p-3 gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <NavLink
                href={href}
                onClick={close}
                className="block py-3 px-4 rounded-lg text-base text-app hover:bg-surface-raised no-underline hover:no-underline"
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </FocusTrapper>
  );

  return (
    <div className="md:hidden">
      {/* Hamburger toggle */}
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={isOpen}
        aria-controls={DRAWER_ID}
        onClick={open}
        className="p-2 rounded-lg text-app hover:bg-surface-raised transition-colors"
      >
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay is portaled to <body> so it escapes the sticky header's
          stacking context and backdrop-filter containing block. */}
      {isMounted && portalReady && createPortal(overlay, document.body)}
    </div>
  );
}
