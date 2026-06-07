import { describe, expect, it } from 'vitest';
import realFile from '../sources/__fixtures__/worldcup.json';
import { transformAll } from '../sources/openFootball';
import { leaguePool } from '@/logic/leagueStages';
import {
  filterCandidatesToPool,
  goldenBallCandidates,
  goldenBootCandidates,
} from './awards';

const pool = leaguePool(transformAll(realFile as never, new Date('2026-05-01T00:00:00Z')));

describe('filterCandidatesToPool', () => {
  it('keeps only candidates whose team is in the qualified pool', () => {
    const out = filterCandidatesToPool(
      [
        { name: 'Real Guy', team: 'Brazil' },
        { name: 'Phantom', team: 'Atlantis' },
      ],
      pool,
    );
    expect(out.map((c) => c.name)).toEqual(['Real Guy']);
  });

  it('every bundled Golden Boot candidate is on a qualified team', () => {
    expect(filterCandidatesToPool(goldenBootCandidates, pool)).toHaveLength(goldenBootCandidates.length);
  });

  it('every bundled Golden Ball candidate is on a qualified team', () => {
    expect(filterCandidatesToPool(goldenBallCandidates, pool)).toHaveLength(goldenBallCandidates.length);
  });

  it('no candidate is from a non-qualified nation (Nigeria, Serbia, etc.)', () => {
    const banned = new Set(['Nigeria', 'Serbia', 'Poland', 'Denmark', 'Costa Rica', 'Cameroon', 'Wales']);
    const all = [...goldenBootCandidates, ...goldenBallCandidates];
    expect(all.filter((c) => banned.has(c.team))).toEqual([]);
  });
});
