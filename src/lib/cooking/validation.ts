import {
  DIETARY_FILTER_VALUES,
  MAX_INGREDIENT_LENGTH,
  MAX_PANTRY_INGREDIENTS,
} from "./config";
import { normalizeIngredient } from "./ingredient-normalizer";
import type { DietaryFilter } from "./types";

/**
 * Hand-rolled validation for the request shapes. The schemas are tiny, so this
 * avoids a validation dependency; every parser returns a discriminated result
 * instead of throwing.
 */

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

/** Letters (incl. accented), digits, spaces, and a little punctuation. */
const INGREDIENT_PATTERN = /^[\p{L}\p{N} '&,.()-]+$/u;

export function validateIngredientName(raw: unknown): Parsed<string> {
  if (typeof raw !== "string")
    return { ok: false, error: "Ingredient must be text." };
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Ingredient can't be empty." };
  if (name.length > MAX_INGREDIENT_LENGTH)
    return {
      ok: false,
      error: `Ingredient names must be ${MAX_INGREDIENT_LENGTH} characters or fewer.`,
    };
  if (!INGREDIENT_PATTERN.test(name))
    return { ok: false, error: "Ingredient contains unsupported characters." };
  if (!normalizeIngredient(name))
    return {
      ok: false,
      error: "Ingredient needs at least one letter or number.",
    };
  return { ok: true, value: name };
}

function parseDietList(raw: unknown): Parsed<DietaryFilter[]> {
  if (raw === undefined || raw === null || raw === "")
    return { ok: true, value: [] };
  const values = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",")
      : null;
  if (!values) return { ok: false, error: "Invalid dietary filters." };
  const out: DietaryFilter[] = [];
  for (const v of values) {
    if (typeof v !== "string" || !DIETARY_FILTER_VALUES.has(v.trim()))
      return { ok: false, error: "Unknown dietary filter." };
    const f = v.trim() as DietaryFilter;
    if (!out.includes(f)) out.push(f);
  }
  return { ok: true, value: out };
}

/** De-duplicate validated names by normalized form, preserving order. */
function dedupeNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names.filter((n) => {
    const key = normalizeIngredient(n);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface RecipeSearchParams {
  ingredients: string[];
  diet: DietaryFilter[];
  assumeStaples: boolean;
}

/** Validate `GET /api/recipes` query parameters. */
export function parseSearchParams(
  params: URLSearchParams,
): Parsed<RecipeSearchParams> {
  const rawIngredients = params.get("ingredients") ?? "";
  if (
    rawIngredients.length >
    MAX_PANTRY_INGREDIENTS * (MAX_INGREDIENT_LENGTH + 1)
  )
    return { ok: false, error: "Too many ingredients." };
  const parts = rawIngredients.split(",").filter((p) => p.trim() !== "");
  if (parts.length === 0)
    return { ok: false, error: "Add at least one ingredient." };
  if (parts.length > MAX_PANTRY_INGREDIENTS)
    return {
      ok: false,
      error: `You can search with up to ${MAX_PANTRY_INGREDIENTS} ingredients.`,
    };

  const names: string[] = [];
  for (const part of parts) {
    const result = validateIngredientName(part);
    if (!result.ok) return result;
    names.push(result.value);
  }

  const diet = parseDietList(params.get("diet"));
  if (!diet.ok) return diet;

  const staples = params.get("staples");
  return {
    ok: true,
    value: {
      ingredients: dedupeNames(names),
      diet: diet.value,
      assumeStaples: staples === "1" || staples === "true",
    },
  };
}

export const MAX_SUBSTITUTION_BODY_BYTES = 4096;
const MAX_MISSING = 10;
const MAX_AVAILABLE = MAX_PANTRY_INGREDIENTS;
const MAX_TITLE_LENGTH = 120;

export interface SubstitutionRequest {
  recipeTitle: string;
  missing: string[];
  available: string[];
  diet: DietaryFilter[];
}

function parseNameList(
  raw: unknown,
  max: number,
  label: string,
): Parsed<string[]> {
  if (!Array.isArray(raw))
    return { ok: false, error: `${label} must be a list.` };
  if (raw.length > max)
    return { ok: false, error: `${label} can have at most ${max} items.` };
  const names: string[] = [];
  for (const item of raw) {
    // Recipe ingredient names can be longer than pantry names ("stir-fry
    // vegetables"), so allow a little more room here.
    if (typeof item !== "string" || item.trim().length > 60)
      return { ok: false, error: `${label} contains an invalid item.` };
    const trimmed = item.trim();
    if (trimmed) names.push(trimmed);
  }
  return { ok: true, value: dedupeNames(names) };
}

/** Validate the `POST /api/substitutions` JSON body (already parsed). */
export function parseSubstitutionRequest(
  body: unknown,
): Parsed<SubstitutionRequest> {
  if (typeof body !== "object" || body === null || Array.isArray(body))
    return { ok: false, error: "Request body must be a JSON object." };
  const b = body as Record<string, unknown>;

  if (typeof b.recipeTitle !== "string" || !b.recipeTitle.trim())
    return { ok: false, error: "recipeTitle is required." };
  if (b.recipeTitle.length > MAX_TITLE_LENGTH)
    return { ok: false, error: "recipeTitle is too long." };

  const missing = parseNameList(b.missing, MAX_MISSING, "missing");
  if (!missing.ok) return missing;
  if (missing.value.length === 0)
    return {
      ok: false,
      error: "missing must include at least one ingredient.",
    };

  const available = parseNameList(
    b.available ?? [],
    MAX_AVAILABLE,
    "available",
  );
  if (!available.ok) return available;

  const diet = parseDietList(b.diet);
  if (!diet.ok) return diet;

  return {
    ok: true,
    value: {
      recipeTitle: b.recipeTitle.trim(),
      missing: missing.value,
      available: available.value,
      diet: diet.value,
    },
  };
}
