import rankingsFile from './rankings.json';
import teamsFile from './teams.json';

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';

export type TeamMeta = { flag: string; confederation: Confederation };

const teams = teamsFile as Record<string, TeamMeta>;
const rankings = (rankingsFile as { rankings: Record<string, number> }).rankings;

export function teamMeta(name: string): TeamMeta | undefined {
  return teams[name];
}

export function teamFlag(name: string): string {
  return teams[name]?.flag ?? '🏳️';
}

export function teamRank(name: string): number | undefined {
  return rankings[name];
}

export function allQualifiedTeams(): string[] {
  return Object.keys(teams).sort();
}

export function teamsByConfederation(): Record<Confederation, string[]> {
  const groups: Record<Confederation, string[]> = {
    UEFA: [], CONMEBOL: [], CONCACAF: [], CAF: [], AFC: [], OFC: [],
  };
  for (const [name, meta] of Object.entries(teams)) {
    groups[meta.confederation].push(name);
  }
  for (const c of Object.keys(groups) as Confederation[]) groups[c].sort();
  return groups;
}
