"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, ChefHat, ExternalLink, Minus } from "lucide-react";
import { ingredientMatchKey } from "@/lib/cooking/ingredient-normalizer";
import type {
  DietaryFilter,
  PantryIngredient,
  RecipeMatch,
  Substitution,
  SubstitutionResponse,
} from "@/lib/cooking/types";
import MatchMeter from "./MatchMeter";
import {
  SubstitutionControls,
  SubstitutionList,
} from "./SubstitutionSuggestions";

interface RecipeDetailProps {
  match: RecipeMatch;
  pantry: PantryIngredient[];
  diet: DietaryFilter[];
  onBack: () => void;
  onStartCooking: () => void;
}

type IngredientStatus = "have" | "assumed" | "missing" | "optional";

const STATUS_LABEL: Record<IngredientStatus, string> = {
  have: "You have this",
  assumed: "Assumed pantry staple",
  missing: "Missing",
  optional: "Optional",
};

export default function RecipeDetail({
  match,
  pantry,
  diet,
  onBack,
  onStartCooking,
}: RecipeDetailProps) {
  const { recipe } = match;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [subState, setSubState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [subs, setSubs] = useState<SubstitutionResponse | null>(null);

  // Move focus to the recipe title when the view opens.
  useEffect(() => headingRef.current?.focus(), []);

  // Per-line status, keyed by match key (the matcher de-dupes on it too).
  const statusByKey = new Map<string, IngredientStatus>();
  for (const i of match.matchedIngredients)
    statusByKey.set(ingredientMatchKey(i.name), "have");
  for (const i of match.assumedIngredients)
    statusByKey.set(ingredientMatchKey(i.name), "assumed");
  for (const i of match.missingIngredients)
    statusByKey.set(ingredientMatchKey(i.name), "missing");
  for (const i of match.optionalIngredients)
    statusByKey.set(ingredientMatchKey(i.name), "optional");

  const subsByIngredient = new Map<string, Substitution[]>();
  for (const s of subs?.suggestions ?? []) {
    const key = ingredientMatchKey(s.ingredient);
    subsByIngredient.set(key, [...(subsByIngredient.get(key) ?? []), s]);
  }
  const skippedByIngredient = new Map(
    (subs?.skipped ?? []).map((s) => [
      ingredientMatchKey(s.ingredient),
      s.reason,
    ]),
  );

  async function requestSubstitutions() {
    setSubState("loading");
    try {
      const res = await fetch("/api/substitutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeTitle: recipe.title,
          missing: match.missingIngredients.slice(0, 10).map((i) => i.name),
          available: pantry.map((p) => p.name),
          diet,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSubs((await res.json()) as SubstitutionResponse);
      setSubState("ready");
    } catch {
      setSubState("error");
    }
  }

  const hasInstructions = recipe.instructions.length > 0;
  const showSubs = subState === "ready";

  return (
    <article className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="pq-btn pq-btn-plain px-4 py-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to results
      </button>

      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {recipe.imageUrl && (
          <div className="relative aspect-square overflow-hidden rounded-3xl border-2 border-line bg-surface-raised">
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              sizes="(min-width: 1152px) 430px, (min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="space-y-4">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold tracking-tight text-app focus:outline-none sm:text-3xl"
          >
            {recipe.title}
          </h2>
          {(recipe.category || recipe.area) && (
            <p className="text-muted">
              {[recipe.category, recipe.area].filter(Boolean).join(" · ")}
            </p>
          )}
          <MatchMeter percentage={match.matchPercentage} />
          <p className="text-sm text-muted">{match.scoreExplanation}</p>
          <button
            type="button"
            onClick={onStartCooking}
            disabled={!hasInstructions}
            className="pq-btn pq-btn-primary px-5 py-2.5"
          >
            <ChefHat className="h-4 w-4" aria-hidden="true" />
            Start Cooking Mode
          </button>
        </div>
      </div>

      <section
        aria-labelledby="ingredients-heading"
        className="pq-panel p-5 sm:p-6"
      >
        <h3
          id="ingredients-heading"
          className="mb-4 text-lg font-bold text-app"
        >
          Ingredients
        </h3>
        <ul className="divide-y divide-[var(--line)]">
          {recipe.ingredients.map((ingredient, idx) => {
            const key = ingredientMatchKey(ingredient.name);
            // Never claim the user has something we couldn't classify.
            const status = statusByKey.get(key) ?? "missing";
            const Icon = status === "missing" ? Minus : Check;
            return (
              <li key={`${ingredient.name}-${idx}`} className="py-2.5">
                <div className="flex items-start gap-3">
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${status === "missing" ? "text-faint" : ""}`}
                    style={
                      status === "missing"
                        ? undefined
                        : { color: "var(--accent)" }
                    }
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-app">
                      {ingredient.quantity && (
                        <span className="font-medium">
                          {ingredient.quantity}{" "}
                        </span>
                      )}
                      {ingredient.name}
                    </p>
                    <p className="text-xs text-muted">{STATUS_LABEL[status]}</p>
                    {showSubs && status === "missing" && (
                      <>
                        <SubstitutionList
                          items={subsByIngredient.get(key) ?? []}
                        />
                        {skippedByIngredient.has(key) && (
                          <p className="mt-1 text-xs text-muted">
                            {skippedByIngredient.get(key)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {match.missingIngredients.length > 0 && (
          <div className="mt-4">
            <SubstitutionControls
              state={subState}
              result={subs}
              onRequest={requestSubstitutions}
              onDismiss={() => {
                setSubs(null);
                setSubState("idle");
              }}
            />
          </div>
        )}
      </section>

      <section
        aria-labelledby="instructions-heading"
        className="pq-panel p-5 sm:p-6"
      >
        <h3
          id="instructions-heading"
          className="mb-4 text-lg font-bold text-app"
        >
          Instructions
        </h3>
        {hasInstructions ? (
          <ol className="list-decimal space-y-3 pl-5 marker:font-semibold marker:text-muted">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="pl-1 leading-relaxed text-app">
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted">
            The recipe source didn&apos;t include instructions. See the original
            recipe for how to make it.
          </p>
        )}
      </section>

      <footer className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        {recipe.providerUrl && (
          <a
            href={recipe.providerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-app hover:underline"
          >
            Recipe data from {recipe.sourceName}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-app hover:underline"
          >
            Original recipe
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </footer>
    </article>
  );
}
