import { describe, expect, it } from 'vitest';
import type { Match } from '@/data/sources/types';
import type { MyTeams } from '@/logic/verdict';
import { sortToday } from './TodaySection';

function mk(over: { id: string; kickoff: string } & Partial<Omit<Match, 'kickoffUTC'>>): Match {
  const { kickoff, ...rest } = over;
  return {
    round: 'Matchday 1',
    group: 'Group A',
    kickoffUTC: kickoff,
    ground: 'X',
    team1: 'Qatar',
    team2: 'South Africa',
    status: 'scheduled',
    ...rest,
  };
}

const NONE: MyTeams = { support: [], follow: [] };

describe('sortToday', () => {
  it('orders non-my-team matches strictly by kickoff regardless of watchability', () => {
    // 11pm "high tier" (Brazil vs France: both top-12) must NOT float above 6pm "normal tier"
    const sixPM_normal = mk({
      id: 'a',
      kickoff: '2026-06-11T18:00:00Z',
      team1: 'Qatar',
      team2: 'South Africa',
    });
    const elevenPM_high = mk({
      id: 'b',
      kickoff: '2026-06-11T23:00:00Z',
      team1: 'Brazil',
      team2: 'France',
    });
    const out = sortToday([elevenPM_high, sixPM_normal], NONE);
    expect(out.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('floats my-team match to the top regardless of kickoff', () => {
    const earlyOther = mk({
      id: 'a',
      kickoff: '2026-06-11T10:00:00Z',
      team1: 'Qatar',
      team2: 'South Africa',
    });
    const lateMine = mk({
      id: 'b',
      kickoff: '2026-06-11T23:00:00Z',
      team1: 'Brazil',
      team2: 'Germany',
    });
    const out = sortToday([earlyOther, lateMine], { support: ['Brazil'], follow: [] });
    expect(out.map((m) => m.id)).toEqual(['b', 'a']);
  });

  it('multiple my-team matches sort by kickoff among themselves', () => {
    const mine1 = mk({ id: 'm1', kickoff: '2026-06-11T15:00:00Z', team1: 'Brazil', team2: 'X' });
    const mine2 = mk({ id: 'm2', kickoff: '2026-06-11T12:00:00Z', team1: 'France', team2: 'Y' });
    const other = mk({ id: 'o', kickoff: '2026-06-11T09:00:00Z', team1: 'A', team2: 'B' });
    const out = sortToday([mine1, mine2, other], { support: ['Brazil', 'France'], follow: [] });
    expect(out.map((m) => m.id)).toEqual(['m2', 'm1', 'o']);
  });
});
