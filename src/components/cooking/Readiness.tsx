import { readinessLabel } from "@/lib/cooking/match-labels";

/**
 * The headline above the match meter: how close a recipe is to cookable.
 * Text in the ink color, so meaning never depends on color.
 */
export default function Readiness({
  missingCount,
  className = "",
}: {
  missingCount: number;
  className?: string;
}) {
  return (
    <p className={`text-base font-bold text-[var(--pq-ink)] ${className}`}>
      {readinessLabel(missingCount)}
    </p>
  );
}
