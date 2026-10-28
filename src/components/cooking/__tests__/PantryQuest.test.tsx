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
  const match = (r: ReturnType<typeof recipe>) => ({
    recipe: r,
    matchPercentage: 0,
    matchedIngredients: [],
    assumedIngredients: [],
    missingIngredients: [],
    optionalIngredients: [],
    scoreExplanation: "",
  });
  // Scores are recomputed client-side from the recipes, so placeholders here
  // also prove the UI shows computed values, not hardcoded ones.
  return {
    matches: [
      match(recipe("mealdb-1", "Chicken Rice", ["Chicken", "Rice", "Butter"])),
      match(
        recipe("mealdb-2", "Beef Stew", ["Beef", "Rice"], { category: "Beef" }),
      ),
    ],
    meta: {
      provider: "TheMealDB",
      queriedIngredients: ["chicken", "rice"],
      filteredOutCount: 0,
      partial: false,
    },
  };
}

type FetchMode = "ok" | "empty" | "error";
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
  render(<PantryQuest />);
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
    expect(board().getAllByRole("listitem")).toHaveLength(1);

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
      name: /order up! 2 recipes/i,
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

  it("searches and shows computed scores", async () => {
    const { user, input } = setup();
    await user.type(input, "chicken{Enter}rice{Enter}");
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));

    expect(await screen.findByText("Chicken Rice")).toBeInTheDocument();
    // Chicken Rice: chicken + rice of 3 → 67%. Beef Stew: rice of 2 → 50%.
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(
      screen.getByText("You have 2 of 3 listed ingredients."),
    ).toBeInTheDocument();
    const fetchUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(fetchUrl).toContain("ingredients=chicken%2Crice");
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
  });

  it("applies dietary filters live and can clear them", async () => {
    const { user, input } = setup();
    await user.type(input, "rice{Enter}");
    await user.click(screen.getByRole("button", { name: /find my recipe/i }));
    await screen.findByText("Beef Stew");

    await user.click(screen.getByRole("checkbox", { name: /vegetarian/i }));
    expect(screen.queryByText("Beef Stew")).not.toBeInTheDocument();
    expect(screen.queryByText("Chicken Rice")).not.toBeInTheDocument();
    expect(screen.getByText(/hid all 2 matching recipes/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(screen.getByText("Beef Stew")).toBeInTheDocument();
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
