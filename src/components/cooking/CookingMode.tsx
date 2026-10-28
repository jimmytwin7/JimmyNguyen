"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { Recipe } from "@/lib/cooking/types";

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
}

/**
 * Focused one-step-at-a-time view. Shows only the source's own steps; with no
 * instructions it says so rather than inventing any. Progress lives in local
 * state (kept while the page stays open, not across sessions). Left/Right
 * arrow keys also step through.
 */
export default function CookingMode({ recipe, onExit }: CookingModeProps) {
  const steps = recipe.instructions;
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const total = steps.length;

  useEffect(() => headingRef.current?.focus(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, total - 1));
      else if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const backButton = (
    <button
      type="button"
      onClick={onExit}
      className="pq-btn pq-btn-plain px-4 py-2 text-sm"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to recipe
    </button>
  );

  if (total === 0) {
    return (
      <section aria-labelledby="cooking-heading" className="space-y-4">
        {backButton}
        <h2
          id="cooking-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold text-app focus:outline-none"
        >
          {recipe.title}
        </h2>
        <p className="text-muted">
          This recipe has no instructions from its source.
        </p>
      </section>
    );
  }

  const isLast = step === total - 1;
  const percent = Math.round(((step + 1) / total) * 100);
  const navButton = "pq-btn px-6 py-3 text-base";

  return (
    <section
      aria-labelledby="cooking-heading"
      className="mx-auto max-w-2xl space-y-6"
    >
      {backButton}
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-faint">
          Cooking mode
        </p>
        <h2
          id="cooking-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight text-app focus:outline-none"
        >
          {recipe.title}
        </h2>
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-sm text-muted">
          <span>
            Step {step + 1} of {total}
          </span>
          <span className="tabular-nums">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Recipe progress"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${total}`}
          className="pq-meter"
        >
          <span
            className="transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div
        aria-live="polite"
        className="pq-panel min-h-48 p-6 text-lg leading-relaxed text-app sm:p-8 sm:text-xl"
      >
        <span className="sr-only">
          Step {step + 1} of {total}:{" "}
        </span>
        {steps[step]}
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
          className={`${navButton} pq-btn-plain`}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          Previous
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={onExit}
            className={`${navButton} pq-btn-primary`}
          >
            Finish
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, total - 1))}
            className={`${navButton} pq-btn-primary`}
          >
            Next
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
