import { DIETARY_FILTERS } from "@/lib/cooking/config";
import type { DietaryFilter } from "@/lib/cooking/types";

interface DietaryFiltersProps {
  selected: DietaryFilter[];
  onChange: (next: DietaryFilter[]) => void;
  assumeStaples: boolean;
  onAssumeStaplesChange: (value: boolean) => void;
}

const chip =
  "flex cursor-pointer items-center gap-2 rounded-full border-2 border-line bg-surface px-3 py-1.5 text-sm font-bold text-app has-[:checked]:border-transparent has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--accent)]";

export default function DietaryFilters({
  selected,
  onChange,
  assumeStaples,
  onAssumeStaplesChange,
}: DietaryFiltersProps) {
  const toggle = (value: DietaryFilter) =>
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-3 text-sm font-bold text-app">
          Dietary preferences{" "}
          <span className="font-normal text-muted">(best-effort)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {DIETARY_FILTERS.map((f) => {
            const checked = selected.includes(f.value);
            return (
              <label
                key={f.value}
                className={chip}
                style={
                  checked ? { backgroundColor: "var(--accent)" } : undefined
                }
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggle(f.value)}
                />
                <span aria-hidden="true">{checked ? "✓" : "+"}</span>
                {f.label}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs font-medium text-muted">
          Filters scan recipe data that may be incomplete. Not suitable for
          managing allergies.
        </p>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-3 text-sm font-bold text-app">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 accent-[var(--accent)]"
          checked={assumeStaples}
          onChange={(e) => onAssumeStaplesChange(e.target.checked)}
        />
        <span>
          Assume I have salt, pepper &amp; water
          <span className="block text-xs text-muted">
            They&apos;re counted as available when scoring.
          </span>
        </span>
      </label>
    </div>
  );
}
