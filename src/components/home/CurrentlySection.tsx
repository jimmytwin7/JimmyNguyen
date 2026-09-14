"use client";

import { useState, useEffect } from "react";

interface CurrentlyItem {
  emoji: string;
  label: string;
  value: string;
}

const ITEMS: CurrentlyItem[] = [
  { emoji: "🛠️", label: "Building", value: "Travel Map" },
  { emoji: "🧠", label: "Learning", value: "AWS Services" },
  { emoji: "🗺️", label: "Exploring", value: "Maps & data visualization" },
  { emoji: "🩼", label: "Recovering from", value: "Broken collarbone" },
  { emoji: "✈️", label: "Planning", value: "Southeast Asia Trip" },
];

const INTERVAL_MS = 3000;
const SLIDE_MS = 500;
const ROW_REM = 4; // height of a single row in rem

export default function CurrentlySection() {
  // index runs 0..ITEMS.length (one past the end lands on the duplicated first item)
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => i + 1);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // When we slide onto the duplicated first item (index === length), let the
  // animation finish, then snap back to the real first item with no transition.
  useEffect(() => {
    if (index !== ITEMS.length) return;
    const timer = setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index]);

  // Re-enable the transition on the next frame after a silent reset.
  useEffect(() => {
    if (animate) return;
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  // Duplicate so there's always a previous/next item to show and slide into.
  const loopItems = [...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <section
      aria-labelledby="currently-heading"
      className="rounded-2xl shadow-lg border border-gray-100 bg-white p-6 sm:p-8"
    >
      <h2
        id="currently-heading"
        className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4"
      >
        Currently
      </h2>

      {/* Viewport: 3 rows tall, active item centered */}
      <div
        className="relative overflow-hidden"
        style={{
          height: `${ROW_REM * 3}rem`,
          // Soft fade at top and bottom edges
          maskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
        }}
        aria-live="polite"
      >
        <ul
          className="absolute inset-x-0 top-0 ease-in-out"
          style={{
            // Offset so the active item (index) sits in the middle slot.
            // +ITEMS.length keeps us in the middle copy for headroom above.
            transform: `translateY(-${(index + ITEMS.length - 1) * ROW_REM}rem)`,
            transition: animate ? `transform ${SLIDE_MS}ms` : "none",
          }}
        >
          {loopItems.map((item, i) => {
            // Which position is currently the active (center) row?
            const activeRow = index + ITEMS.length;
            const isActive = i === activeRow;
            return (
              <li
                key={`${item.label}-${i}`}
                className="flex items-center gap-4 transition-opacity duration-500"
                style={{
                  height: `${ROW_REM}rem`,
                  opacity: isActive ? 1 : 0.35,
                }}
                aria-hidden={isActive ? undefined : true}
              >
                <span className="text-3xl shrink-0" aria-hidden="true">
                  {item.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    {item.label}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 truncate">
                    {item.value}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
