import { isKnockout } from '@/logic/verdict';
import { isPlaceholderTeam } from '@/data/static/placeholders';
import type { DateRange, Match, MatchDataSource, Score } from './types';
import { matchId } from './types';
import type { OpenFootballAdapter } from './openFootball';
import type { BracketTie, EspnAdapter, MatchOverlay } from './espn';
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
    let results = new Map<string, MatchOverlay>();
    let bracket = new Map<string, BracketTie>();
    try {
      ({ results, bracket } = await this.espn.fetchOverlay());
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('ESPN overlay failed, using openfootball only:', err);
    }
    const now = this.clock();
    // First fill placeholder knockout ties from ESPN, then overlay results (the
    // results lookup matches by team name, so it needs resolved teams first).
    this.cache = base.map((m) => mergeMatch(resolveBracket(m, bracket), results, now));
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

/**
 * Fill an openfootball knockout fixture's placeholder team(s) from ESPN's
 * resolved bracket (matched by UTC kickoff minute), so a tie shows as soon as
 * ESPN decides it instead of waiting for openfootball. Only fills placeholders —
 * never overrides a team openfootball already resolved.
 */
export function resolveBracket(fixture: Match, bracket: Map<string, BracketTie>): Match {
  if (!isKnockout(fixture.round)) return fixture;
  const ph1 = isPlaceholderTeam(fixture.team1);
  const ph2 = isPlaceholderTeam(fixture.team2);
  if (!ph1 && !ph2) return fixture; // already resolved
  const tie = bracket.get(fixture.kickoffUTC.slice(0, 16));
  if (!tie) return fixture; // ESPN hasn't resolved this slot (or no time match)

  let team1 = fixture.team1;
  let team2 = fixture.team2;
  if (ph1 && ph2) {
    team1 = tie.home;
    team2 = tie.away;
  } else {
    const known = ph1 ? fixture.team2 : fixture.team1;
    const kk = teamKey(known);
    if (!(teamKey(tie.home) === kk || teamKey(tie.away) === kk)) return fixture; // not this tie
    const other = teamKey(tie.home) === kk ? tie.away : tie.home;
    if (ph1) team1 = other;
    else team2 = other;
  }
  const date = fixture.kickoffUTC.slice(0, 10);
  return { ...fixture, team1, team2, id: matchId(date, team1, team2) };
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
