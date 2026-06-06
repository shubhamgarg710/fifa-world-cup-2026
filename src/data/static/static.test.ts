import { describe, expect, it } from 'vitest';
import realFile from '../sources/__fixtures__/worldcup.json';
import { teamFlag, teamMeta, teamRank, teamsByConfederation } from './index';

const groupTeams: string[] = [];
for (const m of (realFile as { matches: { team1: string; team2: string; group?: string }[] }).matches) {
  if (!m.group) continue;
  if (!groupTeams.includes(m.team1)) groupTeams.push(m.team1);
  if (!groupTeams.includes(m.team2)) groupTeams.push(m.team2);
}

describe('static team metadata', () => {
  it('every qualified team has a flag + confederation', () => {
    const missing: string[] = [];
    for (const t of groupTeams) if (!teamMeta(t)) missing.push(t);
    expect(missing).toEqual([]);
  });

  it('every qualified team has a ranking', () => {
    const missing: string[] = [];
    for (const t of groupTeams) if (teamRank(t) === undefined) missing.push(t);
    expect(missing).toEqual([]);
  });

  it('teamFlag falls back to a white flag for unknowns', () => {
    expect(teamFlag('Atlantis')).toBe('🏳️');
  });

  it('teamsByConfederation groups every team in teams.json', () => {
    const groups = teamsByConfederation();
    const total = Object.values(groups).reduce((n, list) => n + list.length, 0);
    // The 48 2026 qualifiers are always present; demo-only WC22 teams may add to this.
    expect(total).toBeGreaterThanOrEqual(48);
  });
});
