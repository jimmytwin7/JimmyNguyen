/**
 * Geometry for the travel page's photo hand-off: the decorative photo that
 * grows out of a pin, holds over the map, then travels into the first tile of
 * the photo panel. Pure functions on viewport/document rectangles.
 */

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return {
    left: lerp(a.left, b.left, t),
    top: lerp(a.top, b.top, t),
    width: lerp(a.width, b.width, t),
    height: lerp(a.height, b.height, t),
  };
}

/** A `size`×`size` square centred on a point. */
export function squareAt(x: number, y: number, size: number): Rect {
  return { left: x - size / 2, top: y - size / 2, width: size, height: size };
}

export interface HoldOptions {
  /** The map's rect, in viewport coordinates. */
  map: Rect;
  viewportWidth: number;
  viewportHeight: number;
  /** Width ÷ height of the tile the photo will land on. */
  aspect: number;
  /** Frame width as a share of the map's width. */
  share?: number;
}

/**
 * Where the photo holds before travelling: centred over the visible part of
 * the map, about `share` of its width, in the tile's aspect ratio. Falls back
 * to the middle of the viewport when most of the map is scrolled out of view
 * (for example, after picking a place from the list below the map on mobile).
 */
export function holdRect({
  map,
  viewportWidth,
  viewportHeight,
  aspect,
  share = 0.6,
}: HoldOptions): Rect {
  const visibleTop = Math.max(map.top, 0);
  const visibleBottom = Math.min(map.top + map.height, viewportHeight);
  const mapVisible = visibleBottom - visibleTop >= map.height * 0.4;

  const cx = mapVisible ? map.left + map.width / 2 : viewportWidth / 2;
  const cy = mapVisible ? (visibleTop + visibleBottom) / 2 : viewportHeight / 2;

  const safeAspect = aspect > 0 && Number.isFinite(aspect) ? aspect : 4 / 3;
  let width = Math.min(map.width * share, viewportWidth * 0.9);
  let height = width / safeAspect;
  const maxHeight = viewportHeight * 0.8;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * safeAspect;
  }
  return { left: cx - width / 2, top: cy - height / 2, width, height };
}

export interface ScrollTargetOptions {
  /** Document-space top of the photo panel. */
  panelTop: number;
  /** Document-space top and bottom of the first photo tile, if any. */
  tileTop?: number;
  tileBottom?: number;
  viewportHeight: number;
  /** document scrollHeight − viewport height. */
  maxScroll: number;
  /** Space kept clear at the top of the screen: the sticky site header plus a
   *  small gap. */
  topGap: number;
  /** Space kept below the first photo when scrolling it into view. */
  bottomGap: number;
}

/**
 * Scroll position that brings the panel up to `topGap` from the top of the
 * screen. If the first photo would still be below the fold (a tall header on
 * mobile), scroll just far enough to show it in full, without pushing its top
 * under `topGap`. Clamped to the page's scroll range.
 */
export function scrollTargetFor({
  panelTop,
  tileTop,
  tileBottom,
  viewportHeight,
  maxScroll,
  topGap,
  bottomGap,
}: ScrollTargetOptions): number {
  let target = panelTop - topGap;
  if (tileTop !== undefined && tileBottom !== undefined) {
    const showsTile = tileBottom + bottomGap - viewportHeight;
    target = Math.max(target, Math.min(showsTile, tileTop - topGap));
  }
  return Math.min(Math.max(0, target), Math.max(0, maxScroll));
}
