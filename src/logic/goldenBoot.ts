/**
 * Golden Boot is auto-derived from goal data — never stored. Tally every goal
 * across finished matches (both teams' lists), excluding own goals, by exact
 * scorer `name`. The leader(s) are the joint-top scorers.
 */
import type { Match } from '@/data/sources/types';

export type ScorerTally = { name: string; goals: number };

/**
 * Normalize a scorer name for matching: strip diacritics, lowercase, trim,
 * collapse internal whitespace. Boot scoring is an exact match between a
 * picked name and openfootball's scorer strings; the two sources may spell
 * accents differently ("Mbappé" vs "Mbappe"), so we compare normalized.
 */
export function normalizeScorer(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Full descending tally of real goals by scorer name (own goals excluded). */
export function scorerTallies(matches: Match[]): ScorerTally[] {
  const counts = new Map<string, number>();
  for (const m of matches) {
    for (const g of [...(m.goals1 ?? []), ...(m.goals2 ?? [])]) {
      if (g.owngoal) continue;
      counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, goals]) => ({ name, goals }))
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
}

/** Joint-top scorers and their goal count. `names` empty if no goals yet. */
export function topScorers(matches: Match[]): { names: string[]; goals: number } {
  const tallies = scorerTallies(matches);
  if (tallies.length === 0) return { names: [], goals: 0 };
  const top = tallies[0].goals;
  return { names: tallies.filter((t) => t.goals === top).map((t) => t.name), goals: top };
}
