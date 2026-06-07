import { describe, expect, it } from 'vitest';
import type { Match } from '@/data/sources/types';
import { scorerTallies, topScorers } from './goldenBoot';

function m(goals1: Match['goals1'], goals2: Match['goals2']): Match {
  return {
    id: 'x',
    round: 'Matchday 1',
    kickoffUTC: '2026-06-11T19:00:00.000Z',
    ground: 'X',
    team1: 'A',
    team2: 'B',
    status: 'finished',
    score: { ft: [0, 0] },
    goals1,
    goals2,
  };
}

describe('goldenBoot tally', () => {
  it('counts goals across both teams and matches', () => {
    const matches = [
      m([{ name: 'Messi', minute: 10 }], [{ name: 'Mbappé', minute: 20 }]),
      m([{ name: 'Messi', minute: 30 }], []),
    ];
    const t = scorerTallies(matches);
    expect(t[0]).toEqual({ name: 'Messi', goals: 2 });
    expect(t.find((x) => x.name === 'Mbappé')?.goals).toBe(1);
  });

  it('excludes own goals', () => {
    const matches = [m([{ name: 'Defender', minute: 5, owngoal: true }], [{ name: 'Striker', minute: 9 }])];
    const t = scorerTallies(matches);
    expect(t.find((x) => x.name === 'Defender')).toBeUndefined();
    expect(topScorers(matches)).toEqual({ names: ['Striker'], goals: 1 });
  });

  it('returns joint leaders on a tie', () => {
    const matches = [m([{ name: 'A', minute: 1 }], [{ name: 'B', minute: 2 }])];
    expect(topScorers(matches)).toEqual({ names: ['A', 'B'], goals: 1 });
  });

  it('handles no goals', () => {
    expect(topScorers([])).toEqual({ names: [], goals: 0 });
  });
});
