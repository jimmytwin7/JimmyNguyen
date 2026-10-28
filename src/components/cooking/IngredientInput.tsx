"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { MAX_PANTRY_INGREDIENTS } from "@/lib/cooking/config";
import { INGREDIENT_SUGGESTIONS } from "@/lib/cooking/ingredient-assets";
import { normalizeIngredient } from "@/lib/cooking/ingredient-normalizer";

interface IngredientInputProps {
  /** Normalized names already on the board (hidden from suggestions). */
  existing: ReadonlySet<string>;
  /** Returns an error message to show, or null on success. */
  onAdd: (name: string) => string | null;
  count: number;
}

const MAX_VISIBLE_SUGGESTIONS = 8;

/**
 * Ingredient entry as an ARIA 1.2 combobox: focus stays in the input while
 * ArrowUp/ArrowDown move through suggestions, Enter adds the highlighted one
 * (or the typed text), and Escape closes the list. Free text is allowed.
 */
export default function IngredientInput({
  existing,
  onAdd,
  count,
}: IngredientInputProps) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const listId = `${id}-list`;
  const messageId = `${id}-message`;
  const atLimit = count >= MAX_PANTRY_INGREDIENTS;

  const suggestions = useMemo(() => {
    const q = normalizeIngredient(value);
    if (!q) return [];
    const available = INGREDIENT_SUGGESTIONS.filter(
      (s) => !existing.has(normalizeIngredient(s)),
    );
    const starts = available.filter((s) => s.startsWith(q));
    const contains = available.filter((s) => !s.startsWith(q) && s.includes(q));
    return [...starts, ...contains].slice(0, MAX_VISIBLE_SUGGESTIONS);
  }, [value, existing]);

  const showList = open && suggestions.length > 0;

  function add(name: string) {
    const error = onAdd(name);
    setMessage(error);
    if (!error) {
      setValue("");
      setOpen(false);
      setActive(-1);
    }
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      add(showList && active >= 0 ? suggestions[active] : value);
    } else if (e.key === "Escape") {
      if (showList) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      }
    }
  }

  return (
    <div>
      <label
        htmlFor={`${id}-input`}
        className="mb-2 block pl-4 text-base font-bold text-app"
      >
        Add an ingredient you have
      </label>
      <div className="relative flex gap-2">
        <input
          ref={inputRef}
          id={`${id}-input`}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && active >= 0 ? `${id}-opt-${active}` : undefined
          }
          aria-describedby={messageId}
          autoComplete="off"
          enterKeyHint="done"
          maxLength={60}
          disabled={atLimit}
          placeholder={atLimit ? "Board is full" : "e.g. tomato, rice, garlic"}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
            setMessage(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
          className="min-w-0 flex-1 rounded-full border-2 border-[var(--pq-ink)] bg-surface px-5 py-3 text-base font-medium text-app shadow-[0_3px_0_var(--pq-ledge)] placeholder:text-faint focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--pq-sky)] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => add(value)}
          disabled={atLimit}
          className="pq-btn pq-btn-secondary shrink-0 px-5 py-3 text-base"
        >
          <Plus className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          Add
        </button>

        <ul
          id={listId}
          role="listbox"
          aria-label="Ingredient suggestions"
          hidden={!showList}
          className="pq-panel absolute left-0 right-0 top-full z-20 mt-3 max-h-72 overflow-auto py-2 sm:right-28"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input keeps focus and doesn't blur
              // the list closed before the selection registers.
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className={`cursor-pointer px-5 py-2 font-bold text-app ${
                i === active ? "bg-surface-raised" : "hover:bg-surface-raised"
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
      <p
        id={messageId}
        aria-live="polite"
        className="mt-3 min-h-[1.25rem] pl-4 text-sm font-bold"
      >
        {message ??
          (atLimit
            ? `You've reached the ${MAX_PANTRY_INGREDIENTS}-ingredient limit.`
            : "Press Enter to add. Any ingredient works; common ones have art.")}
      </p>
    </div>
  );
}
