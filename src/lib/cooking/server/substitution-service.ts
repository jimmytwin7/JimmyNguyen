import { fallbackSubstitutions } from "../substitutions";
import type { SubstitutionResponse } from "../types";
import type { SubstitutionRequest } from "../validation";

/**
 * Deterministic ingredient substitutions.
 *
 * - Food-safety-sensitive ingredients (raw meat/seafood/eggs) never get
 *   suggestions (handled inside fallbackSubstitutions).
 * - Suggestions that conflict with the selected dietary filters are dropped.
 *
 * All suggestions come from the built-in dictionary; this always succeeds once
 * the request has been validated.
 */
export async function getSubstitutions(
  req: SubstitutionRequest,
): Promise<SubstitutionResponse> {
  return fallbackSubstitutions(req.missing, req.diet);
}
