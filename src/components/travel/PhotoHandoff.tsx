"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { animate, motion, useIsPresent, useMotionValue } from "framer-motion";
import type { TravelLocation } from "@/lib/travel/types";
import { cloudinaryLoader } from "@/lib/travel/cloudinary-loader";
import { frameFor, frameSizes } from "@/lib/travel/masonry";
import {
  holdRect,
  lerpRect,
  scrollTargetFor,
  squareAt,
  type Rect,
} from "@/lib/travel/handoff";

// Sequence pacing, in seconds.
const GROW_SECONDS = 0.5;
const HOLD_SECONDS = 0.6;
const TRAVEL_SECONDS = 0.9;
const SETTLE_SECONDS = 0.2;
/** Fade when the sequence is cancelled (new selection, reset, user input). */
const CANCEL_FADE_SECONDS = 0.15;

/** The photo starts as a square this size (px) on the pin. */
const GROW_START_SIZE = 24;
/** Gap left between the sticky site header and the panel after scrolling. */
const PANEL_GAP = 24;

// Any of these from the visitor cancels the sequence and leaves them where
// they are.
const CANCEL_EVENTS = [
  "wheel",
  "touchstart",
  "keydown",
  "pointerdown",
] as const;

const toRect = (r: DOMRect): Rect => ({
  left: r.left,
  top: r.top,
  width: r.width,
  height: r.height,
});

const firstTile = (panel: HTMLElement | null) =>
  panel?.querySelector<HTMLElement>('[data-photo-index="0"]') ?? null;

/**
 * Where to scroll so the photo panel sits just under the sticky site header,
 * with its first photo fully on screen. Shared with the reduced-motion path,
 * which jumps straight there.
 */
export function panelScrollTarget(panel: HTMLElement): number {
  const scrollY = window.scrollY;
  const header = document.querySelector("body > header");
  const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
  const tile = firstTile(panel)?.getBoundingClientRect();
  return scrollTargetFor({
    panelTop: panel.getBoundingClientRect().top + scrollY,
    tileTop: tile ? tile.top + scrollY : undefined,
    tileBottom: tile ? tile.bottom + scrollY : undefined,
    viewportHeight: window.innerHeight,
    maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    topGap: headerBottom + PANEL_GAP,
    bottomGap: PANEL_GAP,
  });
}

interface PhotoHandoffProps {
  location: TravelLocation;
  /**
   * False while the map is still flying: the frame stays invisible, but its
   * photo is already loading. True once the camera lands: the sequence runs.
   */
  started: boolean;
  /** The map's wrapper, containing the pins (`data-pin-id`). */
  mapRef: RefObject<HTMLElement | null>;
  /** The photo panel, containing the tiles (`data-photo-index`). */
  panelRef: RefObject<HTMLElement | null>;
  /** The sequence finished, or the visitor cancelled it. */
  onDone: () => void;
}

/**
 * Decorative hand-off from the map to the photo panel: the place's first photo
 * grows out of its pin into a large frame over the map, holds, then rides the
 * scroll down and lands exactly on the first tile of the masonry, where it
 * fades away over the real one.
 *
 * Purely visual. It's aria-hidden, takes no pointer events, holds nothing
 * focusable, and never moves focus; the aria-live panel is still what
 * announces the selection. It is deliberately not the Lightbox, which is a
 * modal that takes focus. Rendered with position: fixed inside the travel page
 * (no ancestor sets a transform or filter), so it keeps the .travel-stage
 * tokens, and under the sticky site header (z-30), like page content.
 *
 * With no photos it renders nothing and just runs the scroll. Never mounted
 * under reduced motion; the page jumps straight to the panel instead.
 */
export default function PhotoHandoff({
  location,
  started,
  mapRef,
  panelRef,
  onDone,
}: PhotoHandoffProps) {
  const photo = location.photos[0] ?? null;
  const isPresent = useIsPresent();

  const left = useMotionValue(0);
  const top = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const opacity = useMotionValue(0);

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    // Exiting (a new selection or reset replaced this one): stop at once and
    // let the exit fade play.
    if (!isPresent) return;

    let cancelled = false;
    let current: { stop: () => void } | null = null;

    const setRect = (r: Rect) => {
      left.set(r.left);
      top.set(r.top);
      width.set(r.width);
      height.set(r.height);
    };
    const rectNow = (): Rect => ({
      left: left.get(),
      top: top.get(),
      width: width.get(),
      height: height.get(),
    });

    const removeListeners = () =>
      CANCEL_EVENTS.forEach((type) =>
        window.removeEventListener(type, cancelByUser),
      );
    const stopAll = () => {
      cancelled = true;
      current?.stop();
      removeListeners();
    };
    function cancelByUser() {
      stopAll();
      onDoneRef.current();
    }
    // Listen from mount, not just once the sequence starts: a visitor who
    // starts scrolling while the map is still flying shouldn't be pulled back
    // down when it lands. (The click or key press that made the selection has
    // already happened by the time this mounts.)
    CANCEL_EVENTS.forEach((type) =>
      window.addEventListener(type, cancelByUser, { passive: true }),
    );
    if (!started) return stopAll;

    // One step of the sequence. Resolves true when it finishes, false if it
    // was cancelled first (a stopped animation never completes).
    const step = (
      seconds: number,
      ease: "easeInOut" | "easeOut" | "linear",
      onUpdate: (t: number) => void,
    ) =>
      new Promise<boolean>((resolve) => {
        current = animate(0, 1, {
          duration: seconds,
          ease,
          onUpdate,
          onComplete: () => resolve(!cancelled),
        });
      });

    const run = async () => {
      const panel = panelRef.current;
      const tile = firstTile(panel);

      if (photo) {
        // Grow from the pin into the hold frame over the map.
        const tileRect = tile?.getBoundingClientRect();
        const aspect =
          tileRect && tileRect.height > 0
            ? tileRect.width / tileRect.height
            : 4 / 3;
        const map = mapRef.current?.getBoundingClientRect();
        const hold = holdRect({
          map: map
            ? toRect(map)
            : {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight,
              },
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          aspect,
        });

        const pin = Array.from(
          mapRef.current?.querySelectorAll<SVGGElement>("[data-pin-id]") ?? [],
        )
          .find((el) => el.dataset.pinId === location.id)
          ?.getBoundingClientRect();
        const pinOnScreen =
          pin && pin.bottom > 0 && pin.top < window.innerHeight;
        const start = pinOnScreen
          ? squareAt(
              pin.left + pin.width / 2,
              pin.top + pin.height / 2,
              GROW_START_SIZE,
            )
          : squareAt(
              hold.left + hold.width / 2,
              hold.top + hold.height / 2,
              GROW_START_SIZE,
            );

        setRect(start);
        opacity.set(1);
        if (
          !(await step(GROW_SECONDS, "easeOut", (t) =>
            setRect(lerpRect(start, hold, t)),
          ))
        ) {
          return;
        }
        if (!(await step(HOLD_SECONDS, "linear", () => {}))) return;
      }

      // Travel: scroll the page on a timer (scrollIntoView's speed is the
      // browser's choice) and re-measure the tile every frame, so the photo
      // lands exactly on it while the page moves underneath.
      if (panel) {
        const startY = window.scrollY;
        const targetY = panelScrollTarget(panel);
        const from = rectNow();
        const travelled = await step(TRAVEL_SECONDS, "easeInOut", (t) => {
          window.scrollTo({
            top: startY + (targetY - startY) * t,
            behavior: "instant",
          });
          const live = tile?.getBoundingClientRect();
          if (photo && live) setRect(lerpRect(from, toRect(live), t));
        });
        if (!travelled) return;
      }

      // Settle: fade away over the real tile.
      if (photo) {
        const live = tile?.getBoundingClientRect();
        if (live) setRect(toRect(live));
        if (!(await step(SETTLE_SECONDS, "easeOut", (t) => opacity.set(1 - t))))
          return;
      }

      removeListeners();
      onDoneRef.current();
    };

    void run();
    return stopAll;
  }, [
    started,
    isPresent,
    photo,
    location.id,
    mapRef,
    panelRef,
    left,
    top,
    width,
    height,
    opacity,
  ]);

  if (!photo) return null;

  const frame = frameFor(0, location.photos.length);
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed z-20 overflow-hidden bg-surface-raised bg-cover bg-center"
      style={{
        left,
        top,
        width,
        height,
        opacity,
        backgroundImage: `url(${photo.blurUrl})`,
      }}
      exit={{ opacity: 0, transition: { duration: CANCEL_FADE_SECONDS } }}
    >
      {/* Same `sizes` as the first tile, so this loads the derivative the tile
          will show, while the map is still flying. Eager, because the frame is
          invisible until then and would otherwise be lazy-skipped. */}
      <Image
        src={photo.url}
        loader={cloudinaryLoader}
        alt=""
        fill
        loading="eager"
        sizes={frameSizes(frame)}
        className="object-cover"
      />
    </motion.div>
  );
}
