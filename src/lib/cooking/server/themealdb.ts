import { UPSTREAM_TIMEOUT_MS } from "../config";
import { normalizeIngredient } from "../ingredient-normalizer";
import { extractMealDbIds, normalizeMealDbMeal } from "../recipe-normalizer";
import type { Recipe } from "../types";

/**
 * TheMealDB adapter. SERVER-ONLY: reads RECIPE_API_KEY. Only imported by route
 * handlers / other server modules, never by client components.
 *
 * Free tier (test key "1") is for development/educational use; TheMealDB asks
 * public releases to use a supporter key, set via RECIPE_API_KEY. The free tier
 * filters by one ingredient per request, which is why search fans out.
 */

export interface RecipeProvider {
  readonly name: string;
  /** Candidate recipe ids containing this ingredient (may be empty). */
  findCandidateIds(ingredient: string): Promise<string[]>;
  /** Full recipe, or null if the provider has no usable record. */
  getRecipe(id: string): Promise<Recipe | null>;
}

export class UpstreamError extends Error {
  constructor(
    readonly kind: "rate-limited" | "bad-status" | "network" | "malformed",
    readonly status?: number,
  ) {
    super(`Recipe provider error: ${kind}${status ? ` (${status})` : ""}`);
    this.name = "UpstreamError";
  }
}

const BASE_URL = "https://www.themealdb.com/api/json/v1";
/** Upstream recipe data is public and changes rarely; cache it for a day. */
const REVALIDATE_SECONDS = 60 * 60 * 24;

/** Where our canonical name differs from TheMealDB's ingredient naming. */
const QUERY_ALIASES: Record<string, string> = {
  "green onion": "spring onions",
  cilantro: "coriander",
};

function apiKey(): string {
  return process.env.RECIPE_API_KEY?.trim() || "1";
}

async function getJson(
  path: string,
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${BASE_URL}/${encodeURIComponent(apiKey())}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch {
    throw new UpstreamError("network");
  }
  if (response.status === 429) throw new UpstreamError("rate-limited", 429);
  if (!response.ok) throw new UpstreamError("bad-status", response.status);
  try {
    return await response.json();
  } catch {
    throw new UpstreamError("malformed");
  }
}

export const theMealDbProvider: RecipeProvider = {
  name: "TheMealDB",

  async findCandidateIds(ingredient) {
    const normalized = normalizeIngredient(ingredient);
    const term = (QUERY_ALIASES[normalized] ?? normalized).replace(/ /g, "_");
    return extractMealDbIds(await getJson("filter.php", { i: term }));
  },

  async getRecipe(id) {
    // Internal ids are "mealdb-<n>"; accept either form.
    const raw = id.replace(/^mealdb-/, "");
    if (!/^\d+$/.test(raw)) return null;
    const data = await getJson("lookup.php", { i: raw });
    const meals = (data as { meals?: unknown })?.meals;
    return Array.isArray(meals) ? normalizeMealDbMeal(meals[0]) : null;
  },
};
