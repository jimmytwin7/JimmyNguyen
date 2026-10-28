import { normalizeIngredient } from "./ingredient-normalizer";
import type { DietaryFilter, Recipe } from "./types";

/**
 * Best-effort dietary filtering.
 *
 * TheMealDB has no per-recipe diet flags, so this combines the one piece of
 * structured metadata it does have (meat/seafood categories) with a
 * conservative keyword scan of each ingredient line. It errs toward excluding
 * a recipe. It is NOT allergy protection: provider data can be incomplete and
 * unknown ingredients pass through.
 *
 * Each rule category has:
 * - `bans`        whole-word phrases that mark a line as violating
 * - `exceptions`  phrases removed before scanning (`coconut milk`, `rice flour`)
 * - `safeMarkers` phrases that clear the whole line (`gluten free pasta`)
 */

interface Rule {
  bans: string[];
  exceptions?: string[];
  safeMarkers?: string[];
}

const PLANT_MARKERS = ["vegan", "vegetarian", "plant based", "meat free"];

const RULES = {
  meat: {
    bans: [
      "chicken",
      "beef",
      "pork",
      "lamb",
      "mutton",
      "bacon",
      "ham",
      "sausage",
      "turkey",
      "duck",
      "goose",
      "veal",
      "venison",
      "mince",
      "chorizo",
      "salami",
      "prosciutto",
      "pancetta",
      "pepperoni",
      "steak",
      "meat",
      "meatball",
      "brisket",
      "oxtail",
      "lardon",
      "gammon",
      "goat",
      "liver",
    ],
    exceptions: ["goat cheese", "goat s cheese", "goat milk", "goat s milk"],
    safeMarkers: PLANT_MARKERS,
  },
  seafood: {
    bans: [
      "fish",
      "salmon",
      "tuna",
      "cod",
      "haddock",
      "mackerel",
      "sardine",
      "anchovy",
      "trout",
      "tilapia",
      "halibut",
      "prawn",
      "shrimp",
      "crab",
      "lobster",
      "mussel",
      "clam",
      "oyster",
      "scallop",
      "squid",
      "calamari",
      "octopus",
      "crayfish",
    ],
    exceptions: ["oyster mushroom"],
    safeMarkers: PLANT_MARKERS,
  },
  animalOther: {
    bans: [
      "gelatin",
      "gelatine",
      "lard",
      "suet",
      "worcestershire",
      "bone broth",
    ],
  },
  dairy: {
    bans: [
      "milk",
      "butter",
      "cheese",
      "cream",
      "yogurt",
      "ghee",
      "buttermilk",
      "custard",
      "whey",
      "parmesan",
      "mozzarella",
      "cheddar",
      "feta",
      "ricotta",
      "mascarpone",
      "creme fraiche",
      "paneer",
      "brie",
      "gruyere",
      "halloumi",
      "gouda",
    ],
    exceptions: [
      "coconut milk",
      "coconut cream",
      "almond milk",
      "soy milk",
      "soya milk",
      "oat milk",
      "rice milk",
      "peanut butter",
      "almond butter",
      "cocoa butter",
      "cream of tartar",
      "butter bean",
    ],
    safeMarkers: ["dairy free", "vegan"],
  },
  egg: {
    bans: ["egg", "mayonnaise", "mayo", "meringue", "aioli"],
    safeMarkers: ["egg free", "vegan"],
  },
  honey: { bans: ["honey"] },
  gluten: {
    bans: [
      "flour",
      "wheat",
      "bread",
      "breadcrumb",
      "panko",
      "pasta",
      "spaghetti",
      "penne",
      "linguine",
      "fettuccine",
      "tagliatelle",
      "macaroni",
      "lasagne",
      "lasagna",
      "noodle",
      "barley",
      "rye",
      "couscous",
      "bulgur",
      "semolina",
      "soy sauce",
      "beer",
      "ale",
      "biscuit",
      "pastry",
      "tortilla",
      "pita",
      "pitta",
      "naan",
      "cracker",
      "malt",
      "seitan",
      "oat",
      "spelt",
      "farro",
      "filo",
      "phyllo",
      "crouton",
      "udon",
      "ramen",
      "gnocchi",
      "dumpling",
      "cake",
      "brioche",
      "bun",
    ],
    exceptions: [
      "rice flour",
      "almond flour",
      "coconut flour",
      "chickpea flour",
      "gram flour",
      "potato flour",
      "tapioca flour",
      "buckwheat flour",
      "rice noodle",
      "glass noodle",
      "corn tortilla",
      "rice paper",
    ],
    safeMarkers: ["gluten free"],
  },
} satisfies Record<string, Rule>;

type Category = keyof typeof RULES;

const DIET_CATEGORIES: Record<DietaryFilter, Category[]> = {
  vegetarian: ["meat", "seafood", "animalOther"],
  vegan: ["meat", "seafood", "animalOther", "dairy", "egg", "honey"],
  "dairy-free": ["dairy"],
  "gluten-free": ["gluten"],
};

/** TheMealDB categories that are, by definition, not vegetarian. */
const MEAT_CATEGORIES = new Set([
  "beef",
  "chicken",
  "lamb",
  "pork",
  "seafood",
  "goat",
]);

const PROCESSED_MARKERS = [
  "stock",
  "broth",
  "bouillon",
  "gravy",
  "sauce",
  "powder",
  "extract",
  "cube",
  "seasoning",
  "noodle",
  "paste",
];

const hasPhrase = (text: string, phrase: string) =>
  ` ${text} `.includes(` ${phrase} `);

function violatesRule(text: string, rule: Rule): boolean {
  if (rule.safeMarkers?.some((m) => hasPhrase(text, m))) return false;
  let scrubbed = ` ${text} `;
  for (const exception of rule.exceptions ?? []) {
    scrubbed = scrubbed.split(` ${exception} `).join(" ");
  }
  return rule.bans.some((ban) => hasPhrase(scrubbed.trim(), ban));
}

/** True if free text (an ingredient or a suggested substitute) breaks any filter. */
export function textViolatesDiet(
  text: string,
  filters: DietaryFilter[],
): boolean {
  const normalized = normalizeIngredient(text);
  return filters.some((filter) =>
    DIET_CATEGORIES[filter].some((cat) => violatesRule(normalized, RULES[cat])),
  );
}

/**
 * Raw meat, seafood, and eggs: swapping these changes safe-handling and
 * cooking-temperature requirements, so we never suggest substitutes for them.
 */
export function isFoodSafetySensitive(text: string): boolean {
  const normalized = normalizeIngredient(text);
  // Processed/shelf-stable products ("chicken stock", "fish sauce", "egg
  // noodles") aren't raw proteins, so ordinary swaps are fine for them.
  if (PROCESSED_MARKERS.some((m) => hasPhrase(normalized, m))) return false;
  return (["meat", "seafood", "egg"] as const).some((cat) =>
    violatesRule(normalized, RULES[cat]),
  );
}

export function passesDietaryFilters(
  recipe: Recipe,
  filters: DietaryFilter[],
): boolean {
  if (filters.length === 0) return true;
  const category = recipe.category?.toLowerCase();
  if (
    category &&
    MEAT_CATEGORIES.has(category) &&
    (filters.includes("vegetarian") || filters.includes("vegan"))
  ) {
    return false;
  }
  return !recipe.ingredients.some((i) => textViolatesDiet(i.name, filters));
}

export function filterByDiet(
  recipes: Recipe[],
  filters: DietaryFilter[],
): { kept: Recipe[]; removedCount: number } {
  const kept = recipes.filter((r) => passesDietaryFilters(r, filters));
  return { kept, removedCount: recipes.length - kept.length };
}
