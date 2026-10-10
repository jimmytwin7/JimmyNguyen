import type { TravelLocation } from "./types";

/**
 * Parse a location `date` string (`MM-DD-YYYY`) into a Date.
 *
 * The stored format is US-style `MM-DD-YYYY`, which does NOT sort correctly as
 * plain text, so anything ordering by date must parse first. Builds the Date
 * from explicit parts (not `new Date(string)`) to avoid timezone/locale
 * ambiguity in how browsers interpret date strings.
 */
export function parseTravelDate(date: string): Date {
  const [month, day, year] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Format a location `date` as e.g. "March 7, 2026". */
export function formatTravelDate(date: string): string {
  return parseTravelDate(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Return a new array of locations sorted newest-first by `date`.
 * Does not mutate the input.
 */
export function sortByDateDesc(locations: TravelLocation[]): TravelLocation[] {
  return [...locations].sort(
    (a, b) =>
      parseTravelDate(b.date).getTime() - parseTravelDate(a.date).getTime(),
  );
}
