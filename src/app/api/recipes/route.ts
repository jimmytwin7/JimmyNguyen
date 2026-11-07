import { clientKey, createRateLimiter } from "@/lib/cooking/rate-limit";
import { getCatalog } from "@/lib/cooking/server/catalog";
import { searchRecipes } from "@/lib/cooking/server/recipe-search";
import { parseSearchParams } from "@/lib/cooking/validation";

/**
 * GET /api/recipes?ingredients=a,b,c&diet=vegan,gluten-free
 *
 * Scores the build-time recipe catalog locally; never calls TheMealDB.
 *
 * 200 RecipeSearchResponse | 400 invalid input | 429 rate limited |
 * 503 no catalog in this build. Error bodies are `{ error, retryable }` and
 * never include stack traces or internal details.
 */

// Searches are cheap (in-memory scoring) and toggling a diet filter re-runs
// one, so 30 a minute per client leaves plenty of room. In-memory and per
// instance: a runaway-loop guard, not a strict global limit (see rate-limit.ts).
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    // Responses reflect the user's pantry; don't let shared caches keep them.
    headers: { "Cache-Control": "no-store" },
  });

export async function GET(request: Request) {
  if (!limiter(clientKey(request))) {
    return json(
      { error: "Too many searches — try again in a minute.", retryable: true },
      429,
    );
  }

  const parsed = parseSearchParams(new URL(request.url).searchParams);
  if (!parsed.ok) return json({ error: parsed.error, retryable: false }, 400);

  try {
    const catalog = await getCatalog();
    if (!catalog.available) {
      return json(
        {
          error: "Recipe data isn't available in this build.",
          retryable: false,
        },
        503,
      );
    }
    return json(searchRecipes(parsed.value, catalog));
  } catch {
    return json(
      { error: "Something went wrong. Please try again.", retryable: true },
      500,
    );
  }
}
