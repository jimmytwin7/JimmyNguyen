"use client";

import { useEffect, useRef, useState } from "react";

// How much of the remaining distance to close each frame (0–1).
// Lower = more lag / longer trail. Higher = snappier.
const EASE = 0.25;

export default function CursorDot() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Skip on touch / no fine pointer devices
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    if (!dot) return;

    // Target = actual mouse position. Current = eased dot position.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { ...target };
    let raf = 0;

    const move = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      setVisible(true);
    };

    const tick = () => {
      // Ease current toward target
      current.x += (target.x - current.x) * EASE;
      current.y += (target.y - current.y) * EASE;
      dot.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };

    const hide = () => setVisible(false);
    const show = () => setVisible(true);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", hide);
    window.addEventListener("mouseenter", show);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", hide);
      window.removeEventListener("mouseenter", show);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-10 w-10 rounded-full transition-opacity duration-200"
      style={{
        backgroundColor: "var(--color-brand-500)",
        opacity: visible ? 1 : 0,
      }}
    />
  );
}
