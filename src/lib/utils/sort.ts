import type { Company } from '../data/experience';

/**
 * Returns a new array of Company sorted reverse-chronologically (most recent first).
 * Sort key is the latest endDate across all roles in the company.
 * "present" is treated as the highest possible date value so current roles always appear first.
 *
 * Does not mutate the original array.
 */
export function reverseChronological(entries: Company[]): Company[] {
  const toMs = (d: string | 'present'): number =>
    d === 'present' ? Number.MAX_SAFE_INTEGER : new Date(d).getTime();

  const latestEndDate = (company: Company): number =>
    Math.max(...company.roles.map((r) => toMs(r.endDate)));

  return [...entries].sort((a, b) => latestEndDate(b) - latestEndDate(a));
}
