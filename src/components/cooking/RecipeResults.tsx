"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { sortMatches, type SortOrder } from "@/lib/cooking/recipe-matcher";
import type { PantryIngredient, RecipeMatch } from "@/lib/cooking/types";
import BestMatchPlate from "./BestMatchPlate";
import RecipeCard from "./RecipeCard";

export type SearchStatus = "idle" | "loading" | "success" | "error";

interface RecipeResultsProps {
  status: SearchStatus;
  error: string | null;
  /** False when retrying can't help (e.g. no catalog in this build). */
  retryable: boolean;
  /** Ranked by the server; `matches[0]` is the best match. */
  matches: RecipeMatch[];
  /** Matching recipes removed by the current dietary filters. */
  filteredOutCount: number;
  /** Recipes in the catalog that were scored. */
  recipeCount: number;
  /** Order for the rail; the best match on the plate never moves. */
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onOpen: (id: string) => void;
  /** The board these results were searched with. */
  board?: PantryIngredient[];
}

/** Fixed ticket width with a snap point, so the rail scrolls ticket by ticket. */
const TICKET_CLASS = "w-[17rem] shrink-0 snap-start sm:w-72";

function SkeletonTicket() {
  return (
    <div className="pq-ticket overflow-hidden">
      <div className="aspect-[16/10] animate-pulse bg-surface-raised motion-reduce:animate-none" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-surface-raised motion-reduce:animate-none" />
        <div className="h-2 w-full animate-pulse rounded bg-surface-raised motion-reduce:animate-none" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-surface-raised motion-reduce:animate-none" />
      </div>
    </div>
  );
}

/** A clip on the rail that each ticket hangs from. */
function Clip() {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-4 left-1/2 z-10 h-6 w-10 -translate-x-1/2 rounded-md border-2 border-[var(--pq-ink)] bg-[#cbd5e1] shadow-[0_2px_0_var(--pq-ledge)]"
    />
  );
}

/**
 * Horizontal order rail. Native horizontal scrolling (touch, trackpad,
 * shift+wheel) with snap points; prev/next buttons scroll by one ticket.
 * Tabbing to a ticket's button scrolls it into view natively.
 */
function OrderRail({
  children,
  count,
  labelledBy,
}: {
  children: React.ReactNode;
  count: number;
  /** id of a visible label for the list; falls back to "Recipe tickets". */
  labelledBy?: string;
}) {
  const scroller = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, count]);

  function scrollByTicket(dir: 1 | -1) {
    const el = scroller.current;
    const first = el?.querySelector("li");
    if (!el || !first) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    el.scrollBy({
      left: dir * (first.getBoundingClientRect().width + 24),
      behavior: reduce.matches ? "auto" : "smooth",
    });
  }

  const arrow =
    "pq-btn pq-btn-plain h-10 w-10 shrink-0 disabled:pointer-events-none";

  return (
    <div className="relative">
      {/* The metal rail bar. */}
      <div aria-hidden="true" className="pq-rail" />
      <ul
        ref={scroller}
        onScroll={update}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : "Recipe tickets"}
        className="pq-rail-track flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 pb-6 pt-5"
      >
        {children}
      </ul>
      {(canPrev || canNext) && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scrollByTicket(-1)}
            disabled={!canPrev}
            aria-label="Scroll recipes left"
            className={arrow}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={3} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByTicket(1)}
            disabled={!canNext}
            aria-label="Scroll recipes right"
            className={arrow}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={3} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

const panel = "pq-panel p-8 text-center font-bold";
const secondaryButton = "pq-btn pq-btn-secondary mt-4 px-5 py-2 text-sm";

export default function RecipeResults(props: RecipeResultsProps) {
  const { status, error, matches, filteredOutCount, sort, board = [] } = props;
  const reduceMotion = useReducedMotion();
  // matches[0] is served on the plate; sorting only reorders the rail.
  const best = matches[0];
  const others = useMemo(
    () => sortMatches(matches.slice(1), sort),
    [matches, sort],
  );
  if (status === "idle") return null;

  return (
    <section aria-labelledby="results-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="results-heading"
            tabIndex={-1}
            className="pq-ribbon text-xl font-bold focus:outline-none"
          >
            Order up: recipes
          </h2>
          {status === "success" && props.recipeCount > 0 && (
            <p className="mt-3 text-xs font-medium text-muted">
              Scored all {props.recipeCount} recipes against your board.
            </p>
          )}
          {status === "success" && matches.length > 0 && (
            <p className="mt-1 text-xs font-medium text-muted">
              Ranked by how many of your ingredients each recipe uses, then
              ingredient match, then fewest to buy.
            </p>
          )}
        </div>
      </div>

      {status === "success" && best && (
        <BestMatchPlate match={best} board={board} onOpen={props.onOpen} />
      )}

      {status === "success" && others.length > 0 && (
        <div className="flex flex-wrap items-end justify-between gap-3 pt-2">
          <p
            id="more-recipes-label"
            className="text-sm font-bold uppercase tracking-wider text-app"
          >
            Also on the menu
          </p>
          {others.length > 1 && (
            <label className="flex items-center gap-2 text-sm font-bold text-app">
              Sort these by
              <select
                value={sort}
                onChange={(e) =>
                  props.onSortChange(e.target.value as SortOrder)
                }
                className="rounded-full border-2 border-[var(--pq-ink)] bg-surface px-3 py-1.5 font-bold text-app"
              >
                <option value="best">Best match</option>
                <option value="percentage">Highest match %</option>
                <option value="title">A–Z</option>
              </select>
            </label>
          )}
        </div>
      )}

      {status === "loading" && (
        <OrderRail count={3}>
          {[0, 1, 2].map((i) => (
            <li key={i} className={`relative ${TICKET_CLASS}`}>
              <Clip />
              <SkeletonTicket />
            </li>
          ))}
        </OrderRail>
      )}

      {status === "error" && (
        <div className={panel}>
          <p className="font-medium text-app">{error}</p>
          {props.retryable ? (
            <button
              type="button"
              onClick={props.onRetry}
              className={secondaryButton}
            >
              Try again
            </button>
          ) : (
            <p className="mt-1 text-sm text-muted">
              The recipe catalog is fetched when the site is built, so this
              won&apos;t fix itself on retry.
            </p>
          )}
        </div>
      )}

      {status === "success" && matches.length === 0 && filteredOutCount > 0 && (
        <div className={panel}>
          <p className="font-medium text-app">No recipes match these filters</p>
          <p className="mt-1 text-sm text-muted">
            {filteredOutCount} matching{" "}
            {filteredOutCount === 1 ? "recipe was" : "recipes were"} left out by
            your dietary filters.
          </p>
          <button
            type="button"
            onClick={props.onClearFilters}
            className={secondaryButton}
          >
            Clear filters
          </button>
        </div>
      )}

      {status === "success" &&
        matches.length === 0 &&
        filteredOutCount === 0 && (
          <div className={panel}>
            <p className="font-medium text-app">
              No recipes found for that combination.
            </p>
            <p className="mt-1 text-sm text-muted">
              Try adding a common ingredient like chicken, rice, or potato.
            </p>
          </div>
        )}

      {status === "success" && others.length > 0 && (
        <OrderRail count={others.length} labelledBy="more-recipes-label">
          {others.map((m, i) => (
            <motion.li
              key={m.recipe.id}
              // Tickets drop onto the rail one after another.
              initial={reduceMotion ? false : { opacity: 0, y: -48 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 22,
                delay: Math.min(i, 6) * 0.06,
              }}
              className={`relative flex ${TICKET_CLASS} ${
                reduceMotion ? "" : i % 2 ? "rotate-1" : "-rotate-1"
              }`}
            >
              <Clip />
              <RecipeCard match={m} board={board} onOpen={props.onOpen} />
            </motion.li>
          ))}
        </OrderRail>
      )}
    </section>
  );
}
