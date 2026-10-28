/**
 * Internal data model for Pantry Quest. Provider responses are normalized into
 * these shapes (see recipe-normalizer.ts) so UI components never depend on a
 * specific recipe API's field names.
 */

export type DietaryFilter =
  "vegetarian" | "vegan" | "dairy-free" | "gluten-free";

export interface PantryIngredient {
  /** Stable id for React keys; derived from the normalized name. */
  id: string;
  /** What the user typed (trimmed), shown in the UI. */
  name: string;
  /** Canonical form used for de-duplication. */
  normalizedName: string;
}

export interface RecipeIngredient {
  /** Name as supplied by the provider. */
  name: string;
  normalizedName: string;
  /** Quantity/measure exactly as supplied by the provider, if any. */
  quantity?: string;
  /** Only set when the source explicitly marks the ingredient optional. */
  optional?: boolean;
  /** Only set when the source explicitly marks the ingredient as core. */
  core?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  imageUrl?: string;
  /** Human-readable provider name, e.g. "TheMealDB". */
  sourceName: string;
  /** Original recipe page (author's site) when the provider supplies one. */
  sourceUrl?: string;
  /** The recipe's page on the provider itself, for attribution. */
  providerUrl?: string;
  category?: string;
  area?: string;
  ingredients: RecipeIngredient[];
  /** Instruction steps as supplied by the source. Empty if none provided. */
  instructions: string[];
  prepMinutes?: number;
  cookMinutes?: number;
  servings?: number;
}

export interface RecipeMatch {
  recipe: Recipe;
  /** 0–100 integer. Ingredient coverage, not a quality prediction. */
  matchPercentage: number;
  matchedIngredients: RecipeIngredient[];
  /** Matched only because "assume pantry staples" was on. */
  assumedIngredients: RecipeIngredient[];
  missingIngredients: RecipeIngredient[];
  optionalIngredients: RecipeIngredient[];
  scoreExplanation: string;
}

export interface RecipeSearchResponse {
  matches: RecipeMatch[];
  meta: {
    provider: string;
    /** Pantry ingredients actually sent to the provider (free-tier limit). */
    queriedIngredients: string[];
    /** Candidates removed by dietary filters. */
    filteredOutCount: number;
    /** True when some upstream calls failed but others succeeded. */
    partial: boolean;
  };
}

export interface Substitution {
  /** The missing recipe ingredient this suggestion is for. */
  ingredient: string;
  substitute: string;
  ratio?: string;
  tradeoff?: string;
  explanation?: string;
}

export interface SubstitutionResponse {
  suggestions: Substitution[];
  /** Missing ingredients we deliberately won't suggest swaps for. */
  skipped: { ingredient: string; reason: string }[];
}
