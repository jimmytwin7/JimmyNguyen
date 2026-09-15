"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Routes where the cursor dot is hidden (e.g. the interactive map). */
const DISABLED_ROUTES = ["/travel"];

export default function CursorDot() {
  const pathname = usePathname();
  const disabled = DISABLED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const dotRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (disabled) return;
    // Skip on touch / no fine pointer devices
    if (!window.matchMedia("(pointer: fine)").matches) return;
    // Respect users who prefer reduced motion — don't show the dot at all
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current;
    if (!dot) return;

    let raf = 0;
    const move = (e: MouseEvent) => {
      // Only touch the DOM once per frame; no perpetual loop.
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      });
      setVisible(true);
    };

    const hide = () => setVisible(false);
    const show = () => setVisible(true);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", hide);
    window.addEventListener("mouseenter", show);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", hide);
      window.removeEventListener("mouseenter", show);
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-10 w-10 rounded-full"
      style={{
        backgroundColor: "var(--color-brand-500)",
        opacity: visible ? 0.6 : 0,
        // CSS does the smoothing — cheap, runs on the compositor.
        transition: "transform 120ms ease-out, opacity 200ms ease-out",
      }}
    />
  );
}
