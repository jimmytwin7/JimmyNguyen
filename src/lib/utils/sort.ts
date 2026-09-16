import type { Company } from "../data/experience";

/**
 * Sorts companies reverse-chronologically (most recent first).
 *
 * The sort key is the latest `endDate` across all of a company's roles, so a
 * company with any current role floats to the top. `"present"` is treated as
 * the largest possible date. Returns a new array; the input is not mutated.
 */
export function reverseChronological(entries: Company[]): Company[] {
  const toMs = (d: string | "present"): number =>
    d === "present" ? Number.MAX_SAFE_INTEGER : new Date(d).getTime();

  const latestEndDate = (company: Company): number =>
    Math.max(...company.roles.map((r) => toMs(r.endDate)));

  return [...entries].sort((a, b) => latestEndDate(b) - latestEndDate(a));
}
