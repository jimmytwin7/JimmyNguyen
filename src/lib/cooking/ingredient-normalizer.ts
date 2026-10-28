/**
 * Ingredient name normalization.
 *
 * Two levels, on purpose:
 *
 * 1. `normalizeIngredient` — canonical spelling used to de-duplicate the
 *    user's pantry. Lowercases, strips punctuation, collapses whitespace,
 *    singularizes the last word, and applies a small alias table
 *    (`scallions` → `green onion`). It does NOT drop descriptive words, so
 *    `red onion` and `green onion` stay distinct pantry items.
 *
 * 2. `ingredientMatchKey` — a looser key used only for matching a pantry item
 *    against a recipe line. It additionally removes preparation/size words
 *    (`fresh`, `chopped`, `boneless`, `cloves`…) so `minced garlic` matches
 *    `garlic` and `chicken breasts` matches `chicken`.
 *
 * Both are conservative. Words that change what the ingredient *is* are never
 * stripped: `chicken stock` does not match `chicken`, `green onion` does not
 * match `onion`, `bell pepper` does not match `black pepper`.
 */

/** Spelling aliases → canonical name. Applied after basic cleanup. */
const ALIASES: Record<string, string> = {
  scallion: "green onion",
  "spring onion": "green onion",
  "garbanzo bean": "chickpea",
  garbanzo: "chickpea",
  capsicum: "bell pepper",
  "red bell pepper": "bell pepper",
  "green bell pepper": "bell pepper",
  "yellow bell pepper": "bell pepper",
  aubergine: "eggplant",
  courgette: "zucchini",
  "coriander leaf": "cilantro",
  "fresh coriander": "cilantro",
  "corn starch": "cornstarch",
  cornflour: "cornstarch",
  "corn flour": "cornstarch",
  "spaghetti noodle": "spaghetti",
  "soya sauce": "soy sauce",
  "ground black pepper": "black pepper",
  peppercorn: "black pepper",
  beancurd: "tofu",
  "bean curd": "tofu",
  yoghurt: "yogurt",
  "plain flour": "flour",
  "all purpose flour": "flour", // hyphens become spaces in cleanup()
};

/** Preparation, size, and cut words removed only for match keys. */
const MATCH_STRIP_WORDS = new Set([
  "fresh",
  "freshly",
  "chopped",
  "finely",
  "roughly",
  "diced",
  "minced",
  "sliced",
  "grated",
  "crushed",
  "large",
  "medium",
  "small",
  "boneless",
  "skinless",
  "whole",
  "ripe",
  "organic",
  "free",
  "range",
  "extra",
  "virgin",
  "unsalted",
  "plain",
  "clove",
  "breast",
  "thigh",
  "fillet",
  "leg",
  "drumstick",
  "wing",
  "can",
  "tin",
  "of",
]);

/**
 * Narrow equivalences used only when matching (not for pantry de-dupe), where
 * having one genuinely means you have the other for recipe purposes.
 */
const MATCH_ALIASES: Record<string, string> = {
  "red onion": "onion",
  "white onion": "onion",
  "yellow onion": "onion",
  "brown onion": "onion",
  "egg yolk": "egg",
  "egg white": "egg",
  "long grain rice": "rice",
  "basmati rice": "rice",
  "jasmine rice": "rice",
  "white rice": "rice",
  "cherry tomato": "tomato",
  "plum tomato": "tomato",
};

/** Singularize a single word with a few safe rules. */
function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (/(ss|us|is)$/.test(word)) return word;
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** Lowercase, strip punctuation, collapse whitespace, singularize last word. */
function cleanup(raw: string): string {
  const words = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // drop diacritics: jalapeño → jalapeno
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  words[words.length - 1] = singularize(words[words.length - 1]);
  return words.join(" ");
}

/** Canonical name used for pantry de-duplication. */
export function normalizeIngredient(raw: string): string {
  const cleaned = cleanup(raw);
  return ALIASES[cleaned] ?? cleaned;
}

/** Looser key used to match pantry items against recipe ingredient lines. */
export function ingredientMatchKey(raw: string): string {
  const normalized = normalizeIngredient(raw);
  const stripped = normalized
    .split(" ")
    // Singularize every word here so "cloves"/"breasts" hit the strip list.
    .map(singularize)
    .filter((w) => !MATCH_STRIP_WORDS.has(w))
    .join(" ");
  // If everything was a modifier (e.g. "large"), fall back to the normalized
  // form rather than producing an empty key that would match nothing.
  const key = stripped || normalized;
  return MATCH_ALIASES[key] ?? ALIASES[key] ?? key;
}
