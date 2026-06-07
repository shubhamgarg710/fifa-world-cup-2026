import { describe, expect, it } from 'vitest';
import realFile from './__fixtures__/worldcup.json';
import { OpenFootballAdapter, transformAll, transformMatch } from './openFootball';
import { matchId } from './types';

const wellBeforeTournament = new Date('2026-05-01T00:00:00Z');
const midTournament = new Date('2026-06-25T00:00:00Z');
const afterTournament = new Date('2026-08-01T00:00:00Z');

describe('transformMatch — status derivation', () => {
  const empty = {} as Record<string, number>;
  const baseRaw = {
    round: 'Matchday 1',
    date: '2026-06-11',
    time: '13:00 UTC-6',
    team1: 'Mexico',
    team2: 'South Africa',
    group: 'Group A',
    ground: 'Mexico City',
  };

  it("finished when `score` is present (regardless of clock)", () => {
    const m = transformMatch(
      { ...baseRaw, score: { ft: [2, 1], ht: [1, 0] } },
      empty,
      afterTournament,
    );
    expect(m.status).toBe('finished');
  });

  it('scheduled when no score and kickoff is in the future', () => {
    const m = transformMatch(baseRaw, empty, wellBeforeTournament);
    expect(m.status).toBe('scheduled');
  });

  it('result_pending when no score and kickoff is in the past', () => {
    const m = transformMatch(baseRaw, empty, afterTournament);
    expect(m.status).toBe('result_pending');
  });
});

describe('transformMatch — deterministic id and kickoff', () => {
  it('opener id and UTC kickoff', () => {
    const m = transformMatch(
      {
        round: 'Matchday 1',
        date: '2026-06-11',
        time: '13:00 UTC-6',
        team1: 'Mexico',
        team2: 'South Africa',
        group: 'Group A',
        ground: 'Mexico City',
      },
      {},
      wellBeforeTournament,
    );
    expect(m.id).toBe('2026-06-11__mexico__south-africa');
    expect(m.kickoffUTC).toBe('2026-06-11T19:00:00.000Z');
  });

  it('handles non-ASCII team names (Curaçao)', () => {
    const m = transformMatch(
      {
        round: 'Matchday 5',
        date: '2026-06-15',
        time: '15:00 UTC-4',
        team1: 'Curaçao',
        team2: 'Haiti',
        group: 'Group D',
        ground: 'Boston (Foxborough)',
      },
      {},
      wellBeforeTournament,
    );
    expect(m.id.startsWith('2026-06-15__cura')).toBe(true);
    expect(m.id.endsWith('__haiti')).toBe(true);
  });
});

describe('transformAll — finalGroupMatchday detection', () => {
  // Real openfootball file shows Group A plays on matchdays 1, 8, 14.
  // 14 is the final matchday for that group; 1 and 8 are not.
  const all = transformAll(realFile as never, wellBeforeTournament);

  it('flags the final group match for Group A (matchday 14)', () => {
    const groupA = all.filter((m) => m.group === 'Group A');
    const finalRound = groupA.filter((m) => m.finalGroupMatchday);
    expect(finalRound.length).toBe(2);
    for (const m of finalRound) {
      expect(m.round.toLowerCase()).toMatch(/matchday 14/);
    }
  });

  it('does NOT flag early matchday games', () => {
    const groupA = all.filter((m) => m.group === 'Group A' && /matchday 1$/i.test(m.round));
    expect(groupA.length).toBeGreaterThan(0);
    for (const m of groupA) expect(m.finalGroupMatchday).toBe(false);
  });

  it('does not flag knockout matches (no group)', () => {
    const knockouts = all.filter((m) => !m.group);
    expect(knockouts.length).toBeGreaterThan(0);
    for (const m of knockouts) expect(m.finalGroupMatchday).toBe(false);
  });
});

describe('transformAll — coverage of the real file', () => {
  const all = transformAll(realFile as never, wellBeforeTournament);

  it('has exactly 104 matches', () => {
    expect(all.length).toBe(104);
  });

  it('every match has a parseable kickoffUTC', () => {
    for (const m of all) {
      expect(m.kickoffUTC).toMatch(/^2026-0[6-7]-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/);
    }
  });

  it('every match has a unique id', () => {
    const ids = new Set(all.map((m) => m.id));
    expect(ids.size).toBe(all.length);
  });

  it('midway through the tournament: some finished-or-pending and some scheduled', () => {
    const mid = transformAll(realFile as never, midTournament);
    const past = mid.filter((m) => m.status !== 'scheduled');
    const future = mid.filter((m) => m.status === 'scheduled');
    expect(past.length).toBeGreaterThan(0);
    expect(future.length).toBeGreaterThan(0);
  });
});

describe('OpenFootballAdapter — range filtering and lookup', () => {
  function build() {
    return new OpenFootballAdapter(
      'unused',
      async () => realFile as never,
      () => wellBeforeTournament,
    );
  }

  it('listAll returns all 104 matches', async () => {
    const all = await build().listAll();
    expect(all.length).toBe(104);
  });

  it('listMatches filters to a date range', async () => {
    const opening = await build().listMatches({
      fromUTC: '2026-06-11T00:00:00Z',
      toUTC: '2026-06-11T23:59:59Z',
    });
    expect(opening.length).toBeGreaterThan(0);
    for (const m of opening) expect(m.kickoffUTC.startsWith('2026-06-11')).toBe(true);
  });

  it('getMatch resolves a known id', async () => {
    const adapter = build();
    const id = matchId('2026-06-11', 'Mexico', 'South Africa');
    const m = await adapter.getMatch(id);
    expect(m.team1).toBe('Mexico');
    expect(m.team2).toBe('South Africa');
  });

  it('getMatch throws on unknown id', async () => {
    await expect(build().getMatch('nope')).rejects.toThrow();
  });
});

describe('OpenFootballAdapter — offline fallback', () => {
  it('falls back to the bundled snapshot when the fetcher throws', async () => {
    const failing = async () => {
      throw new Error('network down');
    };
    const a = new OpenFootballAdapter('unused', failing, () => wellBeforeTournament);
    const all = await a.listAll();
    expect(all.length).toBe(104);
    expect(a.isOfflineFallback()).toBe(true);
  });

  it('reports isOfflineFallback() === false on a successful load', async () => {
    const ok = async () => realFile as never;
    const a = new OpenFootballAdapter('unused', ok, () => wellBeforeTournament);
    await a.listAll();
    expect(a.isOfflineFallback()).toBe(false);
  });
});
