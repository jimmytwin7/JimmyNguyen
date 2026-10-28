"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { MAX_PANTRY_INGREDIENTS } from "@/lib/cooking/config";
import { passesDietaryFilters } from "@/lib/cooking/dietary-filter";
import { normalizeIngredient } from "@/lib/cooking/ingredient-normalizer";
import {
  scoreRecipe,
  sortMatches,
  type SortOrder,
} from "@/lib/cooking/recipe-matcher";
import type {
  DietaryFilter,
  PantryIngredient,
  RecipeSearchResponse,
} from "@/lib/cooking/types";
import { validateIngredientName } from "@/lib/cooking/validation";
import CookingMode from "./CookingMode";
import CuttingBoard, { BOARD_SPRITE_ATTR } from "./CuttingBoard";
import DietaryFilters from "./DietaryFilters";
import FlyingIngredients, { type Flight } from "./FlyingIngredients";
import IngredientInput from "./IngredientInput";
import KnifeButton from "./KnifeButton";
import PantryShelf from "./PantryShelf";
import RecipeDetail from "./RecipeDetail";
import RecipeResults, { type SearchStatus } from "./RecipeResults";
import StovePot from "./StovePot";

/** Most sprites that fly into the pot at once (keeps it snappy). */
const MAX_FLIGHTS = 8;
/** Longer than the longest hop (8 staggered flights ≈ 1.3s). */
const FLIGHT_TIMEOUT_MS = 2000;
/** Height of the site's sticky nav (4rem). */
const HEADER_OFFSET_PX = 64;

/** Center of a rect, or null if it's outside the viewport. */
function visibleCenter(el: Element | null) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const onScreen =
    y >= 0 && y <= window.innerHeight && x >= 0 && x <= window.innerWidth;
  return onScreen ? { x, y } : null;
}

type View =
  | { kind: "search" }
  | { kind: "detail"; id: string }
  | { kind: "cooking"; id: string };

/**
 * Route-level composition and state for the cooking project.
 *
 * The server returns scored recipes for the pantry at search time. Dietary
 * filters, the staples toggle, and sorting then apply live on the client using
 * the same pure functions, so changing them doesn't refetch and the numbers
 * always agree with the server's.
 */
export default function PantryQuest() {
  const [pantry, setPantry] = useState<PantryIngredient[]>([]);
  const [diet, setDiet] = useState<DietaryFilter[]>([]);
  const [assumeStaples, setAssumeStaples] = useState(true);
  const [sort, setSort] = useState<SortOrder>("match");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecipeSearchResponse | null>(null);
  /** Pantry snapshot the current results were fetched for. */
  const [searchedPantry, setSearchedPantry] = useState<PantryIngredient[]>([]);
  const [view, setView] = useState<View>({ kind: "search" });
  const [announcement, setAnnouncement] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  /** A search just settled; reveal the results once the hop finishes. */
  const [revealPending, setRevealPending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const resultsAnchorRef = useRef<HTMLDivElement>(null);
  const potMouthRef = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  const existing = useMemo(
    () => new Set(pantry.map((p) => p.normalizedName)),
    [pantry],
  );

  function addIngredient(raw: string): string | null {
    const result = validateIngredientName(raw);
    if (!result.ok) return result.error;
    if (pantry.length >= MAX_PANTRY_INGREDIENTS)
      return `You can add up to ${MAX_PANTRY_INGREDIENTS} ingredients.`;
    const normalizedName = normalizeIngredient(result.value);
    if (existing.has(normalizedName))
      return `${result.value} is already on the board.`;
    const name = result.value.toLowerCase();
    setPantry((p) => [
      ...p,
      { id: normalizedName.replace(/ /g, "-"), name, normalizedName },
    ]);
    setAnnouncement(`Added ${name}.`);
    return null;
  }

  function removeIngredient(id: string) {
    const item = pantry.find((p) => p.id === id);
    setPantry((p) => p.filter((x) => x.id !== id));
    if (item) setAnnouncement(`Removed ${item.name}.`);
  }

  /** Shelf items toggle: add if missing, remove if already on the board. */
  function toggleShelfItem(name: string) {
    const normalizedName = normalizeIngredient(name);
    const onBoard = pantry.find((p) => p.normalizedName === normalizedName);
    if (onBoard) removeIngredient(onBoard.id);
    else {
      const error = addIngredient(name);
      if (error) setAnnouncement(error);
    }
  }

  /** Board sprites hop into the pot (only when both are on screen). */
  function launchFlights() {
    if (reduceMotion) return;
    const to = visibleCenter(potMouthRef.current);
    if (!to) return;
    const next: Flight[] = [];
    document
      .querySelectorAll<HTMLElement>(`[${BOARD_SPRITE_ATTR}]`)
      .forEach((el) => {
        const from = visibleCenter(el);
        const name = el.getAttribute(BOARD_SPRITE_ATTR);
        if (from && name && next.length < MAX_FLIGHTS)
          next.push({ name, from, to });
      });
    setFlights(next);
  }

  async function search(items: PantryIngredient[] = pantry) {
    if (items.length === 0) return;
    launchFlights();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError(null);
    setAnnouncement("Searching for recipes…");
    const params = new URLSearchParams({
      ingredients: items.map((p) => p.name).join(","),
      staples: assumeStaples ? "1" : "0",
    });
    try {
      const res = await fetch(`/api/recipes?${params}`, {
        signal: controller.signal,
      });
      const body = (await res.json().catch(() => null)) as
        RecipeSearchResponse | { error?: string } | null;
      if (!res.ok || !body || !("matches" in body)) {
        throw new Error(
          (body && "error" in body && body.error) ||
            "We couldn't load recipes. Please try again.",
        );
      }
      setData(body);
      setSearchedPantry(items);
      setStatus("success");
      setAnnouncement(`Found ${body.matches.length} recipes.`);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setStatus("error");
      setAnnouncement(message);
    }
    setRevealPending(true);
  }

  /**
   * Bring the results into view and move focus to their heading. Skips the
   * scroll when the heading and the top of the rail are already on screen.
   */
  function revealResults() {
    const heading = document.getElementById("results-heading");
    if (!heading) return;
    const r = heading.getBoundingClientRect();
    const alreadyVisible =
      r.top >= HEADER_OFFSET_PX && r.top + 240 <= window.innerHeight;
    if (!alreadyVisible) {
      resultsAnchorRef.current?.scrollIntoView({
        block: "start",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
    heading.focus({ preventScroll: true });
  }

  // Reveal once the search has settled AND the pot hop has finished, so the
  // page doesn't scroll away mid-animation.
  useEffect(() => {
    if (!revealPending || flights.length > 0) return;
    setRevealPending(false);
    // Wait a frame so the results section has rendered.
    requestAnimationFrame(revealResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revealResults only reads refs/DOM
  }, [revealPending, flights.length]);

  // Safety net: never let the hop block the reveal if an animation callback
  // doesn't fire (e.g. the tab was backgrounded).
  useEffect(() => {
    if (flights.length === 0) return;
    const t = setTimeout(() => setFlights([]), FLIGHT_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [flights]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Live re-score / filter / sort with the same pure functions as the server.
  const allMatches = useMemo(
    () =>
      (data?.matches ?? []).map((m) =>
        scoreRecipe(m.recipe, searchedPantry, { assumeStaples }),
      ),
    [data, searchedPantry, assumeStaples],
  );
  const visible = useMemo(
    () =>
      sortMatches(
        allMatches.filter((m) => passesDietaryFilters(m.recipe, diet)),
        sort,
      ),
    [allMatches, diet, sort],
  );
  const hiddenCount = allMatches.length - visible.length;

  const pantryChanged =
    status === "success" &&
    (pantry.length !== searchedPantry.length ||
      pantry.some(
        (p, i) => p.normalizedName !== searchedPantry[i]?.normalizedName,
      ));

  const selected =
    view.kind !== "search"
      ? allMatches.find((m) => m.recipe.id === view.id)
      : undefined;

  function backToResults() {
    setView({ kind: "search" });
    // After the search view re-renders, return focus near where the user was.
    requestAnimationFrame(() => {
      resultsAnchorRef.current?.scrollIntoView({ block: "start" });
      document.getElementById("results-heading")?.focus();
    });
  }

  // Guide text for the current state (shown above the board).
  const guideMessage =
    status === "loading"
      ? "Flipping through the recipe book…"
      : status === "error"
        ? "The recipe book is stuck. Give it another try?"
        : status === "success" && !pantryChanged
          ? visible.length > 0
            ? `Found ${visible.length} ${visible.length === 1 ? "recipe" : "recipes"}. Pick one and start cooking.`
            : "No match this time. Try adding a common ingredient."
          : pantry.length === 0
            ? "Put what's in your kitchen on the board to start."
            : `${pantry.length} ${pantry.length === 1 ? "ingredient" : "ingredients"} ready. Hit Find my recipe when you're set.`;

  const liveRegion = (
    <p aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );

  if (view.kind === "cooking" && selected) {
    return (
      <>
        {liveRegion}
        <CookingMode
          recipe={selected.recipe}
          onExit={() => setView({ kind: "detail", id: selected.recipe.id })}
        />
      </>
    );
  }

  if (view.kind === "detail" && selected) {
    return (
      <>
        {liveRegion}
        {/* The ticket gets pulled down off the rail into the detail view. */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -32, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
        >
          <RecipeDetail
            match={selected}
            pantry={searchedPantry}
            diet={diet}
            onBack={backToResults}
            onStartCooking={() =>
              setView({ kind: "cooking", id: selected.recipe.id })
            }
          />
        </motion.div>
      </>
    );
  }

  return (
    <div className="space-y-8">
      {liveRegion}

      {/* Guidance for the current state (was the chef's speech bubble). */}
      <p className="pq-panel px-4 py-3 text-base font-bold text-app sm:text-lg">
        {guideMessage}
      </p>

      {flights.length > 0 && (
        <FlyingIngredients flights={flights} onDone={() => setFlights([])} />
      )}

      {/* Kitchen counter: shelf | cutting board | stove + order ticket. */}
      <div className="grid gap-8 lg:grid-cols-[11rem_minmax(0,1fr)_17rem] lg:items-start xl:grid-cols-[13rem_minmax(0,1fr)_18rem]">
        <PantryShelf
          onBoard={existing}
          full={pantry.length >= MAX_PANTRY_INGREDIENTS}
          onToggle={toggleShelfItem}
        />

        <CuttingBoard
          pantry={pantry}
          onRemove={removeIngredient}
          onClear={() => {
            setPantry([]);
            setAnnouncement("Cleared the board.");
          }}
          onDropIngredient={(name) => {
            if (!existing.has(normalizeIngredient(name))) toggleShelfItem(name);
          }}
          footer={
            // The knife rests on the board's bottom-right: "chop it up" to
            // find a recipe. Caption spells out what the knife does.
            <div className="flex flex-col items-end gap-1">
              <KnifeButton
                onClick={() => search()}
                disabled={pantry.length === 0 || status === "loading"}
                aria-describedby={
                  pantry.length === 0 ? "search-hint" : undefined
                }
              >
                {status === "loading" ? "Searching…" : "Find my recipe"}
              </KnifeButton>
              <p
                aria-hidden="true"
                className="pr-1 text-right text-base font-bold text-[var(--pq-ink)]"
              >
                {status === "loading" ? "Searching…" : "Find my recipe"}
              </p>
              {pantry.length === 0 && (
                <p
                  id="search-hint"
                  className="text-right text-sm font-bold text-app"
                >
                  Add at least one ingredient to search.
                </p>
              )}
              {pantryChanged && pantry.length > 0 && (
                <p className="text-right text-sm font-bold text-app">
                  Your board changed — search again to refresh results.
                </p>
              )}
            </div>
          }
        >
          <IngredientInput
            existing={existing}
            onAdd={addIngredient}
            count={pantry.length}
          />
        </CuttingBoard>

        <div className="space-y-6">
          <div className="pq-panel px-4 pb-4 pt-6">
            <StovePot
              cooking={status === "loading"}
              lidOpen={flights.length > 0}
              mouthRef={potMouthRef}
            />
            {(status === "success" || status === "error") && (
              // "Order up!" sign: a shortcut back down to the results.
              <button
                type="button"
                onClick={revealResults}
                className="pq-btn pq-btn-primary mt-4 w-full px-4 py-2 text-sm"
              >
                {status === "error"
                  ? "Order problem: see why"
                  : visible.length > 0
                    ? `Order up! ${visible.length} ${visible.length === 1 ? "recipe" : "recipes"}`
                    : "Order up: see results"}
                <ArrowDown
                  className="h-4 w-4"
                  strokeWidth={3}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
          <aside aria-label="Order ticket" className="relative">
            <div className="pq-ticket relative space-y-5 p-5 sm:p-6 lg:rotate-1">
              <span className="pq-tape" aria-hidden="true" />
              <p className="text-center text-lg font-bold uppercase tracking-wider">
                Order ticket
              </p>
              <DietaryFilters
                selected={diet}
                onChange={setDiet}
                assumeStaples={assumeStaples}
                onAssumeStaplesChange={setAssumeStaples}
              />
            </div>
          </aside>
        </div>
      </div>

      <div ref={resultsAnchorRef} className="scroll-mt-24">
        <RecipeResults
          status={status}
          error={error}
          matches={visible}
          hiddenCount={hiddenCount}
          sort={sort}
          onSortChange={setSort}
          onRetry={() => search()}
          onClearFilters={() => setDiet([])}
          onOpen={(id) => {
            setView({ kind: "detail", id });
            window.scrollTo({ top: 0 });
          }}
          queriedIngredients={data?.meta.queriedIngredients ?? []}
          partial={data?.meta.partial ?? false}
        />
      </div>
    </div>
  );
}
