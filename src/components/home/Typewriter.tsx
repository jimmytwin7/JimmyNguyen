"use client";

import { useEffect, useState } from "react";

interface TypewriterProps {
  /** The full text to type out. */
  text: string;
  /** Milliseconds per character. Higher = slower. */
  speed?: number;
}

export default function Typewriter({ text, speed = 140 }: TypewriterProps) {
  // Start with the full text so SSR and the first client render match (no
  // hydration mismatch) and it's readable if JS is slow/off.
  const [count, setCount] = useState(text.length);
  const [animate, setAnimate] = useState(false);

  // Enable the animation only after mount, and only if motion is allowed.
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;
    setCount(0);
    setAnimate(true);
  }, []);

  useEffect(() => {
    if (!animate) return;
    // Type once, character by character. No loop — stops when complete.
    if (count >= text.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [animate, count, text.length, speed]);

  const shown = text.slice(0, count);
  const typing = animate && count < text.length;

  return (
    <>
      {/* Visible, animated text. aria-hidden so screen readers don't hear the
          partial string on every keystroke. */}
      <span aria-hidden={animate ? true : undefined}>
        {shown}
        {animate && (
          <span
            className={`inline-block w-[0.08em] -mb-[0.05em] self-stretch ${
              typing ? "" : "animate-pulse"
            }`}
            aria-hidden="true"
            style={{
              borderRight: "0.08em solid currentColor",
              marginLeft: "0.05em",
            }}
          />
        )}
      </span>
      {/* Full text for assistive tech, visually hidden while animating. */}
      {animate && <span className="sr-only">{text}</span>}
    </>
  );
}
