"use client";

import { Check } from "lucide-react";
import {
  getIngredientAsset,
  SHELF_INGREDIENTS,
} from "@/lib/cooking/ingredient-assets";
import { normalizeIngredient } from "@/lib/cooking/ingredient-normalizer";
import IngredientIllustration from "./IngredientIllustration";

/** dataTransfer type for dragging a shelf item onto the cutting board. */
export const INGREDIENT_DRAG_TYPE = "application/x-pantry-ingredient";

interface PantryShelfProps {
  /** Normalized names already on the board. */
  onBoard: ReadonlySet<string>;
  /** Board is at its ingredient limit (only removals allowed). */
  full: boolean;
  /** Adds the item, or removes it if it's already on the board. */
  onToggle: (name: string) => void;
}

/**
 * Wooden pantry shelf of common ingredients. Each item is a toggle button
 * (click or Enter/Space adds it to the board; again removes it), so the
 * shelf is fully keyboard- and touch-usable. Dragging an item onto the board
 * is a mouse-only enhancement on top of that.
 */
export default function PantryShelf({
  onBoard,
  full,
  onToggle,
}: PantryShelfProps) {
  return (
    <section aria-labelledby="shelf-heading" className="pq-shelf p-4 sm:p-5">
      <h2 id="shelf-heading" className="pq-ribbon text-base font-bold">
        Pantry shelf
      </h2>
      <p className="mt-3 text-sm font-medium text-[#3f2a1e]">
        Tap to add. Or drag onto the board.
      </p>
      <ul className="mt-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-2">
        {SHELF_INGREDIENTS.map((name) => {
          const label = getIngredientAsset(name)?.label ?? name;
          const pressed = onBoard.has(normalizeIngredient(name));
          return (
            <li key={name} className="pq-shelf-slot">
              <button
                type="button"
                aria-pressed={pressed}
                disabled={full && !pressed}
                draggable={!pressed && !full}
                onDragStart={(e) => {
                  e.dataTransfer.setData(INGREDIENT_DRAG_TYPE, name);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onToggle(name)}
                className="group relative flex w-full cursor-pointer flex-col items-center gap-1 rounded-xl px-1 pb-1.5 pt-2 transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              >
                <span
                  className={`drop-shadow-[0_3px_2px_rgb(91_58_41_/_0.35)] transition-opacity ${
                    pressed ? "opacity-35" : ""
                  }`}
                >
                  <IngredientIllustration name={name} size={44} bare />
                </span>
                <span className="max-w-full truncate text-xs font-bold text-[#3f2a1e]">
                  {label}
                </span>
                {pressed && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--pq-ink)] bg-[var(--pq-primary)] text-white"
                  >
                    <Check className="h-3 w-3" strokeWidth={4} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
