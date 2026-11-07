import { M_PLUS_Rounded_1c } from "next/font/google";
import PantryQuest from "@/components/cooking/PantryQuest";
import PantryQuestHeader from "@/components/cooking/PantryQuestHeader";
import { PROJECT_NAME } from "@/lib/cooking/config";
import { getCatalog } from "@/lib/cooking/server/catalog";
import { buildSuggestions } from "@/lib/cooking/server/suggestions";

// Rounded Japanese-style face for headings and buttons (body text stays the
// site's Figtree). Loaded only on this route, so other pages don't pay for it.
const rounded = M_PLUS_Rounded_1c({
  weight: ["700", "800"],
  variable: "--font-pq-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: `${PROJECT_NAME} — Jimmy Nguyen`,
  description:
    "Add the ingredients you have and find real recipes with a transparent ingredient-match score.",
};

export default async function CookingPage() {
  // Built at prerender time from the build's recipe catalog, so the page stays
  // static and every suggestion finds at least one recipe. Only ingredient
  // names reach the browser, never the catalog itself.
  const suggestions = buildSuggestions(await getCatalog());

  return (
    // .pq-stage (globals.css) breaks out to full width under the nav and
    // re-skins the theme tokens for everything inside.
    <div className={`pq-stage ${rounded.variable}`}>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <PantryQuestHeader />
        <PantryQuest suggestions={suggestions} />
      </div>
    </div>
  );
}
