"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { bestMatchReason } from "@/lib/cooking/match-labels";
import type { PantryIngredient, RecipeMatch } from "@/lib/cooking/types";
import MatchMeter from "./MatchMeter";
import Readiness from "./Readiness";
import {
  IngredientSummary,
  RecipeActions,
  UnusedFromBoard,
} from "./RecipeCard";

interface BestMatchPlateProps {
  match: RecipeMatch;
  /** The board the search ran with, for the "Not used" line. */
  board?: PantryIngredient[];
  onOpen: (id: string) => void;
}

/**
 * The best match, served as the dish the pot produced: a large panel with the
 * photo on a round plate, a gold "Best match" ribbon, and a reason line built
 * from the data ("Only 1 ingredient to buy."). It sits above the rail and
 * never moves when the rail is re-sorted.
 *
 * The ribbon and reason are text, so the meaning never depends on color; the
 * star is decorative. The slide-up is skipped under reduced motion.
 */
export default function BestMatchPlate({
  match,
  board = [],
  onOpen,
}: BestMatchPlateProps) {
  const reduceMotion = useReducedMotion();
  const { recipe } = match;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="pq-serving grid gap-6 p-5 sm:p-7 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-center lg:gap-8"
    >
      {recipe.imageUrl && (
        <div className="pq-plate mx-auto aspect-square w-full max-w-[17rem]">
          <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-[var(--pq-ink)] bg-surface-raised">
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              // The plate is at most 17rem wide at every breakpoint.
              sizes="272px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="min-w-0 space-y-4">
        <div>
          <p className="pq-ribbon pq-ribbon-gold inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider">
            <Star
              aria-hidden="true"
              className="h-4 w-4 fill-[#fffcf5] text-[var(--pq-ink)]"
              strokeWidth={2}
            />
            Best match
          </p>
          <p className="mt-2 text-sm font-bold text-[var(--pq-ink)]">
            {bestMatchReason(match, board)}
          </p>
        </div>

        <div>
          <h3 className="text-2xl font-bold leading-tight tracking-tight text-app sm:text-3xl">
            {recipe.title}
          </h3>
          {(recipe.category || recipe.area) && (
            <p className="mt-1 text-sm text-muted">
              {[recipe.category, recipe.area].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="max-w-md space-y-1.5">
          <Readiness
            missingCount={match.missingIngredients.length}
            className="text-lg"
          />
          <MatchMeter percentage={match.matchPercentage} />
        </div>
        <p className="text-sm text-muted">{match.scoreExplanation}</p>

        <div className="grid gap-3 sm:grid-cols-3">
          <IngredientSummary
            label="From your board"
            items={match.matchedIngredients}
            icon="board"
          />
          <IngredientSummary
            label="Missing"
            items={match.missingIngredients}
            icon="missing"
          />
          <IngredientSummary
            label="Pantry basics"
            items={match.assumedIngredients}
            icon="pantry"
          />
        </div>
        <UnusedFromBoard match={match} board={board} />

        <RecipeActions match={match} onOpen={onOpen} />
      </div>
    </motion.article>
  );
}
