"use client";

import { useEffect, useState, type ReactNode } from "react";

interface TypewriterProps {
  /** The full text to type out. */
  text: string;
  /** Milliseconds per character. Higher = slower. */
  speed?: number;
  /** Wait this many ms after mount before typing begins (e.g. to follow another line). */
  startDelay?: number;
  /**
   * Custom caret that follows the typed text and stays after typing ends.
   * Omit to use the default thin bar, which only shows while animating.
   */
  caret?: ReactNode;
}

export default function Typewriter({
  text,
  speed = 100,
  startDelay = 0,
  caret,
}: TypewriterProps) {
  // Start with the full text so SSR and the first client render match (no
  // hydration mismatch) and it's readable if JS is slow/off.
  const [count, setCount] = useState(text.length);
  const [animate, setAnimate] = useState(false);
  // Gate typing until the start delay has elapsed.
  const [started, setStarted] = useState(false);

  // Enable the animation only after mount, and only if motion is allowed.
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;
    setCount(0);
    setAnimate(true);
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!animate || !started) return;
    // Type once, character by character. No loop — stops when complete.
    if (count >= text.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [animate, started, count, text.length, speed]);

  const shown = text.slice(0, count);
  const typing = animate && count < text.length;

  const cursor =
    caret ??
    (animate ? (
      <span
        className={`inline-block w-[0.08em] -mb-[0.05em] ${
          typing ? "" : "animate-pulse"
        }`}
        aria-hidden="true"
        style={{
          borderRight: "0.08em solid currentColor",
          marginLeft: "0.05em",
        }}
      />
    ) : null);

  return (
    // Both layers share one grid cell. The invisible full-text layer holds the
    // box at its final size from the first frame, so typing never changes the
    // layout — neighbors (like the vertically centered headshot) don't shift
    // as new lines wrap in.
    <span className="inline-grid">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {text}
        {cursor}
      </span>
      {/* Visible, animated text. aria-hidden while animating so screen readers
          don't hear the partial string on every keystroke. */}
      <span
        aria-hidden={animate ? true : undefined}
        className="col-start-1 row-start-1"
      >
        {shown}
        {cursor}
      </span>
      {/* Full text for assistive tech, visually hidden while animating. */}
      {animate && <span className="sr-only">{text}</span>}
    </span>
  );
}
