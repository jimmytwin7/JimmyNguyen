import { isFoodSafetySensitive, textViolatesDiet } from "./dietary-filter";
import { ingredientMatchKey } from "./ingredient-normalizer";
import type { DietaryFilter, Substitution } from "./types";

/**
 * Deterministic substitution dictionary — general kitchen swaps. These are
 * suggestions, not guarantees: flavour and texture change, and nothing here is
 * allergy advice.
 *
 * Keys are ingredient match keys (see ingredient-normalizer.ts).
 */
type Swap = Omit<Substitution, "ingredient">;

const FALLBACK: Record<string, Swap[]> = {
  butter: [
    {
      substitute: "olive oil",
      ratio: "about ¾ the amount",
      tradeoff: "Savory dishes only; no browned-butter flavour.",
    },
  ],
  garlic: [
    {
      substitute: "garlic powder",
      ratio: "⅛ tsp per clove",
      tradeoff: "Milder, less pungent.",
    },
  ],
  onion: [
    {
      substitute: "onion powder",
      ratio: "1 tbsp per medium onion",
      tradeoff: "No texture; add it with the liquids.",
    },
    { substitute: "shallot", ratio: "1:1", tradeoff: "Sweeter and milder." },
  ],
  shallot: [
    { substitute: "onion", ratio: "1:1", tradeoff: "Slightly sharper." },
  ],
  "green onion": [
    {
      substitute: "chives",
      ratio: "1:1",
      tradeoff: "More delicate; add at the end.",
    },
  ],
  lemon: [
    { substitute: "lime", ratio: "1:1", tradeoff: "Slightly more floral." },
  ],
  "lemon juice": [
    { substitute: "lime juice", ratio: "1:1" },
    {
      substitute: "white wine vinegar",
      ratio: "½ the amount",
      tradeoff: "Sharper; no citrus aroma.",
    },
  ],
  lime: [{ substitute: "lemon", ratio: "1:1" }],
  milk: [
    {
      substitute: "unsweetened plant milk",
      ratio: "1:1",
      tradeoff: "Can be thinner or slightly sweet.",
    },
  ],
  buttermilk: [
    {
      substitute: "milk with 1 tbsp lemon juice per cup, rested 5 min",
      ratio: "1:1",
    },
  ],
  "double cream": [
    {
      substitute: "milk mixed with melted butter",
      ratio: "¾ cup milk + ¼ cup butter per cup",
      tradeoff: "Won't whip.",
    },
  ],
  "heavy cream": [
    {
      substitute: "milk mixed with melted butter",
      ratio: "¾ cup milk + ¼ cup butter per cup",
      tradeoff: "Won't whip.",
    },
  ],
  "sour cream": [
    {
      substitute: "plain yogurt",
      ratio: "1:1",
      tradeoff: "Tangier; can split if boiled.",
    },
  ],
  yogurt: [{ substitute: "sour cream", ratio: "1:1", tradeoff: "Richer." }],
  "soy sauce": [
    {
      substitute: "tamari",
      ratio: "1:1",
      tradeoff: "Usually gluten-free; check the label.",
    },
    {
      substitute: "coconut aminos",
      ratio: "1:1",
      tradeoff: "Sweeter and less salty.",
    },
  ],
  "chicken stock": [
    {
      substitute: "vegetable stock",
      ratio: "1:1",
      tradeoff: "Lighter flavour.",
    },
    {
      substitute: "water plus extra seasoning",
      ratio: "1:1",
      tradeoff: "Much less depth; season to taste.",
    },
  ],
  "beef stock": [
    {
      substitute: "mushroom or vegetable stock",
      ratio: "1:1",
      tradeoff: "Less savory depth.",
    },
  ],
  "vegetable stock": [
    {
      substitute: "water plus extra seasoning",
      ratio: "1:1",
      tradeoff: "Less depth; season to taste.",
    },
  ],
  "low sodium broth": [
    { substitute: "water plus a pinch of salt and herbs", ratio: "1:1" },
  ],
  "olive oil": [
    { substitute: "vegetable oil", ratio: "1:1", tradeoff: "Neutral flavour." },
  ],
  "vegetable oil": [
    {
      substitute: "olive oil",
      ratio: "1:1",
      tradeoff: "Fruitier flavour; lower smoke point.",
    },
  ],
  "sunflower oil": [{ substitute: "vegetable oil", ratio: "1:1" }],
  "rice vinegar": [
    {
      substitute: "apple cider vinegar",
      ratio: "1:1",
      tradeoff: "Fruitier and sharper.",
    },
  ],
  "white wine": [
    { substitute: "stock with a splash of white wine vinegar", ratio: "1:1" },
  ],
  "red wine": [
    { substitute: "stock with a splash of red wine vinegar", ratio: "1:1" },
  ],
  "brown sugar": [
    { substitute: "white sugar plus 1 tbsp molasses per cup", ratio: "1:1" },
  ],
  honey: [
    {
      substitute: "maple syrup",
      ratio: "1:1",
      tradeoff: "Thinner; different flavour.",
    },
  ],
  "maple syrup": [{ substitute: "honey", ratio: "1:1" }],
  "tomato puree": [
    {
      substitute: "tomato paste thinned with water",
      ratio: "1 part paste to 1 part water",
    },
  ],
  "tomato paste": [
    {
      substitute: "tomato puree, reduced",
      ratio: "about 3× the amount, simmered down",
    },
  ],
  parmesan: [
    { substitute: "pecorino", ratio: "1:1", tradeoff: "Saltier and sharper." },
  ],
  cheddar: [{ substitute: "another firm cheese, e.g. gouda", ratio: "1:1" }],
  ginger: [
    {
      substitute: "ground ginger",
      ratio: "¼ tsp per 1 tbsp fresh",
      tradeoff: "Warmer, less zingy.",
    },
  ],
  basil: [
    {
      substitute: "dried basil",
      ratio: "⅓ the amount",
      tradeoff: "Less bright; add earlier.",
    },
  ],
  parsley: [{ substitute: "dried parsley", ratio: "⅓ the amount" }],
  cilantro: [
    { substitute: "parsley", ratio: "1:1", tradeoff: "No citrusy note." },
  ],
  thyme: [{ substitute: "dried thyme", ratio: "⅓ the amount" }],
  spinach: [
    {
      substitute: "kale",
      ratio: "1:1",
      tradeoff: "Tougher; cook a little longer.",
    },
  ],
  cornstarch: [
    {
      substitute: "flour",
      ratio: "2× the amount",
      tradeoff: "Cloudier sauce; not gluten-free.",
    },
  ],
  flour: [
    { substitute: "cornstarch (for thickening only)", ratio: "½ the amount" },
  ],
  rice: [
    {
      substitute: "quinoa",
      ratio: "1:1 cooked",
      tradeoff: "Nuttier; different cooking time.",
    },
  ],
  "bell pepper": [
    { substitute: "zucchini", ratio: "1:1", tradeoff: "Less sweet." },
  ],
};

export interface FallbackResult {
  suggestions: Substitution[];
  skipped: { ingredient: string; reason: string }[];
}

export const FOOD_SAFETY_REASON =
  "No substitute suggested: swapping meat, seafood, or eggs changes safe handling and cooking temperatures.";

/**
 * Look up fallback suggestions for each missing ingredient. Skips
 * food-safety-sensitive items and drops any substitute that conflicts with the
 * selected dietary filters (e.g. no butter swap suggested under vegan).
 */
export function fallbackSubstitutions(
  missing: string[],
  diet: DietaryFilter[] = [],
): FallbackResult {
  const suggestions: Substitution[] = [];
  const skipped: FallbackResult["skipped"] = [];

  for (const ingredient of missing) {
    if (isFoodSafetySensitive(ingredient)) {
      skipped.push({ ingredient, reason: FOOD_SAFETY_REASON });
      continue;
    }
    const swaps = FALLBACK[ingredientMatchKey(ingredient)] ?? [];
    for (const swap of swaps) {
      if (textViolatesDiet(swap.substitute, diet)) continue;
      suggestions.push({ ingredient, ...swap });
    }
  }
  return { suggestions, skipped };
}
