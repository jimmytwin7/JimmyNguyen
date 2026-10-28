"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SortOrder } from "@/lib/cooking/recipe-matcher";
import type { RecipeMatch } from "@/lib/cooking/types";
import RecipeCard from "./RecipeCard";

export type SearchStatus = "idle" | "loading" | "success" | "error";

interface RecipeResultsProps {
  status: SearchStatus;
  error: string | null;
  matches: RecipeMatch[];
  /** Results hidden by the current dietary filters. */
  hiddenCount: number;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  onRetry: () => void;
  onClearFilters: () => void;
  onOpen: (id: string) => void;
  queriedIngredients: string[];
  partial: boolean;
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
}: {
  children: React.ReactNode;
  count: number;
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
        aria-label="Recipe tickets"
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
  const { status, error, matches, hiddenCount, sort } = props;
  const reduceMotion = useReducedMotion();
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
          {status === "success" && props.queriedIngredients.length > 0 && (
            <p className="mt-3 text-xs font-medium text-muted">
              Searched TheMealDB by {props.queriedIngredients.join(", ")}, then
              scored every candidate against your whole board.
            </p>
          )}
        </div>
        {status === "success" && matches.length > 1 && (
          <label className="flex items-center gap-2 text-sm font-bold text-app">
            Sort by
            <select
              value={sort}
              onChange={(e) => props.onSortChange(e.target.value as SortOrder)}
              className="rounded-full border-2 border-[var(--pq-ink)] bg-surface px-3 py-1.5 font-bold text-app"
            >
              <option value="match">Best match</option>
              <option value="fewest-missing">Fewest missing</option>
              <option value="title">Title (A–Z)</option>
            </select>
          </label>
        )}
      </div>

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
          <button
            type="button"
            onClick={props.onRetry}
            className={secondaryButton}
          >
            Try again
          </button>
        </div>
      )}

      {status === "success" && props.partial && (
        <p className="pq-panel px-4 py-2 text-sm font-medium">
          Some recipe lookups failed, so these results may be incomplete.
        </p>
      )}

      {status === "success" && matches.length === 0 && hiddenCount > 0 && (
        <div className={panel}>
          <p className="font-medium text-app">
            Your dietary filters hid all {hiddenCount} matching{" "}
            {hiddenCount === 1 ? "recipe" : "recipes"}.
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

      {status === "success" && matches.length === 0 && hiddenCount === 0 && (
        <div className={panel}>
          <p className="font-medium text-app">
            No recipes found for that combination.
          </p>
          <p className="mt-1 text-sm text-muted">
            Try adding a common ingredient like chicken, rice, or potato.
          </p>
        </div>
      )}

      {status === "success" && matches.length > 0 && (
        <>
          {hiddenCount > 0 && (
            <p className="text-sm text-muted">
              {hiddenCount} {hiddenCount === 1 ? "recipe" : "recipes"} hidden by
              dietary filters.
            </p>
          )}
          <OrderRail count={matches.length}>
            {matches.map((m, i) => (
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
                <RecipeCard match={m} onOpen={props.onOpen} />
              </motion.li>
            ))}
          </OrderRail>
        </>
      )}
    </section>
  );
}
