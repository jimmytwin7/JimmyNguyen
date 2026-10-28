# Ingredient illustrations: credits

The pixel-art ingredient icons (`chicken.png`, `tomato.png`, etc.) are from
**Pixeltier's Food & Cooking RPG Icons** by Pixeltier
(https://pixeltier.itch.io/pixeltiers-food-rpg-icon-set), purchased and used
under the pack's license.

Each PNG at the top level is a renamed copy of one pack icon, matched to an
ingredient key in `src/lib/cooking/ingredient-assets.ts`.

**License summary** (the pack's own license is the authoritative text). It
permits use and modification in personal and commercial projects, including
embedding the icons in this website. It prohibits redistributing or sharing the
assets as a standalone pack, uploading them to asset libraries or "free asset"
collections, bundling them in tools where others could extract them, and using
them to train AI/ML models. In this repo the icons exist only as site assets
under `public/`, not offered for download as a pack.

Two original pixel-style boxes were made for this site:

| File          | Shown for                                                | License  |
| ------------- | -------------------------------------------------------- | -------- |
| `no-art.svg`  | A known ingredient with no icon in the pack (fork+knife) | Original |
| `unknown.svg` | An unrecognized / free-text ingredient ("?")             | Original |

When adding art for a currently uncovered ingredient (honey, ginger, shrimp,
soy sauce, olive oil, black pepper), drop the file here and set that entry's
`file` in `ingredient-assets.ts`.
