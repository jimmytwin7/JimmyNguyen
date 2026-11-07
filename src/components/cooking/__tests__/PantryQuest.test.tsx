import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { RecipeSearchResponse } from "@/lib/cooking/types";
import { normalizeIngredient } from "@/lib/cooking/ingredient-normalizer";
import PantryQuest from "../PantryQuest";

// Animations are irrelevant to behaviour; render motion elements as plain DOM
// so exit animations can't keep removed items mounted.
vi.mock("framer-motion", () => {
  const strip = ({
    layout,
    initial,
    animate,
    exit,
    transition,
    ...rest
  }: Record<string, unknown>) => {
    void layout;
    void initial;
    void animate;
    void exit;
    void transition;
    return rest;
  };
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useReducedMotion: () => true,
    motion: {
      li: (props: Record<string, unknown>) => <li {...strip(props)} />,
      div: (props: Record<string, unknown>) => <div {...strip(props)} />,
      article: (props: Record<string, unknown>) => (
        <article {...strip(props)} />
      ),
    },
  };
});

const ing = (name: string, quantity?: string) => ({
  name,
  normalizedName: normalizeIngredient(name),
  quantity,
});

function searchResponse(): RecipeSearchResponse {
  const recipe = (id: string, title: string, names: string[], extra = {}) => ({
    id,
    title,
    sourceName: "TheMealDB",
    providerUrl: `https://www.themealdb.com/meal/${id}`,
    ingredients: names.map((n) => ing(n, "1 cup")),
    instructions: [
      "Rinse the rice.",
      "Cook the chicken.",
      "Combine and serve.",
    ],
    ...extra,
  });
  type R = ReturnType<typeof recipe>;
  const pick = (r: R, names: string[]) =>
    r.ingredients.filter((i) => names.includes(i.name));
  const match = (
    r: R,
    matched: string[],
    missing: string[],
    matchPercentage: number,
    scoreExplanation: string,
    assumed: string[] = [],
  ) => ({
    recipe: r,
    matchPercentage,
    matchedIngredients: pick(r, matched),
    assumedIngredients: pick(r, assumed),
    missingIngredients: pick(r, missing),
    optionalIngredients: [],
    scoreExplanation,
  });
  // The server ranks and scores; the UI shows its values as-is.
  return {
    matches: [
      match(
        recipe("mealdb-1", "Chicken Rice", [
          "Chicken",
          "Rice",
          "Butter",
          "Salt",
        ]),
        ["Chicken", "Rice"],
        ["Butter"],
        75,
        "You have 3 of 4 listed ingredients (salt assumed).",
        ["Salt"],
      ),
      match(
        recipe("mealdb-2", "Beef Stew", ["Beef", "Rice"], { category: "Beef" }),
        ["Rice"],
        ["Beef"],
        50,
        "You have 1 of 2 listed ingredients.",
      ),
      match(
        recipe("mealdb-3", "Apple Rice", ["Apple", "Rice", "Leek", "Kale"]),
        ["Rice"],
        ["Apple", "Leek", "Kale"],
        25,
        "You have 1 of 4 listed ingredients.",
      ),
    ],
    meta: {
      provider: "TheMealDB",
      recipeCount: 790,
      candidateCount: 3,
      filteredOutCount: 0,
      catalogDate: "2025-01-01T00:00:00.000Z",
    },
  };
}

type FetchMode = "ok" | "empty" | "error" | "unavailable";
let fetchMode: FetchMode = "ok";

beforeEach(() => {
  fetchMode = "ok";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.startsWith("/api/substitutions")) {
        return Response.json({
          suggestions: [
            {
              ingredient: "Butter",
              substitute: "olive oil",
              ratio: "¾",
            },
          ],
          skipped: [],
        });
      }
      if (fetchMode === "unavailable")
        return Response.json(
          {
            error: "Recipe data isn't available in this build.",
            retryable: false,
          },
          { status: 503 },
        );
      // Any diet filter leaves nothing in this fake catalog.
      if (url.includes("diet="))
        return Response.json({
          ...searchResponse(),
          matches: [],
          meta: { ...searchResponse().meta, filteredOutCount: 3 },
        });
      if (fetchMode === "error")
        return Response.json(
          { error: "We couldn't reach the recipe service.", retryable: true },
          { status: 502 },
        );
      if (fetchMode === "empty")
        return Response.json({ ...searchResponse(), matches: [] });
      return Response.json(searchResponse());
    }),
  );
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function setup() {
  const user = userEvent.setup();
  render(<PantryQuest suggestions={["tomato", "rice", "garlic"]} />);
  const input = screen.getByRole("combobox", { name: /add an ingredient/i });
  const board = () =>
    within(screen.getByRole("region", { name: /cutting board/i }));
  return { user, input, board };
}

describe("PantryQuest", () => {
  it("adds ingredients with Enter and the Add button", async () => {
    const { user, input, board } = setup();
    await user.type(input, "chicken{Enter}");
    await user.type(input, "Rice");
    await user.click(screen.getByRole("button", { name: /^add$/i }));
    expect(board().getByText("chicken")).toBeInTheDocument();
    expect(board().getByText("rice")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("supports keyboard selection from suggestions", async () => {
    const { user, input, board } = setup();
    await user.type(input, "tom");
    expect(screen.getByRole("listbox")).toBeVisible();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(board().getByText("tomato")).toBeInTheDocument();
  });

  it("closes suggestions with Escape", async () => {
    const { user, input } = setup();
    await user.type(input, "tom");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("prevents duplicates and removes items", async () => {
    const { user, input, board } = setup();
    await user.type(input, "eggs{Enter}");
    await user.type(input, "Egg{Enter}");
    expect(screen.getByText(/already on the board/i)).toBeInTheDocument();
    expect(
      within(
        board().getByRole("list", { name: /ingredients on the board/i }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Remove eggs" }));
    expect(board().queryByText("eggs")).not.toBeInTheDocument();
  });

  it("focuses the results after a search and offers an Order up shortcut", async () => {
    const { user, input } = setup();
    await user.type(input, "rice{Enter}");
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));

    const heading = await screen.findByRole("heading", {
      name: /order up: recipes/i,
    });
    await waitFor(() => expect(heading).toHaveFocus());

    const orderUp = screen.getByRole("button", {
      name: /order up! 3 recipes/i,
    });
    orderUp.focus();
    await user.click(orderUp);
    expect(heading).toHaveFocus();
  });

  it("toggles ingredients from the pantry shelf", async () => {
    const { user, board } = setup();
    const shelf = within(screen.getByRole("region", { name: /pantry shelf/i }));
    const tomato = shelf.getByRole("button", { name: "Tomato" });
    expect(tomato).toHaveAttribute("aria-pressed", "false");

    await user.click(tomato);
    expect(board().getByText("tomato")).toBeInTheDocument();
    expect(tomato).toHaveAttribute("aria-pressed", "true");

    await user.click(tomato);
    expect(board().queryByText("tomato")).not.toBeInTheDocument();
    expect(tomato).toHaveAttribute("aria-pressed", "false");
  });

  it("marks typed ingredients as on the shelf", async () => {
    const { user, input } = setup();
    await user.type(input, "Eggs{Enter}");
    const shelf = within(screen.getByRole("region", { name: /pantry shelf/i }));
    expect(shelf.getByRole("button", { name: "Egg" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("adds a shelf item dropped onto the board", () => {
    setup();
    const boardEl = screen.getByRole("region", { name: /cutting board/i });
    const dataTransfer = {
      types: ["application/x-pantry-ingredient"],
      getData: () => "garlic",
      dropEffect: "none",
    };
    fireEvent.dragOver(boardEl, { dataTransfer });
    fireEvent.drop(boardEl, { dataTransfer });
    expect(within(boardEl).getByText("garlic")).toBeInTheDocument();
  });

  it("clears the board", async () => {
    const { user, input, board } = setup();
    await user.type(input, "rice{Enter}garlic{Enter}");
    await user.click(screen.getByRole("button", { name: /clear all/i }));
    expect(board().getByText(/board is empty/i)).toBeInTheDocument();
  });

  it("disables search until an ingredient is added", async () => {
    const { user, input } = setup();
    const search = screen.getByRole("button", { name: /find my recipe/i });
    expect(search).toBeDisabled();
    await user.type(input, "rice{Enter}");
    expect(search).toBeEnabled();
  });

  it("serves the best match on the plate and the rest on the rail", async () => {
    const { user, input } = setup();
    await user.type(input, "chicken{Enter}rice{Enter}");
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));

    const results = within(
      await screen.findByRole("region", { name: /order up: recipes/i }),
    );
    expect(
      await results.findByText("Scored all 790 recipes against your board."),
    ).toBeInTheDocument();
    expect(
      results.getByText(
        "Ranked by how many of your ingredients each recipe uses, then ingredient match, then fewest to buy.",
      ),
    ).toBeInTheDocument();

    // matches[0] is the plate: ribbon, reason line, headline, server values.
    const ribbon = results.getByText("Best match", { selector: "p" });
    const hero = within(ribbon.closest("article")!);
    expect(
      hero.getByRole("heading", { level: 3, name: "Chicken Rice" }),
    ).toBeInTheDocument();
    expect(
      hero.getByText("Uses all 2 of your ingredients."),
    ).toBeInTheDocument();
    expect(hero.getByText("Need 1 more")).toBeInTheDocument();
    expect(hero.getByText("75%")).toBeInTheDocument();
    expect(
      hero.getByText("You have 3 of 4 listed ingredients (salt assumed)."),
    ).toBeInTheDocument();

    // The rail holds only the others, with headlines.
    const rail = within(
      results.getByRole("list", { name: /also on the menu/i }),
    );
    const railTitles = () =>
      rail.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(railTitles()).toEqual(["Beef Stew", "Apple Rice"]);
    expect(rail.queryByText("Best match")).toBeNull();
    expect(rail.getByText("Need 1 more")).toBeInTheDocument();
    expect(rail.getByText("Need 3 more")).toBeInTheDocument();

    // The plate separates the board from assumed staples; staples are never
    // listed as things you have.
    const groupItems = (scope: typeof hero, label: RegExp) =>
      scope.getByText(label).closest("div")!.querySelectorAll("p")[1]
        .textContent;
    expect(groupItems(hero, /from your board \(2\)/i)).toBe("Chicken, Rice");
    expect(groupItems(hero, /pantry basics \(1\)/i)).toBe("Salt");
    expect(hero.queryByText(/you have \(/i)).toBeNull();
    // Chicken Rice uses the whole board, so there's no "Not used" line.
    expect(hero.queryByText(/not used from your board/i)).toBeNull();

    // Rail tickets stay lean: no pantry basics, no explanation sentence, but
    // they do say what they ignore from the board.
    expect(rail.queryByText(/pantry basics/i)).toBeNull();
    expect(rail.queryByText(/listed ingredients/i)).toBeNull();
    expect(rail.getAllByText(/from your board \(1\)/i)).toHaveLength(2);
    const unused = rail
      .getAllByText(/not used from your board/i)
      .map((el) => el.closest("p")!.textContent);
    expect(unused).toEqual([
      "Not used from your board: chicken",
      "Not used from your board: chicken",
    ]);

    // Sorting reorders the rail only; the plate never moves.
    await user.selectOptions(
      results.getByRole("combobox", { name: /sort these by/i }),
      "title",
    );
    expect(railTitles()).toEqual(["Apple Rice", "Beef Stew"]);
    expect(
      hero.getByRole("heading", { level: 3, name: "Chicken Rice" }),
    ).toBeInTheDocument();

    const fetchUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchUrl).toContain("ingredients=chicken%2Crice");
    expect(fetchUrl).not.toContain("staples");
    expect(fetchUrl).not.toContain("diet");
  });

  it("shows pantry basics on the board without counting them", () => {
    const { board } = setup();
    const basics = within(
      board().getByRole("list", { name: /pantry basics/i }),
    );
    expect(basics.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["Salt", "Pepper", "Oil", "Water"],
    );
    expect(board().getByText("Always stocked")).toBeInTheDocument();
    // They're not board ingredients: the count stays 0 and search is off.
    expect(
      board().getByRole("heading", { name: /cutting board \(0\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /find my recipe/i }),
    ).toBeDisabled();
    expect(basics.queryAllByRole("button")).toHaveLength(0);
  });

  it("suggests from the list it's given, most-used first", async () => {
    const user = userEvent.setup();
    render(<PantryQuest suggestions={["quinoa", "squash", "quince"]} />);
    const input = screen.getByRole("combobox", { name: /add an ingredient/i });
    await user.type(input, "qu");
    // Names starting with "qu" first (in list order), then names containing it.
    expect(
      within(screen.getByRole("listbox"))
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["quinoa", "quince", "squash"]);
  });

  it("never suggests staples by default", async () => {
    const { user, input } = setup();
    await user.type(input, "wat");
    expect(screen.queryByRole("option", { name: /water/i })).toBeNull();
  });

  it("has no staples toggle", () => {
    setup();
    expect(
      screen.queryByRole("checkbox", { name: /salt, pepper/i }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
  });

  it("shows no-results and error states", async () => {
    const { user, input } = setup();
    await user.type(input, "rice{Enter}");

    fetchMode = "empty";
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));
    expect(await screen.findByText(/no recipes found/i)).toBeInTheDocument();

    fetchMode = "error";
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));
    // Shown in the error panel and announced via the live region.
    expect(
      await screen.findAllByText(/couldn't reach the recipe service/i),
    ).toHaveLength(2);

    fetchMode = "ok";
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Chicken Rice")).toBeInTheDocument();

    fetchMode = "unavailable";
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));
    expect(
      await screen.findAllByText("Recipe data isn't available in this build."),
    ).toHaveLength(2);
    // Retrying can't help, so there's no retry button.
    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();
  });

  it("re-runs the search once, debounced, when diet filters change", async () => {
    const { user, input } = setup();
    // Filters alone don't search before the first search.
    await user.click(screen.getByRole("checkbox", { name: /vegan/i }));
    await user.click(screen.getByRole("checkbox", { name: /vegan/i }));
    await new Promise((r) => setTimeout(r, 400));
    expect(fetch).not.toHaveBeenCalled();

    await user.type(input, "rice{Enter}");
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));
    await screen.findByText("Beef Stew");
    expect(fetch).toHaveBeenCalledTimes(1);

    // Two quick toggles → one search with both filters.
    const vegetarian = screen.getByRole("checkbox", { name: /vegetarian/i });
    await user.click(vegetarian);
    await user.click(screen.getByRole("checkbox", { name: /gluten-free/i }));
    expect(fetch).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const url = vi.mocked(fetch).mock.calls[1][0] as string;
    expect(url).toContain("ingredients=rice");
    expect(url).toContain("diet=vegetarian%2Cgluten-free");
    // Focus stays on the filters (no jump to the results).
    expect(
      screen.getByRole("checkbox", { name: /gluten-free/i }),
    ).toHaveFocus();

    expect(
      await screen.findByText("No recipes match these filters"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Beef Stew")).not.toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 400));
    expect(fetch).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(await screen.findByText("Beef Stew")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(vi.mocked(fetch).mock.calls[2][0]).not.toContain("diet");
  });

  it("opens details, loads substitutions, and steps through Cooking Mode", async () => {
    const { user, input } = setup();
    await user.type(input, "chicken{Enter}rice{Enter}");
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));
    await user.click(
      await screen.findByRole("button", { name: /view recipe.*chicken rice/i }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Chicken Rice" }),
    ).toHaveFocus();

    // Assumed staples read differently from ingredients you added.
    expect(screen.getAllByText("From your pantry")).toHaveLength(1);
    expect(screen.getByText("Assumed pantry staple")).toBeInTheDocument();
    expect(screen.getByText("Need 1 more")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /suggest substitutions/i }),
    );
    expect(await screen.findByText("Try olive oil")).toBeInTheDocument();
    expect(screen.getByText(/never allergy advice/i)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /start cooking mode/i }),
    );
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "3",
    );

    await user.click(screen.getByRole("button", { name: /finish/i }));
    await user.click(screen.getByRole("button", { name: /back to results/i }));
    await waitFor(() =>
      expect(screen.getByText("Beef Stew")).toBeInTheDocument(),
    );
  });
});
