import { describe, expect, it } from 'vitest';
import type { Match } from '@/data/sources/types';
import realFile from '@/data/sources/__fixtures__/worldcup.json';
import wc2022 from '@/data/sources/__fixtures__/worldcup-2022.json';
import { transformAll } from '@/data/sources/openFootball';
import {
  champion,
  KNOCKOUT_GRACE_MS,
  leaguePool,
  nextLock,
  openKnockoutStages,
  PRE_TOURNAMENT_LOCK_UTC,
  ROUND,
  realTeamsInRound,
  roundParticipantsKnown,
  stageDeadlineUTC,
  stageMatchups,
  stageOpen,
  stagePool,
  stageStatus,
  teamStillAlive,
} from './leagueStages';

const before = new Date('2026-05-01T00:00:00Z');
const matches2026 = transformAll(realFile as never, before);

// The 2022 fixture stores times without a UTC offset (e.g. "19:00"); all
// matches were in Qatar (UTC+3). Append it so the strict parser accepts them.
// (The DemoAdapter does the same at runtime.)
const file2022 = wc2022 as { matches: { time: string }[] };
const normalized2022 = {
  ...file2022,
  matches: file2022.matches.map((m) => ({
    ...m,
    time: /UTC[+-]/i.test(m.time) ? m.time : `${m.time} UTC+3`,
  })),
};
// 2022 file is fully played → all knockout rounds carry real team names.
const matches2022 = transformAll(normalized2022 as never, new Date('2023-01-01T00:00:00Z'));

describe('leaguePool', () => {
  it('is exactly the 48 group-stage teams (not the 54 in teams.json)', () => {
    expect(leaguePool(matches2026)).toHaveLength(48);
  });
});

describe('roundParticipantsKnown', () => {
  it('is false for 2026 knockout rounds (placeholders like 1A / W73)', () => {
    expect(roundParticipantsKnown(matches2026, ROUND.R32)).toBe(false);
    expect(roundParticipantsKnown(matches2026, ROUND.FINAL)).toBe(false);
  });

  it('is true for 2022 knockout rounds (real teams filled in)', () => {
    expect(roundParticipantsKnown(matches2022, ROUND.R16)).toBe(true);
    expect(roundParticipantsKnown(matches2022, ROUND.FINAL)).toBe(true);
  });
});

describe('stageOpen', () => {
  it('pre-tournament reachR32 is always open', () => {
    expect(stageOpen('reachR32', matches2026)).toBe(true);
  });

  it('sequential stages are closed for 2026 (placeholders)', () => {
    expect(stageOpen('reachR16', matches2026)).toBe(false);
    expect(stageOpen('reachFinal', matches2026)).toBe(false);
  });

  it('opens reachQF on 2022 data (its pool round "Round of 16" matches both formats)', () => {
    // 2022 was a 32-team format → first KO is "Round of 16", so reachR16
    // (pool = "Round of 32") legitimately stays closed.
    expect(stageOpen('reachR16', matches2022)).toBe(false);
    expect(stageOpen('reachQF', matches2022)).toBe(true);
  });
});

describe('stagePool', () => {
  it('reachR32 pool is the 48 teams', () => {
    expect(stagePool('reachR32', matches2026)).toHaveLength(48);
  });
  it('reachR16 pool is empty until R32 participants are known', () => {
    expect(stagePool('reachR16', matches2026)).toEqual([]);
  });
  it('reachR16 pool for 2022 is the 32 Round-of-32 teams', () => {
    // 2022 had no Round of 32 (32-team format → Round of 16 is first KO).
    // reachR16 reads its pool from "Round of 32"; 2022 has none, so empty.
    expect(stagePool('reachR16', matches2022)).toEqual([]);
    // reachQF reads from "Round of 16" → 16 teams in 2022.
    expect(stagePool('reachQF', matches2022)).toHaveLength(16);
  });
});

describe('stageDeadlineUTC (legacy block)', () => {
  it('pre-tournament deadline is the fixed June 14 grace deadline', () => {
    expect(stageDeadlineUTC('reachR32', matches2026)).toBe(PRE_TOURNAMENT_LOCK_UTC);
  });
});

describe('champion', () => {
  it('resolves the 2022 winner (Argentina, on penalties)', () => {
    expect(champion(matches2022)).toBe('Argentina');
  });
  it('is null for an unplayed 2026 final', () => {
    expect(champion(matches2026)).toBeNull();
  });
});

describe('realTeamsInRound', () => {
  it('returns 2 real finalists for 2022', () => {
    const finalists = realTeamsInRound(matches2022, ROUND.FINAL);
    expect(finalists.sort()).toEqual(['Argentina', 'France']);
  });
});

describe('stageStatus', () => {
  it('pre-tournament reachR32 is editable through the June 14 grace deadline', () => {
    expect(stageStatus('reachR32', matches2026, before)).toBe('editable');
    expect(stageStatus('reachR32', matches2026, new Date('2026-06-13T12:00:00Z'))).toBe('editable');
  });
  it('reachR32 is locked after the June 14 deadline', () => {
    expect(stageStatus('reachR32', matches2026, new Date('2026-06-15T00:00:00Z'))).toBe('locked');
  });
  it('sequential 2026 stages are pending (placeholders unresolved)', () => {
    expect(stageStatus('reachR16', matches2026, before)).toBe('pending');
  });
});

describe('stageMatchups', () => {
  it('returns the 8 Round-of-16 ties for 2022 (reachQF pool), sorted by kickoff', () => {
    const ties = stageMatchups('reachQF', matches2022);
    expect(ties).toHaveLength(8);
    expect(ties.every((t) => t.team1 && t.team2 && t.kickoffUTC)).toBe(true);
    const kicks = ties.map((t) => t.kickoffUTC);
    expect([...kicks].sort()).toEqual(kicks); // already ascending
  });
  it('is empty for 2026 (all knockout fixtures still placeholders)', () => {
    expect(stageMatchups('reachR16', matches2026)).toEqual([]);
  });
  it('is empty for pre-tournament reachR32 (no bracket ties)', () => {
    expect(stageMatchups('reachR32', matches2022)).toEqual([]);
  });
  it('excludes half-formed ties (one side still a placeholder)', () => {
    const half = [
      { id: 'a', round: ROUND.R32, kickoffUTC: '2026-06-28T19:00:00.000Z', ground: 'X', team1: 'Brazil', team2: 'Japan', status: 'scheduled' as const },
      { id: 'b', round: ROUND.R32, kickoffUTC: '2026-06-29T19:00:00.000Z', ground: 'X', team1: 'France', team2: '2B', status: 'scheduled' as const },
    ];
    expect(stageMatchups('reachR16', half)).toEqual([
      { team1: 'Brazil', team2: 'Japan', kickoffUTC: '2026-06-28T19:00:00.000Z' },
    ]);
  });
});

describe('progressive opening + 1-day grace (synthetic R32 → reachR16)', () => {
  // One Round-of-32 tie resolved (Brazil v Japan), one still placeholders.
  const ko = (kickoffUTC: string, team1: string, team2: string): Match => ({
    id: `${team1}-${team2}`,
    round: ROUND.R32,
    kickoffUTC,
    ground: 'X',
    team1,
    team2,
    status: 'scheduled',
  });
  const partial: Match[] = [
    ko('2026-06-28T19:00:00.000Z', 'Brazil', 'Japan'), // determined
    ko('2026-07-01T16:00:00.000Z', '1A', '2B'), // still placeholders
  ];
  const firstKO = '2026-06-28T19:00:00.000Z';
  const deadline = new Date(new Date(firstKO).getTime() + KNOCKOUT_GRACE_MS).toISOString();

  it('opens reachR16 as soon as one matchup is determined', () => {
    expect(stageOpen('reachR16', partial)).toBe(true);
  });
  it('pool contains only the resolved teams so far', () => {
    expect(stagePool('reachR16', partial)).toEqual(['Brazil', 'Japan']);
  });
  it('deadline is the first pool-round kickoff + 24h grace', () => {
    expect(stageDeadlineUTC('reachR16', partial)).toBe(deadline);
  });
  it('stays editable during the grace (after first KO, before deadline)', () => {
    // Old rule would have locked at 2026-06-28T19:00; the grace keeps it open.
    expect(stageStatus('reachR16', partial, new Date('2026-06-29T06:00:00Z'))).toBe('editable');
  });
  it('locks once the grace deadline passes', () => {
    expect(stageStatus('reachR16', partial, new Date('2026-06-29T20:00:00Z'))).toBe('locked');
  });
  it('openKnockoutStages lists the open stage and excludes locked/pending ones', () => {
    expect(openKnockoutStages(partial, new Date('2026-06-29T06:00:00Z'))).toEqual(['reachR16']);
    expect(openKnockoutStages(partial, new Date('2026-06-29T20:00:00Z'))).toEqual([]);
  });
});

describe('nextLock', () => {
  it('before the tournament, the next lock is the pre-tournament (reachR32) deadline', () => {
    const nl = nextLock(matches2026, before);
    expect(nl?.stage).toBe('reachR32');
    expect(nl?.deadlineUTC).toBe(PRE_TOURNAMENT_LOCK_UTC);
  });
  it('returns null once everything is locked', () => {
    expect(nextLock(matches2026, new Date('2026-08-01T00:00:00Z'))).toBeNull();
  });
});

describe('teamStillAlive', () => {
  it('the 2022 champion (Argentina) is alive; the beaten finalist (France) is out', () => {
    expect(teamStillAlive('Argentina', matches2022)).toBe(true);
    expect(teamStillAlive('France', matches2022)).toBe(false);
  });
  it('a team eliminated earlier is out', () => {
    // Brazil reached the 2022 quarter-finals but not the semis.
    expect(teamStillAlive('Brazil', matches2022)).toBe(false);
  });
  it('every team is alive before any knockout is resolved (2026)', () => {
    expect(teamStillAlive('Brazil', matches2026)).toBe(true);
  });
});
