interface MatchMeterProps {
  percentage: number;
}

/**
 * "Ingredient match: 87%" plus a chunky striped game bar. The percentage is
 * always shown as text, so the bar's color is never the only signal.
 */
export default function MatchMeter({ percentage }: MatchMeterProps) {
  return (
    <div>
      <p className="text-sm font-bold text-app">
        Ingredient match: <span className="tabular-nums">{percentage}%</span>
      </p>
      <div aria-hidden="true" className="pq-meter mt-1.5 w-full">
        <span
          className="transition-[width] duration-500 motion-reduce:transition-none"
          style={{
            width: `${percentage}%`,
            // A 0% bar shouldn't show a stray divider line.
            borderRightWidth: percentage === 0 ? 0 : undefined,
          }}
        />
      </div>
    </div>
  );
}
