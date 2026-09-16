"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import type { TravelPhoto } from "@/lib/travel/types";

interface LightboxProps {
  photos: TravelPhoto[];
  /** Index of the photo to show, or null when closed. */
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  /** Location name, for alt text. */
  locationName: string;
}

/**
 * A single mounted image layer. Kept in the DOM (even when not active) so its
 * bytes are downloaded and decoded ahead of time — switching to it is then just
 * an opacity flip, which is instant. A blurred placeholder sits behind until
 * the full image reports `load`.
 */
function PhotoLayer({
  photo,
  active,
  locationName,
  onAspect,
}: {
  photo: TravelPhoto;
  active: boolean;
  locationName: string;
  onAspect?: (ratio: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      aria-hidden={!active}
      className="absolute inset-0 transition-opacity duration-200"
      style={{
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {active ? (
        <TransformWrapper
          key={photo.id}
          minScale={1}
          maxScale={5}
          doubleClick={{ mode: "toggle", step: 2 }}
          wheel={{ step: 0.15 }}
          centerOnInit
        >
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%" }}
          >
            <LayerImage
              photo={photo}
              locationName={locationName}
              loaded={loaded}
              onLoad={() => setLoaded(true)}
              onAspect={onAspect}
            />
          </TransformComponent>
        </TransformWrapper>
      ) : (
        // Off-screen neighbours render the image directly (no zoom wrapper) so
        // they still download + decode while hidden.
        <LayerImage
          photo={photo}
          locationName={locationName}
          loaded={loaded}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

function LayerImage({
  photo,
  locationName,
  loaded,
  onLoad,
  onAspect,
}: {
  photo: TravelPhoto;
  locationName: string;
  loaded: boolean;
  onLoad: () => void;
  onAspect?: (ratio: number) => void;
}) {
  const report = (el: HTMLImageElement | null) => {
    if (el && el.naturalWidth > 0) {
      onAspect?.(el.naturalWidth / el.naturalHeight);
    }
  };

  return (
    <div className="relative h-full w-full">
      {/* Blurred placeholder — cheap, decodes instantly, hides the blank gap. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.blurUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain blur-lg scale-105"
        style={{ opacity: loaded ? 0 : 1, transition: "opacity 200ms ease" }}
        draggable={false}
      />
      {/* Full screen-sized image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.caption ?? `${locationName} — ${photo.label}`}
        className="relative h-full w-full object-contain select-none"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 200ms ease" }}
        draggable={false}
        decoding="async"
        onLoad={(e) => {
          onLoad();
          report(e.currentTarget);
        }}
        // If the element mounts against an already-cached image, `load` may not
        // fire — reconcile from `.complete` on mount.
        ref={(el) => {
          if (el && el.complete && el.naturalWidth > 0) {
            onLoad();
            report(el);
          }
        }}
      />
    </div>
  );
}

export default function Lightbox({
  photos,
  index,
  onClose,
  onIndexChange,
  locationName,
}: LightboxProps) {
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);

  // Aspect ratio of the active image, so its box hugs the photo exactly and the
  // caption can sit against its real right edge. Defaults to 3:2 until loaded.
  const [aspect, setAspect] = useState(1.5);

  const isOpen = index !== null;

  // Keyboard: Escape closes, arrows navigate.
  useEffect(() => {
    if (!isOpen || index === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight")
        onIndexChange((index + 1) % photos.length);
      else if (e.key === "ArrowLeft")
        onIndexChange((index - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, index, photos.length, onClose, onIndexChange]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Warm the decode of neighbours (belt-and-suspenders alongside the mounted
  // window: guarantees they're decode-ready, not just downloaded).
  useEffect(() => {
    if (!isOpen || index === null) return;
    [index + 1, index - 1].forEach((i) => {
      const p = photos[(i + photos.length) % photos.length];
      const img = new window.Image();
      img.src = p.url;
      // decode() may reject if interrupted; ignore.
      img.decode?.().catch(() => {});
    });
  }, [isOpen, index, photos]);

  if (!isOpen || index === null || !portalReady) return null;

  const hasMultiple = photos.length > 1;
  const go = (delta: number) =>
    onIndexChange((index + delta + photos.length) % photos.length);

  // Swipe-to-navigate (mobile). Track the touch start; on release, if it was a
  // mostly-horizontal swipe past a threshold, change photos. A single-touch
  // guard avoids interfering with pinch-zoom (two fingers).
  let touchStartX = 0;
  let touchStartY = 0;
  let touchTracking = false;

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      touchTracking = false;
      return;
    }
    touchTracking = true;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchTracking || !hasMultiple) return;
    touchTracking = false;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Require a clear horizontal swipe: enough distance, and more horizontal
    // than vertical (so vertical scrolls/pans don't trigger navigation).
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? 1 : -1); // swipe left → next, swipe right → prev
    }
  };

  // The mounted window: current, next, prev (deduped for tiny galleries).
  const windowIdx = Array.from(
    new Set([
      index,
      (index + 1) % photos.length,
      (index - 1 + photos.length) % photos.length,
    ]),
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${locationName} photo viewer`}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
      >
        <svg
          aria-hidden="true"
          width="28"
          height="28"
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

      {/* Prev */}
      {hasMultiple && (
        <button
          type="button"
          aria-label="Previous photo"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className="absolute left-2 sm:left-4 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg
            aria-hidden="true"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Image box sized to the photo's aspect ratio so its edges match the
          visible photo, and the caption bar can sit flush on the image bottom.
          Centered in the viewport. */}
      <div
        className="relative"
        style={{
          aspectRatio: String(aspect),
          maxHeight: "85vh",
          maxWidth: "90vw",
          height: "85vh",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {windowIdx.map((i) => (
          <PhotoLayer
            key={photos[i].id}
            photo={photos[i]}
            active={i === index}
            locationName={locationName}
            onAspect={i === index ? setAspect : undefined}
          />
        ))}

        {/* Caption bar overlaid on the image bottom, with a gradient scrim so
            text stays legible over any photo. Same treatment on all screens —
            the conventional gallery-lightbox pattern. */}
        {photos[index].caption && (
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/75 via-black/45 to-transparent px-4 pb-4 pt-12 sm:px-6 sm:pb-5">
            <p className="mx-auto max-w-3xl text-center text-sm font-medium leading-snug text-white sm:text-base">
              {photos[index].caption}
            </p>
          </figcaption>
        )}
      </div>

      {/* Next */}
      {hasMultiple && (
        <button
          type="button"
          aria-label="Next photo"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className="absolute right-2 sm:right-4 z-10 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg
            aria-hidden="true"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Counter + zoom hint */}
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60">
        {hasMultiple ? `${index + 1} / ${photos.length} · ` : ""}
        scroll or double-click to zoom
      </p>
    </div>,
    document.body,
  );
}
