import { clientKey, createRateLimiter } from "@/lib/cooking/rate-limit";
import { searchRecipes } from "@/lib/cooking/server/recipe-search";
import {
  theMealDbProvider,
  UpstreamError,
} from "@/lib/cooking/server/themealdb";
import { parseSearchParams } from "@/lib/cooking/validation";

/**
 * GET /api/recipes?ingredients=a,b,c&diet=vegan,gluten-free&staples=1
 *
 * 200 RecipeSearchResponse | 400 invalid input | 429 rate limited |
 * 502 recipe provider unavailable. Error bodies are `{ error, retryable }` and
 * never include stack traces or upstream details.
 */

const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    // Responses reflect the user's pantry; don't let shared caches keep them.
    // Upstream recipe data is cached separately inside the provider adapter.
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
    return json(await searchRecipes(parsed.value, theMealDbProvider));
  } catch (err) {
    if (err instanceof UpstreamError) {
      const message =
        err.kind === "rate-limited"
          ? "The recipe service is busy right now. Please try again shortly."
          : "We couldn't reach the recipe service. Please try again.";
      return json({ error: message, retryable: true }, 502);
    }
    return json(
      { error: "Something went wrong. Please try again.", retryable: true },
      500,
    );
  }
}
