import { describe, expect, it } from 'vitest';
import realFile from '@/data/sources/__fixtures__/worldcup.json';
import { transformAll } from '@/data/sources/openFootball';
import { teamRank } from '@/data/static';
import { deriveGroups, groupFixtures, teamFixtures, teamGroup } from './groups';

const matches = transformAll(realFile as never, new Date('2026-05-01T00:00:00Z'));

describe('deriveGroups', () => {
  const groups = deriveGroups(matches);

  it('yields 12 groups of 4 teams each', () => {
    expect(groups).toHaveLength(12);
    for (const g of groups) expect(g.teams).toHaveLength(4);
  });

  it('groups are named A–L in order', () => {
    expect(groups.map((g) => g.name)).toEqual([
      'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F',
      'Group G', 'Group H', 'Group I', 'Group J', 'Group K', 'Group L',
    ]);
  });

  it('covers exactly the 48 qualified teams, no placeholders', () => {
    const all = groups.flatMap((g) => g.teams);
    expect(all).toHaveLength(48);
    expect(new Set(all).size).toBe(48);
    expect(all.some((t) => /^[12][A-L]$|^[WL]\d+$/.test(t))).toBe(false);
  });

  it('teams within a group are sorted best-rank-first', () => {
    for (const g of groups) {
      const ranks = g.teams.map((t) => teamRank(t) ?? Infinity);
      const sorted = [...ranks].sort((a, b) => a - b);
      expect(ranks).toEqual(sorted);
    }
  });
});

describe('groupFixtures', () => {
  it('returns 6 fixtures for a group, sorted by kickoff', () => {
    const fixtures = groupFixtures(matches, 'Group A');
    expect(fixtures).toHaveLength(6);
    const times = fixtures.map((m) => m.kickoffUTC);
    expect(times).toEqual([...times].sort());
  });
});

describe('teamFixtures', () => {
  it('returns a team\'s 3 group games sorted by kickoff', () => {
    const fixtures = teamFixtures(matches, 'Brazil');
    expect(fixtures).toHaveLength(3);
    for (const m of fixtures) expect(m.team1 === 'Brazil' || m.team2 === 'Brazil').toBe(true);
    const times = fixtures.map((m) => m.kickoffUTC);
    expect(times).toEqual([...times].sort());
  });

  it('returns [] for an unknown team', () => {
    expect(teamFixtures(matches, 'Atlantis')).toEqual([]);
  });
});

describe('teamGroup', () => {
  it('returns the group a team belongs to', () => {
    expect(teamGroup(matches, 'Brazil')).toBe('Group C');
  });
  it('returns undefined for an unknown team', () => {
    expect(teamGroup(matches, 'Atlantis')).toBeUndefined();
  });
});
