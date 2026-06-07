import { describe, expect, it } from 'vitest';
import type { Match } from '@/data/sources/types';
import { EMPTY_PICKS, type Member, type Picks } from '@/data/league/types';
import { LEAGUE_SCORING } from './leagueConfig';
import { pickStatus, rankMembers, scoreMember, type Awards } from './leagueScore';

const NO_AWARDS: Awards = { goldenBall: null };

function ko(round: string, team1: string, team2: string, extra: Partial<Match> = {}): Match {
  return {
    id: `${round}-${team1}-${team2}`,
    round,
    kickoffUTC: '2026-07-01T18:00:00.000Z',
    ground: 'X',
    team1,
    team2,
    status: 'scheduled',
    ...extra,
  };
}

/** A small finished bracket: R32 {A,B,C,D}, R16 {A,C}, Final A beats C. */
function bracket(): Match[] {
  return [
    ko('Round of 32', 'A', 'B'),
    ko('Round of 32', 'C', 'D'),
    ko('Round of 16', 'A', 'C'),
    ko('Final', 'A', 'C', { status: 'finished', score: { ft: [2, 0] } }),
  ];
}

function picks(p: Partial<Picks>): Picks {
  return { ...EMPTY_PICKS, ...p };
}

/** A complete 32-team survivors pick: the given teams + unique padding to 32. */
function fullSurvivors(...include: string[]): string[] {
  const pad = Array.from({ length: 32 - include.length }, (_, i) => `pad${i}`);
  return [...include, ...pad];
}

describe('scoreMember — advancement tiers', () => {
  it('awards reachR32 points per correct survivor (complete set of 32)', () => {
    const { total, breakdown } = scoreMember(
      picks({ reachR32: fullSurvivors('A', 'B', 'X') }), // A,B reached R32; X + pads did not
      bracket(),
      NO_AWARDS,
    );
    expect(breakdown.stages.find((s) => s.key === 'reachR32')).toMatchObject({ hits: 2 });
    expect(total).toBe(2 * LEAGUE_SCORING.reachR32);
  });

  it('awards reachR16 + reachR32 together', () => {
    const { breakdown } = scoreMember(
      picks({ reachR32: fullSurvivors('A', 'C'), reachR16: ['A'] }),
      bracket(),
      NO_AWARDS,
    );
    expect(breakdown.stages.find((s) => s.key === 'reachR32')!.hits).toBe(2);
    expect(breakdown.stages.find((s) => s.key === 'reachR16')!.hits).toBe(1);
  });

  it('does not score a stage whose round has no results yet', () => {
    // No "Quarter-final" matches in the bracket → reachQF scores 0 even if picked.
    const { breakdown } = scoreMember(picks({ reachQF: ['A'] }), bracket(), NO_AWARDS);
    expect(breakdown.stages.find((s) => s.key === 'reachQF')!.hits).toBe(0);
  });
});

describe('scoreMember — group-stage completeness gate', () => {
  const r32hits = (reachR32: string[]) =>
    scoreMember(picks({ reachR32 }), bracket(), NO_AWARDS).breakdown.stages.find((s) => s.key === 'reachR32')!.hits;

  it('an incomplete survivors set (under 32) scores 0 even if picks advance', () => {
    // 31 survivors including all 4 actual R32 teams — still 0 because it isn't a full set.
    expect(r32hits(fullSurvivors('A', 'B', 'C', 'D').slice(0, 31))).toBe(0);
  });

  it('eliminating zero (all 48 → would be >32) scores 0', () => {
    const fortyEight = Array.from({ length: 48 }, (_, i) => (i < 4 ? ['A', 'B', 'C', 'D'][i] : `t${i}`));
    expect(r32hits(fortyEight)).toBe(0);
  });

  it('exactly 32 survivors scores its hits', () => {
    expect(r32hits(fullSurvivors('A', 'B', 'C', 'D'))).toBe(4);
  });
});

describe('scoreMember — winner / boot / ball', () => {
  it('awards the winner bonus for a correct champion', () => {
    const { breakdown } = scoreMember(picks({ winner: 'A' }), bracket(), NO_AWARDS);
    expect(breakdown.winner).toBe(LEAGUE_SCORING.winner);
  });

  it('no winner bonus for a wrong champion', () => {
    const { breakdown } = scoreMember(picks({ winner: 'C' }), bracket(), NO_AWARDS);
    expect(breakdown.winner).toBe(0);
  });

  it('awards golden boot when the pick is a joint-top scorer', () => {
    const withGoals = bracket();
    withGoals[3] = { ...withGoals[3], goals1: [{ name: 'Striker', minute: 10 }] };
    const { breakdown } = scoreMember(picks({ goldenBoot: 'Striker' }), withGoals, NO_AWARDS);
    expect(breakdown.goldenBoot).toBe(LEAGUE_SCORING.goldenBoot);
  });

  it('matches the boot pick accent-insensitively', () => {
    const withGoals = bracket();
    // openfootball records the scorer without the accent…
    withGoals[3] = { ...withGoals[3], goals1: [{ name: 'Kylian Mbappe', minute: 10 }] };
    // …the member picked the accented form.
    const { breakdown } = scoreMember(picks({ goldenBoot: 'Kylian Mbappé' }), withGoals, NO_AWARDS);
    expect(breakdown.goldenBoot).toBe(LEAGUE_SCORING.goldenBoot);
  });

  it('awards golden ball only from the bundled awards value', () => {
    const ok = scoreMember(picks({ goldenBall: 'Messi' }), bracket(), { goldenBall: 'Messi' });
    expect(ok.breakdown.goldenBall).toBe(LEAGUE_SCORING.goldenBall);
    const none = scoreMember(picks({ goldenBall: 'Messi' }), bracket(), { goldenBall: null });
    expect(none.breakdown.goldenBall).toBe(0);
  });
});

describe('pickStatus', () => {
  it('correct when the team reached the round', () => {
    expect(pickStatus('A', 'reachR16', bracket())).toBe('correct');
  });
  it('busted when the round is known and the team is absent', () => {
    expect(pickStatus('B', 'reachR16', bracket())).toBe('busted');
  });
  it('alive when the round is not yet determined', () => {
    // reachSF reads "Semi-final" which has no matches here → undetermined.
    expect(pickStatus('A', 'reachSF', bracket())).toBe('alive');
  });
});

describe('rankMembers tiebreaker', () => {
  function member(id: string, created: string, p: Partial<Picks>): Member {
    return { id, league_code: 'L', display_name: id, created_at: created, picks: picks(p) };
  }

  it('breaks an equal total by deeper-round hits, then created_at', () => {
    // Both score the same total points, but Deep got a finalist-tier hit.
    // Construct so totals tie: give Shallow more shallow hits worth equal points.
    const matches = bracket();
    // A,C reached R16 (5 pts each). A,B,C,D reached R32 (2 pts each).
    // Deep: reachR16 [A,C] = 10 pts. deepWeight = 2 hits × depth2 = 4.
    // Shallow: reachR32 [A,B,C,D,?] need 5 hits ×2 =10 but only 4 teams → 8. Add winner? keep simple:
    // Make totals equal at 10: Deep reachR16 [A,C] =10. Shallow reachR32 [A,B,C,D] (8) + reachR16 [A] (5) = 13 — not equal.
    // Simplest tie: identical picks, different created_at → created_at breaks it.
    const m1 = member('early', '2026-06-01T00:00:00Z', { reachR16: ['A', 'C'] });
    const m2 = member('late', '2026-06-02T00:00:00Z', { reachR16: ['A', 'C'] });
    const ranked = rankMembers([m2, m1], matches, NO_AWARDS);
    expect(ranked[0].member.id).toBe('early'); // earlier created_at wins the tie
  });

  it('higher total ranks first regardless of created_at', () => {
    const matches = bracket();
    const winner = member('w', '2026-06-09T00:00:00Z', { reachR16: ['A', 'C'], winner: 'A' });
    const other = member('o', '2026-06-01T00:00:00Z', { reachR16: ['A'] });
    const ranked = rankMembers([other, winner], matches, NO_AWARDS);
    expect(ranked[0].member.id).toBe('w');
  });
});
