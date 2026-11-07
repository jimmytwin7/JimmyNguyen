import Image from "next/image";
import { Check, ExternalLink, Minus, Package } from "lucide-react";
import { unusedBoardItems } from "@/lib/cooking/match-labels";
import type {
  PantryIngredient,
  RecipeIngredient,
  RecipeMatch,
} from "@/lib/cooking/types";
import MatchMeter from "./MatchMeter";
import Readiness from "./Readiness";

interface RecipeCardProps {
  match: RecipeMatch;
  /** The board the search ran with, for the "Not used" line. */
  board?: PantryIngredient[];
  onOpen: (id: string) => void;
}

const MAX_LISTED = 4;

const SUMMARY_ICON = { board: Check, missing: Minus, pantry: Package };

/**
 * One ingredient group on a card: "From your board (2) chicken, rice",
 * "Missing (1) butter", or "Pantry basics (2) salt, oil".
 */
export function IngredientSummary({
  label,
  items,
  icon,
}: {
  label: string;
  items: RecipeIngredient[];
  icon: keyof typeof SUMMARY_ICON;
}) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_LISTED);
  const extra = items.length - shown.length;
  const Icon = SUMMARY_ICON[icon];
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-faint">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label} ({items.length})
      </p>
      <p className="mt-0.5 text-sm text-app">
        {shown.map((i) => i.name).join(", ")}
        {extra > 0 && <span className="text-muted"> +{extra} more</span>}
      </p>
    </div>
  );
}

/**
 * "Not used from your board: pasta". Says plainly when a recipe ignores
 * something the user added, so a weak match reads as weak, not as a bug.
 * Renders nothing when every board item is used.
 */
export function UnusedFromBoard({
  match,
  board,
}: {
  match: RecipeMatch;
  board: PantryIngredient[];
}) {
  const unused = unusedBoardItems(match, board);
  if (unused.length === 0) return null;
  return (
    <p className="text-sm text-muted">
      <span className="font-semibold text-app">Not used from your board:</span>{" "}
      {unused.join(", ")}
    </p>
  );
}

/** View recipe button plus the TheMealDB attribution link. */
export function RecipeActions({
  match,
  onOpen,
}: {
  match: RecipeMatch;
  onOpen: (id: string) => void;
}) {
  const { recipe } = match;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => onOpen(recipe.id)}
        className="pq-btn pq-btn-primary px-4 py-2 text-sm"
      >
        View recipe
        <span className="sr-only">: {recipe.title}</span>
      </button>
      {recipe.providerUrl && (
        <a
          href={recipe.providerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-muted underline-offset-2 hover:text-app hover:underline"
        >
          {recipe.sourceName}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}

/**
 * A rail ticket. Deliberately lean: headline, meter, what it uses from the
 * board, what's missing, and anything on the board it ignores. Pantry basics
 * and the full explanation live on the plate and in the detail view.
 */
export default function RecipeCard({
  match,
  board = [],
  onOpen,
}: RecipeCardProps) {
  const { recipe } = match;

  return (
    <article className="pq-ticket flex w-full flex-col overflow-hidden">
      {recipe.imageUrl && (
        <div className="relative aspect-[16/10] border-b-2 border-dashed border-line bg-surface-raised">
          <Image
            // The 700px original, resized by the Next image optimizer to fit
            // the card at the device's pixel density. (TheMealDB's "/preview"
            // variant is only 150px and looks blurry when stretched.)
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            // Rail tickets are a fixed 17–18rem wide.
            sizes="288px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg font-bold leading-snug tracking-tight text-app">
            {recipe.title}
          </h3>
          {(recipe.category || recipe.area) && (
            <p className="text-sm text-muted">
              {[recipe.category, recipe.area].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Readiness missingCount={match.missingIngredients.length} />
          <MatchMeter percentage={match.matchPercentage} />
        </div>

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
        <UnusedFromBoard match={match} board={board} />

        <div className="mt-auto pt-2">
          <RecipeActions match={match} onOpen={onOpen} />
        </div>
      </div>
    </article>
  );
}
