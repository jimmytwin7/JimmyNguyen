"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { PantryIngredient } from "@/lib/cooking/types";
import IngredientIllustration from "./IngredientIllustration";
import { INGREDIENT_DRAG_TYPE } from "./PantryShelf";

interface CuttingBoardProps {
  pantry: PantryIngredient[];
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Called when a pantry-shelf item is dropped on the board. */
  onDropIngredient: (name: string) => void;
  /** Rendered at the top of the board (the ingredient input). */
  children?: ReactNode;
  /** Rendered at the bottom of the board (the knife / search button). */
  footer?: ReactNode;
}

/** Marks each sprite so the cook-into-the-pot transition can find it. */
export const BOARD_SPRITE_ATTR = "data-board-sprite";

/**
 * The cutting board is the stage of the whole game: a big wooden board that
 * holds the ingredient input and the ingredients as stickers. Shelf items can
 * be dropped onto it. Stickers pop on with a springy bounce; under
 * prefers-reduced-motion they just appear.
 */
export default function CuttingBoard({
  pantry,
  onRemove,
  onClear,
  onDropIngredient,
  children,
  footer,
}: CuttingBoardProps) {
  const reduceMotion = useReducedMotion();
  const [dragOver, setDragOver] = useState(false);

  const isShelfDrag = (e: React.DragEvent) =>
    Array.from(e.dataTransfer.types).includes(INGREDIENT_DRAG_TYPE);

  return (
    <section
      aria-labelledby="board-heading"
      className={`pq-board p-5 pb-8 sm:p-8 sm:pb-10 ${dragOver ? "pq-board-drop" : ""}`}
      onDragOver={(e) => {
        if (!isShelfDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        // Ignore leave events fired when moving between child elements.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setDragOver(false);
      }}
      onDrop={(e) => {
        setDragOver(false);
        const name = e.dataTransfer.getData(INGREDIENT_DRAG_TYPE);
        if (!name) return;
        e.preventDefault();
        onDropIngredient(name);
      }}
    >
      {/* Handle hole — the wall shows through. */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-3 h-5 w-16 -translate-x-1/2 rounded-full border-2 sm:top-4"
        style={{ borderColor: "var(--pq-ink)", background: "var(--pq-wall)" }}
      />

      <div className="min-w-0 space-y-6 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="board-heading"
            className="pq-ribbon text-lg font-bold sm:text-xl"
          >
            Cutting board{" "}
            <span className="text-sm font-bold">({pantry.length})</span>
          </h2>
          {pantry.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="pq-btn pq-btn-plain px-4 py-1.5 text-sm"
            >
              Clear all
            </button>
          )}
        </div>

        {children}

        {pantry.length === 0 ? (
          <div
            className="flex min-h-56 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center sm:min-h-72"
            style={{
              borderColor: "var(--pq-ink)",
              background: "rgb(255 255 255 / 0.25)",
            }}
          >
            <p className="text-xl font-bold">Your board is empty</p>
            <p className="mt-1 max-w-xs font-medium">
              Grab something from the pantry shelf, or type any ingredient
              above.
            </p>
          </div>
        ) : (
          <ul className="grid min-h-56 grid-cols-3 content-start gap-x-3 gap-y-5 sm:min-h-72 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence initial={false}>
              {pantry.map((item, i) => (
                <motion.li
                  key={item.id}
                  layout={!reduceMotion}
                  initial={
                    reduceMotion
                      ? false
                      : { opacity: 0, y: -40, scale: 0.6, rotate: -8 }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    // Tiny alternating tilt so it feels hand-placed.
                    rotate: reduceMotion ? 0 : i % 2 ? 2 : -2,
                  }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.5, y: 10 }
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 18 }}
                  className="relative flex flex-col items-center gap-2"
                >
                  {/* Food sits right on the wood; the drop shadow grounds it. */}
                  <div
                    {...{ [BOARD_SPRITE_ATTR]: item.name }}
                    className="drop-shadow-[0_6px_4px_rgb(91_58_41_/_0.35)]"
                  >
                    <IngredientIllustration name={item.name} size={80} bare />
                  </div>
                  <span className="max-w-full truncate rounded-full bg-[rgb(255_252_245_/_0.85)] px-2.5 py-0.5 text-sm font-bold">
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="pq-btn pq-btn-primary absolute -right-1 -top-2 h-8 w-8 !border-2 !shadow-[0_2px_0_var(--pq-ink)] sm:right-1"
                  >
                    <X className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {footer}
      </div>
    </section>
  );
}
