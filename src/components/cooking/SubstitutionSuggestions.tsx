import { Sparkles } from "lucide-react";
import type { Substitution, SubstitutionResponse } from "@/lib/cooking/types";

/** Suggestions for a single missing ingredient, rendered inline beneath it. */
export function SubstitutionList({ items }: { items: Substitution[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5 border-l-2 border-line pl-3">
      {items.map((s, i) => (
        <li key={`${s.substitute}-${i}`} className="text-sm">
          <span className="font-medium text-app">Try {s.substitute}</span>
          {s.ratio && <span className="text-muted"> · {s.ratio}</span>}
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted">
            General tip
          </span>
          {(s.tradeoff || s.explanation) && (
            <span className="block text-muted">
              {[s.tradeoff, s.explanation].filter(Boolean).join(" ")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

interface SubstitutionControlsProps {
  state: "idle" | "loading" | "ready" | "error";
  result: SubstitutionResponse | null;
  onRequest: () => void;
  onDismiss: () => void;
}

/** Request button, suggestions notice, and the safety disclaimer. */
export function SubstitutionControls({
  state,
  result,
  onRequest,
  onDismiss,
}: SubstitutionControlsProps) {
  if (state === "ready" && result) {
    return (
      <div className="rounded-xl border-2 border-line bg-surface-raised p-4 text-sm">
        <p className="text-app">Showing general substitution tips.</p>
        <p className="mt-1 text-muted">
          Substitutions change flavour and texture and are never allergy advice.
          Always check labels if you have an allergy.
        </p>
        {result.suggestions.length === 0 && (
          <p className="mt-1 text-muted">
            No general swaps found for these ingredients.
          </p>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 text-sm font-medium text-muted underline underline-offset-2 hover:text-app"
        >
          Hide suggestions
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onRequest}
        disabled={state === "loading"}
        className="pq-btn pq-btn-secondary px-4 py-2 text-sm"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {state === "loading"
          ? "Finding substitutions…"
          : "Suggest substitutions"}
      </button>
      {state === "error" && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          Couldn&apos;t load substitutions. Please try again.
        </p>
      )}
    </div>
  );
}
