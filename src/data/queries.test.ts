import { describe, expect, it } from 'vitest';
import type { Match } from './sources/types';
import { RECENT_WINDOW_HOURS, splitMatchesForToday } from './queries';

function mk(id: string, kickoffUTC: string): Match {
  return {
    id,
    round: 'Matchday 1',
    kickoffUTC,
    ground: 'X',
    team1: 'A',
    team2: 'B',
    status: 'finished',
  };
}

describe('splitMatchesForToday Recent window', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  const todayKey = '2026-06-15';
  const toDayKey = (iso: string) => iso.slice(0, 10);

  it('uses a 72h cutoff', () => {
    expect(RECENT_WINDOW_HOURS).toBe(72);
  });

  it('includes a match 60h in the past', () => {
    const m60 = mk('m60', new Date(now.getTime() - 60 * 3600_000).toISOString());
    const out = splitMatchesForToday([m60], todayKey, toDayKey, now);
    expect(out.recent.map((m) => m.id)).toEqual(['m60']);
  });

  it('excludes a match 80h in the past', () => {
    const m80 = mk('m80', new Date(now.getTime() - 80 * 3600_000).toISOString());
    const out = splitMatchesForToday([m80], todayKey, toDayKey, now);
    expect(out.recent).toEqual([]);
  });

  it('places matches happening today into the today bucket regardless of how long ago', () => {
    // 9 hours ago, still today in UTC for the fake `now`
    const earlyToday = mk('et', '2026-06-15T03:00:00Z');
    const out = splitMatchesForToday([earlyToday], todayKey, toDayKey, now);
    expect(out.today.map((m) => m.id)).toEqual(['et']);
    expect(out.recent).toEqual([]);
  });
});
