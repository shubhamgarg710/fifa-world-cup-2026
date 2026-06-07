import { describe, expect, it } from 'vitest';
import type { Match } from './sources/types';
import { RECENT_WINDOW_HOURS, selectBoard, splitMatchesForToday } from './queries';

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

  it('sorts future ascending so future[0] is the soonest', () => {
    const later = mk('later', '2026-06-20T18:00:00Z');
    const sooner = mk('sooner', '2026-06-16T18:00:00Z');
    const out = splitMatchesForToday([later, sooner], todayKey, toDayKey, now);
    expect(out.future.map((m) => m.id)).toEqual(['sooner', 'later']);
  });
});

describe('selectBoard', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  const todayKey = '2026-06-15';
  const toDayKey = (iso: string) => iso.slice(0, 10);

  it('returns today when today has fixtures', () => {
    const t = mk('t', '2026-06-15T18:00:00Z');
    const board = selectBoard([t], todayKey, toDayKey, now);
    expect(board.isToday).toBe(true);
    expect(board.matches.map((m) => m.id)).toEqual(['t']);
  });

  it('falls back to the next match day when today is empty', () => {
    // Two matches on 2026-06-18, one on 2026-06-20 → next day is the 18th, both of its games.
    const a = mk('a', '2026-06-18T15:00:00Z');
    const b = mk('b', '2026-06-18T19:00:00Z');
    const c = mk('c', '2026-06-20T19:00:00Z');
    const board = selectBoard([c, b, a], todayKey, toDayKey, now);
    expect(board.isToday).toBe(false);
    expect(board.matches.map((m) => m.id)).toEqual(['a', 'b']);
    expect(board.labelDateISO).toBe('2026-06-18T15:00:00Z');
  });

  it('returns empty with a null label when nothing is upcoming', () => {
    const past = mk('p', '2026-06-01T19:00:00Z');
    const board = selectBoard([past], todayKey, toDayKey, now);
    expect(board.matches).toEqual([]);
    expect(board.labelDateISO).toBeNull();
  });
});
