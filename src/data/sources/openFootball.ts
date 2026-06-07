import { parseKickoff } from '@/logic/time';
import bundledSnapshot from './__fixtures__/worldcup.json';
import {
  DateRange,
  Match,
  MatchDataSource,
  MatchStatus,
  matchId,
  Score,
  GoalEntry,
} from './types';

/** Default URL for the live openfootball file. */
export const OPENFOOTBALL_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

/**
 * Raw match shape as it appears in openfootball/worldcup.json.
 * Confirmed live: `round`, `date`, `time`, `team1`, `team2`, optional `group`,
 * `ground`, and (once played) `score` + `goals1` + `goals2`.
 */
type Raw = {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  score?: Score;
  goals1?: GoalEntry[];
  goals2?: GoalEntry[];
};

type RawFile = { name?: string; matches: Raw[] };

type Fetcher = (url: string) => Promise<RawFile>;

const defaultFetcher: Fetcher = async (url) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`openfootball fetch failed: ${res.status}`);
  return (await res.json()) as RawFile;
};

/** Parse `"Matchday 14"` → 14. Returns null for non-matchday rounds. */
function matchdayNumber(round: string): number | null {
  const m = round.match(/^matchday\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

/** Per-group max matchday. Used to flag the final group game per group. */
function computeFinalMatchdayByGroup(raws: Raw[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const r of raws) {
    if (!r.group) continue;
    const md = matchdayNumber(r.round);
    if (md == null) continue;
    acc[r.group] = Math.max(acc[r.group] ?? 0, md);
  }
  return acc;
}

function deriveStatus(score: Score | undefined, kickoffUTC: string, now: Date): MatchStatus {
  if (score) return 'finished';
  return new Date(kickoffUTC).getTime() > now.getTime() ? 'scheduled' : 'result_pending';
}

/** Pure transform: raw openfootball match -> our Match shape. Exported for testing. */
export function transformMatch(
  raw: Raw,
  finalMatchdayByGroup: Record<string, number>,
  now: Date,
): Match {
  const kickoffUTC = parseKickoff(raw.date, raw.time);
  const status = deriveStatus(raw.score, kickoffUTC, now);
  const md = matchdayNumber(raw.round);
  const finalGroupMatchday =
    !!raw.group && md != null && md === finalMatchdayByGroup[raw.group];
  return {
    id: matchId(raw.date, raw.team1, raw.team2),
    round: raw.round,
    group: raw.group,
    kickoffUTC,
    ground: raw.ground,
    team1: raw.team1,
    team2: raw.team2,
    status,
    score: raw.score,
    goals1: raw.goals1,
    goals2: raw.goals2,
    finalGroupMatchday,
  };
}

/** Map every raw match -> Match, sharing the final-matchday lookup. */
export function transformAll(file: RawFile, now: Date = new Date()): Match[] {
  const finalMD = computeFinalMatchdayByGroup(file.matches);
  return file.matches.map((r) => transformMatch(r, finalMD, now));
}

export class OpenFootballAdapter implements MatchDataSource {
  private cache: Match[] | null = null;
  private offline = false;
  constructor(
    private readonly url: string = OPENFOOTBALL_URL,
    private readonly fetcher: Fetcher = defaultFetcher,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  private async loadAll(): Promise<Match[]> {
    if (this.cache) return this.cache;
    try {
      const file = await this.fetcher(this.url);
      this.cache = transformAll(file, this.clock());
      this.offline = false;
    } catch (err) {
      // Network or parse error — fall back to the bundled snapshot so the
      // morning recap never turns into a spinner. The UI surfaces a banner
      // when `isOfflineFallback()` is true.
      // eslint-disable-next-line no-console
      console.warn('openfootball fetch failed, using bundled snapshot:', err);
      this.cache = transformAll(bundledSnapshot as RawFile, this.clock());
      this.offline = true;
    }
    return this.cache;
  }

  /** Drop the in-memory cache (useful for manual refresh). */
  invalidate(): void {
    this.cache = null;
    this.offline = false;
  }

  isOfflineFallback(): boolean {
    return this.offline;
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
