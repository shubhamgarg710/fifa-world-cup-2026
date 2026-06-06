import { describe, expect, it } from 'vitest';
import type { Match } from '@/data/sources/types';
import {
  detectLateDrama,
  detectUpset,
  isKnockout,
  postmatchVerdict,
  prematchWatchability,
  type MyTeams,
} from './verdict';

const NONE: MyTeams = { support: [], follow: [] };

// Rank table tuned for the test cases below.
const RANKS: Record<string, number> = {
  Argentina: 1,
  France: 2,
  Spain: 3,
  Brazil: 5,
  Croatia: 9,
  Germany: 11,
  Colombia: 12,
  USA: 15,
  Mexico: 16,
  Iran: 19,
  Australia: 25,
  'Czech Republic': 36,
  'South Africa': 51,
  Ghana: 52,
  Qatar: 58,
};
const rank = (t: string) => RANKS[t];

function match(over: Partial<Match>): Match {
  return {
    id: 'test',
    round: 'Matchday 1',
    group: 'Group A',
    kickoffUTC: '2026-06-11T19:00:00.000Z',
    ground: 'Mexico City',
    team1: 'Brazil',
    team2: 'Germany',
    status: 'finished',
    ...over,
  };
}

describe('isKnockout — covers all real round labels', () => {
  it.each([
    ['Round of 32', true],
    ['Round of 16', true],
    ['Quarter-final', true],
    ['Semi-final', true],
    ['Match for third place', true],
    ['Final', true],
    ['Matchday 1', false],
    ['Matchday 14', false],
  ])('%s -> %s', (round, expected) => {
    expect(isKnockout(round)).toBe(expected);
  });
});

describe('prematchWatchability', () => {
  it('my-team match is always must-watch', () => {
    const res = prematchWatchability(
      match({ team1: 'Brazil', team2: 'South Africa' }),
      { support: ['Brazil'], follow: [] },
      rank,
    );
    expect(res.tier).toBe('must-watch');
    expect(res.reasons).toContain('your team');
  });

  it('both top-12 is high tier', () => {
    const res = prematchWatchability(match({ team1: 'Brazil', team2: 'France' }), NONE, rank);
    expect(res.tier).toBe('high');
    expect(res.reasons).toContain('top-nation clash');
  });

  it('knockout is high tier', () => {
    const res = prematchWatchability(
      match({ team1: 'Mexico', team2: 'Australia', round: 'Round of 16' }),
      NONE,
      rank,
    );
    expect(res.tier).toBe('high');
    expect(res.reasons).toContain('knockout');
  });

  it('final group matchday is high tier', () => {
    const res = prematchWatchability(
      match({ team1: 'Mexico', team2: 'Czech Republic', finalGroupMatchday: true }),
      NONE,
      rank,
    );
    expect(res.tier).toBe('high');
    expect(res.reasons).toContain('final group match');
  });

  it('boring matchup is normal tier', () => {
    const res = prematchWatchability(
      match({ team1: 'Qatar', team2: 'South Africa' }),
      NONE,
      rank,
    );
    expect(res.tier).toBe('normal');
  });
});

describe('postmatchVerdict — my team', () => {
  const mine: MyTeams = { support: ['Brazil'], follow: [] };

  it('my-team triumph is must-watch with "your team"', () => {
    const v = postmatchVerdict(
      match({ team1: 'Brazil', team2: 'South Africa', score: { ft: [3, 0] } }),
      mine,
      rank,
    );
    expect(v.label).toBe('must-watch');
    expect(v.headline).toBe('your team');
  });

  it('my-team loss is still must-watch (you want the highlights anyway)', () => {
    const v = postmatchVerdict(
      match({ team1: 'Brazil', team2: 'Germany', score: { ft: [0, 3] } }),
      mine,
      rank,
    );
    expect(v.label).toBe('must-watch');
    expect(v.reasons.strong).toContain('your team');
  });
});

describe('detectUpset', () => {
  it('rank-50 beats rank-3 is a strong upset (gap 48)', () => {
    const u = detectUpset(
      match({ team1: 'South Africa', team2: 'Spain', score: { ft: [1, 0] } }),
      rank,
    );
    expect(u.tier).toBe('strong');
    expect(u.reason).toBe('big upset');
  });

  it('rank-25 beats rank-12 in group stage is a mild upset (gap 13)', () => {
    const u = detectUpset(
      match({
        team1: 'Australia',
        team2: 'Colombia',
        round: 'Matchday 8',
        score: { ft: [1, 0] },
      }),
      rank,
    );
    expect(u.tier).toBe('mild');
    expect(u.reason).toBe('upset');
  });

  it('same gap in a knockout match is promoted to strong', () => {
    const u = detectUpset(
      match({
        team1: 'Australia',
        team2: 'Colombia',
        round: 'Quarter-final',
        score: { ft: [1, 0] },
      }),
      rank,
    );
    expect(u.tier).toBe('strong');
    expect(u.reason).toBe('knockout upset');
  });

  it('rank gap below threshold is not an upset', () => {
    // Croatia (9) beats Germany (11): gap = -2, no upset
    const u = detectUpset(
      match({ team1: 'Croatia', team2: 'Germany', score: { ft: [2, 1] } }),
      rank,
    );
    expect(u.tier).toBe(null);
  });
});

describe('postmatchVerdict — goal fest', () => {
  it('4-3 thriller', () => {
    const v = postmatchVerdict(
      match({ team1: 'Brazil', team2: 'Germany', score: { ft: [4, 3] } }),
      NONE,
      rank,
    );
    expect(v.label).toBe('must-watch');
    expect(v.reasons.strong).toContain('7-goal thriller');
  });

  it('3-3 still counts (6 >= 4)', () => {
    const v = postmatchVerdict(
      match({ team1: 'Brazil', team2: 'Germany', score: { ft: [3, 3] } }),
      NONE,
      rank,
    );
    expect(v.reasons.strong).toContain('6-goal thriller');
  });
});

describe('detectLateDrama — own-goal attribution', () => {
  it("90+5' winner via own-goal is attributed to the benefiting team and flagged late", () => {
    // Score becomes 1-0 because Germany scored an own-goal at 90+5'
    const m = match({
      team1: 'Brazil',
      team2: 'Germany',
      score: { ft: [1, 0] },
      goals1: [],
      goals2: [
        // Listed in goals2 (Germany's list) but tagged owngoal → counts for Brazil (team1).
        { name: 'Kimmich', minute: 90, offset: 5, owngoal: true },
      ],
    });
    const d = detectLateDrama(m);
    expect(d.triggered).toBe(true);
    expect(d.reason).toBe('late winner');
  });

  it("90+2' equaliser flagged late equalizer", () => {
    const m = match({
      team1: 'Brazil',
      team2: 'Germany',
      score: { ft: [1, 1] },
      goals1: [{ name: 'Vinicius', minute: 30 }],
      goals2: [{ name: 'Wirtz', minute: 90, offset: 2 }],
    });
    const d = detectLateDrama(m);
    expect(d.triggered).toBe(true);
    expect(d.reason).toBe('late equalizer');
  });

  it("not flagged when the late goal didn't change leader/equaliser", () => {
    // 3-0 game, last goal at 88' just extends the lead
    const m = match({
      team1: 'Brazil',
      team2: 'Germany',
      score: { ft: [3, 0] },
      goals1: [
        { name: 'A', minute: 10 },
        { name: 'B', minute: 40 },
        { name: 'C', minute: 88 },
      ],
      goals2: [],
    });
    expect(detectLateDrama(m).triggered).toBe(false);
  });
});

describe('postmatchVerdict — knockout tension', () => {
  it('went to penalties is must-watch', () => {
    const v = postmatchVerdict(
      match({
        team1: 'Brazil',
        team2: 'Germany',
        round: 'Quarter-final',
        score: { ft: [1, 1], et: [1, 1], p: [4, 5] },
      }),
      NONE,
      rank,
    );
    expect(v.label).toBe('must-watch');
    expect(v.reasons.strong).toContain('went to penalties');
  });

  it('decided in extra time is must-watch', () => {
    const v = postmatchVerdict(
      match({
        team1: 'Brazil',
        team2: 'Germany',
        round: 'Semi-final',
        score: { ft: [1, 1], et: [2, 1] },
      }),
      NONE,
      rank,
    );
    expect(v.label).toBe('must-watch');
    expect(v.reasons.strong).toContain('extra time');
  });
});

describe('postmatchVerdict — labelling edge cases', () => {
  it('Brazil 0-0 France in group stage is Worth a look (top-nation clash, mild)', () => {
    const v = postmatchVerdict(
      match({ team1: 'Brazil', team2: 'France', score: { ft: [0, 0] } }),
      NONE,
      rank,
    );
    expect(v.label).toBe('worth-a-look');
    expect(v.reasons.mild).toContain('top-nation clash');
    expect(v.reasons.strong).toEqual([]);
  });

  it('R16 0-0 between mid-ranked sides is Worth a look (knockout mild)', () => {
    const v = postmatchVerdict(
      match({
        team1: 'Australia',
        team2: 'Iran',
        round: 'Round of 16',
        score: { ft: [0, 0], et: undefined },
      }),
      NONE,
      rank,
    );
    expect(v.label).toBe('worth-a-look');
    expect(v.reasons.mild).toContain('knockout');
  });

  it('low-stakes 1-0 between rank-30ish sides in group stage is Skip', () => {
    const v = postmatchVerdict(
      match({
        team1: 'Czech Republic',
        team2: 'South Africa',
        score: { ft: [1, 0] },
      }),
      NONE,
      rank,
    );
    expect(v.label).toBe('skip');
    expect(v.reasons.strong).toEqual([]);
    expect(v.reasons.mild).toEqual([]);
  });

  it('headline is first strong, else first mild, else null', () => {
    // A multi-trigger match: my-team + goal fest. Headline should be "your team".
    const v = postmatchVerdict(
      match({ team1: 'Brazil', team2: 'Germany', score: { ft: [4, 3] } }),
      { support: ['Brazil'], follow: [] },
      rank,
    );
    expect(v.headline).toBe('your team');
  });
});
