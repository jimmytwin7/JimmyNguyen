import { readFile } from "node:fs/promises";
import path from "node:path";
import { ingredientMatchKey } from "../ingredient-normalizer";
import { normalizeMealDbMeal } from "../recipe-normalizer";
import type { Recipe } from "../types";

/**
 * Server-only. The recipe catalog shipped with this deployment.
 *
 * scripts/fetch-recipes.mjs writes `.data/recipes.json` at build time (raw
 * TheMealDB fields only). This module reads it once per server instance,
 * normalizes every record, and builds an inverted index from ingredient match
 * key to recipes, so a search never calls TheMealDB. A missing or invalid
 * file means "unavailable": the route answers 503 rather than throwing.
 */

export type CatalogSource = "supporter" | "test-key" | "unavailable";

export interface RecipeCatalog {
  available: boolean;
  recipes: readonly Recipe[];
  /** ingredientMatchKey → indices into `recipes`, ascending, no repeats. */
  index: ReadonlyMap<string, readonly number[]>;
  generatedAt: string | null;
  source: CatalogSource;
}

export const CATALOG_FILE = path.join(process.cwd(), ".data", "recipes.json");

const SOURCES: ReadonlySet<string> = new Set([
  "supporter",
  "test-key",
  "unavailable",
]);

export const UNAVAILABLE_CATALOG: RecipeCatalog = Object.freeze({
  available: false,
  recipes: [],
  index: new Map(),
  generatedAt: null,
  source: "unavailable",
});

/**
 * Build a catalog from the parsed file contents (or any in-memory data of the
 * same shape, for tests). Invalid input gives UNAVAILABLE_CATALOG.
 */
export function buildCatalog(data: unknown): RecipeCatalog {
  if (typeof data !== "object" || data === null) return UNAVAILABLE_CATALOG;
  const file = data as Record<string, unknown>;
  if (!Array.isArray(file.meals)) return UNAVAILABLE_CATALOG;
  const source =
    typeof file.source === "string" && SOURCES.has(file.source)
      ? (file.source as CatalogSource)
      : "unavailable";
  const generatedAt =
    typeof file.generatedAt === "string" ? file.generatedAt : null;

  const recipes: Recipe[] = [];
  const seen = new Set<string>();
  for (const raw of file.meals) {
    const recipe = normalizeMealDbMeal(raw);
    if (!recipe || seen.has(recipe.id)) continue;
    seen.add(recipe.id);
    recipes.push(recipe);
  }

  const index = new Map<string, number[]>();
  recipes.forEach((recipe, i) => {
    const keys = new Set(
      recipe.ingredients.map((ing) => ingredientMatchKey(ing.name)),
    );
    for (const key of keys) {
      if (!key) continue;
      const list = index.get(key);
      if (list) list.push(i);
      else index.set(key, [i]);
    }
  });

  const available = source !== "unavailable" && recipes.length > 0;
  return {
    available,
    recipes: available ? recipes : [],
    index: available ? index : new Map(),
    generatedAt,
    source: available ? source : "unavailable",
  };
}

/** Read and build a catalog file. Never throws. */
export async function loadCatalog(file = CATALOG_FILE): Promise<RecipeCatalog> {
  try {
    // The path is a parameter (for tests), which Turbopack can't trace and
    // would otherwise treat as "trace the whole project". The real file is
    // shipped explicitly via outputFileTracingIncludes in next.config.ts.
    const text = await readFile(/* turbopackIgnore: true */ file, "utf8");
    return buildCatalog(JSON.parse(text));
  } catch {
    return UNAVAILABLE_CATALOG;
  }
}

let cached: Promise<RecipeCatalog> | null = null;

/**
 * The deployment's catalog, loaded once per instance. The file can't change
 * under a running deployment, so even "unavailable" is cached; locally,
 * restart `next dev` after `npm run refresh:recipes`.
 */
export function getCatalog(): Promise<RecipeCatalog> {
  cached ??= loadCatalog();
  return cached;
}

/** Tests only: forget the cached catalog. */
export function resetCatalogCache(): void {
  cached = null;
}
