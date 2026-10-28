import Image from "next/image";
import { Check, ExternalLink, Minus } from "lucide-react";
import type { RecipeIngredient, RecipeMatch } from "@/lib/cooking/types";
import MatchMeter from "./MatchMeter";

interface RecipeCardProps {
  match: RecipeMatch;
  onOpen: (id: string) => void;
}

const MAX_LISTED = 4;

function IngredientSummary({
  label,
  items,
  icon,
}: {
  label: string;
  items: RecipeIngredient[];
  icon: "have" | "missing";
}) {
  if (items.length === 0) return null;
  const shown = items.slice(0, MAX_LISTED);
  const extra = items.length - shown.length;
  const Icon = icon === "have" ? Check : Minus;
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

export default function RecipeCard({ match, onOpen }: RecipeCardProps) {
  const { recipe } = match;
  const have = [...match.matchedIngredients, ...match.assumedIngredients];

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

        <MatchMeter percentage={match.matchPercentage} />
        <p className="text-sm text-muted">{match.scoreExplanation}</p>

        <IngredientSummary label="You have" items={have} icon="have" />
        <IngredientSummary
          label="Missing"
          items={match.missingIngredients}
          icon="missing"
        />

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
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
      </div>
    </article>
  );
}
