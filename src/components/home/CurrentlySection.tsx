"use client";

import { useState, useEffect } from "react";
import {
  Hammer,
  Brain,
  Map as MapIcon,
  HeartPulse,
  Plane,
  type LucideIcon,
} from "lucide-react";

interface CurrentlyItem {
  icon: LucideIcon;
  label: string;
  value: string;
}

const ITEMS: CurrentlyItem[] = [
  { icon: Hammer, label: "Building", value: "Travel Map" },
  { icon: Brain, label: "Learning", value: "AWS Services" },
  { icon: MapIcon, label: "Exploring", value: "Maps & data visualization" },
  { icon: HeartPulse, label: "Recovering from", value: "Broken collarbone" },
  { icon: Plane, label: "Planning", value: "Indonesia and Japan" },
];

const HOLD_MS = 3000; // how long each item sits centered
const SLIDE_MS = 550; // slide duration between items
const N = ITEMS.length;

/**
 * "Currently" carousel. Shows three items at a time on sm+ — the center one
 * sharp, the left/right neighbors blurred and dimmed as a peek — advancing one
 * step every few seconds. Below sm it falls back to a single centered item
 * (three thirds is too cramped to read on a phone).
 *
 * Infinite loop: the list is padded with a clone of the last item at the front
 * and the first item at the end, so the active item always has real neighbors.
 * `active` runs 0..N over the real items; when it steps onto the trailing clone
 * we let the slide finish, then silently snap back to 0.
 */
export default function CurrentlySection() {
  const [active, setActive] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => a + 1), HOLD_MS);
    return () => clearInterval(id);
  }, []);

  // Stepped onto the trailing clones (active === N): finish the slide, then
  // reset to 0 with the transition off so the jump is invisible.
  useEffect(() => {
    if (active !== N) return;
    const t = setTimeout(() => {
      setAnimate(false);
      setActive(0);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => {
    if (animate) return;
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  // Pad with the last TWO items at the front and the first TWO at the back.
  // Two clones each side (not one) means the centered item in the 3-up view
  // always has a real neighbor on BOTH sides — including when we slide onto a
  // trailing clone during the loop reset, which is what caused the stutter with
  // single-clone padding. Real item k sits at padded index k + 2.
  const padded = [ITEMS[N - 2], ITEMS[N - 1], ...ITEMS, ITEMS[0], ITEMS[1]];

  // Track shift (in item-widths) before the responsive clone offset (--lead)
  // is added in CSS. See the transform below and globals.css for the geometry.
  const step = active;

  return (
    // The heading ("01 — Currently") and live dot live in the page's editorial
    // label, which also labels this region, so there's no inner heading here.
    <div className="rounded-2xl border border-line bg-surface px-4 py-5 sm:p-8">
      {/* Viewport. On mobile each item is full width (1-up); on sm+ each item is
          a third, so the active item is flanked by blurred neighbors.

          `--slot` is one item width as a % of the track, swapped at the
          breakpoint (100 on mobile, 33.333 on sm+), so the transform shifts by
          whole items in either layout. */}
      <div className="currently-carousel relative h-14 overflow-hidden sm:h-16">
        <div
          className="flex h-full"
          style={
            {
              // --slot = one item width (% of track); --lead = clone offset in
              // slots (two front clones now). Both swap at the sm breakpoint
              // (see globals.css):
              //   mobile 1-up: slot 100%, lead 2 → active item at the left edge
              //   sm+ 3-up:    slot 33.3%, lead 1 → active item in the centre
              //                slot, flanked by real neighbors on both sides
              transform: `translateX(calc((${step} + var(--lead)) * var(--slot) * -1%))`,
              transition: animate
                ? `transform ${SLIDE_MS}ms ease-in-out`
                : "none",
            } as React.CSSProperties
          }
        >
          {padded.map((item, i) => {
            const Icon = item.icon;
            // Two front clones, so real item k is at padded index k + 2.
            const isActive = i === active + 2;
            return (
              <div
                key={`${item.label}-${i}`}
                // Full width on mobile, a third on sm+ (the 3-up view).
                // Left-aligned on mobile to match the editorial left edge;
                // centered on sm+ where the active item sits between neighbors.
                className="flex h-full w-full shrink-0 items-center justify-start gap-3 px-2 transition-all duration-500 sm:w-1/3 sm:justify-center sm:gap-4"
                style={{
                  opacity: isActive ? 1 : 0.2,
                }}
                aria-hidden={isActive ? undefined : true}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--accent) 12%, transparent)",
                    color: "var(--accent)",
                  }}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-xs font-medium uppercase tracking-wide text-faint">
                    {item.label}
                  </span>
                  <span className="truncate text-base font-semibold text-app sm:text-lg">
                    {item.value}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
