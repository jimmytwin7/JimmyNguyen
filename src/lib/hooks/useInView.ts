"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveal-on-scroll hook. Returns a ref to attach to an element and a boolean
 * that flips to true the first time the element scrolls into view, then stays
 * true (reveal animations shouldn't replay on scroll-up).
 *
 * Starts `true` when IntersectionObserver is unavailable or the user prefers
 * reduced motion, so content is never hidden behind an animation that won't run.
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  // Negative bottom margin shrinks the observer's effective viewport so an
  // element only counts as "in view" once it's scrolled a good way up, not the
  // instant its top edge peeks in. This makes the reveal animation actually
  // visible instead of firing while the element is already on screen.
  rootMargin = "0px 0px -25% 0px",
) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // reveal once, then stop observing
        }
      },
      { rootMargin },
    );
    observer.observe(el);

    // Safety net for the last element only: one pinned near the bottom of the
    // document may never scroll far enough up to cross a negative-bottom-margin
    // threshold, so it could stay invisible forever. If the page is already
    // scrolled to (or past) the point where no further scroll is possible and
    // the element is on screen, reveal it. This never fires for elements the
    // user simply hasn't reached yet, because there's still scroll room.
    const revealIfUnreachable = () => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const atPageBottom =
        scrollBottom >= document.documentElement.scrollHeight - 2;
      if (!atPageBottom) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setInView(true);
        observer.disconnect();
        window.removeEventListener("scroll", revealIfUnreachable);
      }
    };
    window.addEventListener("scroll", revealIfUnreachable, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", revealIfUnreachable);
    };
  }, [rootMargin]);

  return { ref, inView };
}
