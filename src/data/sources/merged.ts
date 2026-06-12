import type { DateRange, Match, MatchDataSource, Score } from './types';
import type { OpenFootballAdapter } from './openFootball';
import type { EspnAdapter, MatchOverlay } from './espn';
import { fixtureKey, teamKey } from './teamAliases';

/**
 * openfootball is the fixtures backbone (all 104 matches); ESPN overlays
 * fresher status/score/goals where it has them. ESPN failure is silent —
 * we fall back to openfootball-only. No scoring/UI changes: the merged
 * `Match[]` flows through the existing pipeline.
 */
export class MergedDataSource implements MatchDataSource {
  private cache: Match[] | null = null;
  constructor(
    private readonly fixtures: OpenFootballAdapter,
    private readonly espn: EspnAdapter,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private async loadAll(): Promise<Match[]> {
    if (this.cache) return this.cache;
    const base = await this.fixtures.listAll();
    let overlay = new Map<string, MatchOverlay>();
    try {
      overlay = await this.espn.fetchOverlay();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('ESPN overlay failed, using openfootball only:', err);
    }
    const now = this.clock();
    this.cache = base.map((m) => mergeMatch(m, overlay, now));
    return this.cache;
  }

  invalidate(): void {
    this.cache = null;
    this.fixtures.invalidate();
  }

  /** ESPN status is independent of openfootball's offline fallback. */
  isOfflineFallback(): boolean {
    return this.fixtures.isOfflineFallback();
  }

  async listAll(): Promise<Match[]> {
    return this.loadAll();
  }

  async listMatches(range: DateRange): Promise<Match[]> {
    const all = await this.loadAll();
    const from = new Date(range.fromUTC).getTime();
    const to = new Date(range.toUTC).getTime();
    return all.filter((m) => {
      const t = new Date(m.kickoffUTC).getTime();
      return t >= from && t <= to;
    });
  }

  async getMatch(id: string): Promise<Match> {
    const all = await this.loadAll();
    const found = all.find((m) => m.id === id);
    if (!found) throw new Error(`Match not found: ${id}`);
    return found;
  }
}

/** Apply an ESPN overlay to one openfootball fixture, never regressing. */
export function mergeMatch(fixture: Match, overlay: Map<string, MatchOverlay>, now: Date): Match {
  const o = overlay.get(fixtureKey(fixture.kickoffUTC.slice(0, 10), fixture.team1, fixture.team2));
  if (!o) return fixture; // no ESPN data → openfootball as-is

  if (o.status === 'finished') {
    const k1 = teamKey(fixture.team1);
    const k2 = teamKey(fixture.team2);
    // ESPN's full-time score + goals; preserve openfootball's ht/et/p (e.g.
    // knockout extra-time / penalties, which the scoreboard doesn't expose).
    const score: Score = {
      ft: [o.scoreByTeamKey[k1] ?? 0, o.scoreByTeamKey[k2] ?? 0],
      ...(fixture.score?.ht ? { ht: fixture.score.ht } : {}),
      ...(fixture.score?.et ? { et: fixture.score.et } : {}),
      ...(fixture.score?.p ? { p: fixture.score.p } : {}),
    };
    return {
      ...fixture,
      status: 'finished',
      score,
      goals1: o.goalsByTeamKey[k1] ?? [],
      goals2: o.goalsByTeamKey[k2] ?? [],
    };
  }

  // ESPN not finished — never downgrade an openfootball-final result.
  if (fixture.status === 'finished') return fixture;

  // Neither source has a final: preserve "result pending" once kicked off.
  const kickedOff = new Date(fixture.kickoffUTC).getTime() <= now.getTime();
  if (o.status === 'result_pending' || kickedOff) {
    return { ...fixture, status: 'result_pending' };
  }
  return fixture;
}
