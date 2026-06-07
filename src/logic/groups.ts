/**
 * Derive group-stage structure straight from the fixtures — no static config.
 * Any match with a `group` contributes both teams to that group. Placeholders
 * never appear in group-stage fixtures, so this is automatically the clean 48.
 */
import type { Match } from '@/data/sources/types';
import { teamRank } from '@/data/static';

export type Group = { name: string; teams: string[] };

export function deriveGroups(matches: Match[]): Group[] {
  const byGroup = new Map<string, Set<string>>();
  for (const m of matches) {
    if (!m.group) continue;
    if (!byGroup.has(m.group)) byGroup.set(m.group, new Set());
    const set = byGroup.get(m.group)!;
    set.add(m.team1);
    set.add(m.team2);
  }
  return [...byGroup.entries()]
    .map(([name, teams]) => ({ name, teams: sortByRank([...teams]) }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/** Rank ascending (best first); unranked teams sink to the bottom, then alpha. */
function sortByRank(teams: string[]): string[] {
  return teams.sort((a, b) => {
    const ra = teamRank(a) ?? Infinity;
    const rb = teamRank(b) ?? Infinity;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

/** A group's fixtures, sorted by kickoff (6 per group in the 2026 format). */
export function groupFixtures(matches: Match[], groupName: string): Match[] {
  return matches
    .filter((m) => m.group === groupName)
    .sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime());
}

/** A team's fixtures (group games pre-tournament), sorted by kickoff. */
export function teamFixtures(matches: Match[], team: string): Match[] {
  return matches
    .filter((m) => m.team1 === team || m.team2 === team)
    .sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime());
}

/** The group a team belongs to, or undefined if it has no group-stage match. */
export function teamGroup(matches: Match[], team: string): string | undefined {
  return matches.find((m) => m.group && (m.team1 === team || m.team2 === team))?.group;
}
