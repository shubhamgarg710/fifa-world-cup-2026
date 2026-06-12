import type { GoalEntry, MatchStatus } from './types';
import { fixtureKey, teamKey } from './teamAliases';

/** ESPN soccer scoreboard — free, keyless, CORS `*`. One call covers the tournament. */
export const ESPN_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719';

/** Fresher results for one fixture, keyed into the merge by team-name key. */
export type MatchOverlay = {
  status: MatchStatus;
  scoreByTeamKey: Record<string, number>;
  goalsByTeamKey: Record<string, GoalEntry[]>;
};

type EspnFetcher = (url: string) => Promise<unknown>;

const defaultFetcher: EspnFetcher = async (url) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status}`);
  return res.json();
};

function mapStatus(name: string | undefined): MatchStatus {
  if (!name) return 'scheduled';
  if (/FULL_TIME|FINAL/i.test(name)) return 'finished';
  if (name === 'STATUS_SCHEDULED') return 'scheduled';
  return 'result_pending'; // in-progress, halftime, extra time, etc.
}

/** "9'" → {minute:9}; "90+2'" → {minute:90, offset:2}. */
function parseClock(display: string | undefined): { minute: number; offset?: number } {
  const m = (display ?? '').match(/^(\d+)(?:\s*\+\s*(\d+))?/);
  if (!m) return { minute: 0 };
  const minute = Number(m[1]);
  return m[2] ? { minute, offset: Number(m[2]) } : { minute };
}

const isGoal = (d: EspnDetail): boolean =>
  d.scoringPlay === true || /^goal/i.test(d.type?.text ?? '');

// --- raw ESPN shapes (only the fields we read) ---
type EspnAthlete = { displayName?: string };
type EspnDetail = {
  type?: { text?: string };
  clock?: { displayValue?: string };
  scoringPlay?: boolean;
  penaltyKick?: boolean;
  ownGoal?: boolean;
  team?: { id?: string };
  athletesInvolved?: EspnAthlete[];
};
type EspnCompetitor = { score?: string; team?: { id?: string; displayName?: string } };
type EspnEvent = {
  date?: string;
  competitions?: {
    status?: { type?: { name?: string } };
    competitors?: EspnCompetitor[];
    details?: EspnDetail[];
  }[];
};
type EspnScoreboard = { events?: EspnEvent[] };

/**
 * Results overlay from ESPN. Not a fixtures source — `MergedDataSource`
 * composes this on top of the openfootball backbone.
 */
export class EspnAdapter {
  constructor(
    private readonly url: string = ESPN_URL,
    private readonly fetcher: EspnFetcher = defaultFetcher,
  ) {}

  async fetchOverlay(): Promise<Map<string, MatchOverlay>> {
    const data = (await this.fetcher(this.url)) as EspnScoreboard;
    const map = new Map<string, MatchOverlay>();
    for (const ev of data.events ?? []) {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors ?? [];
      if (!ev.date || competitors.length < 2) continue;

      const dateYMD = ev.date.slice(0, 10);
      const names = competitors.map((c) => c.team?.displayName).filter((n): n is string => !!n);
      if (names.length < 2) continue;

      // ESPN team.id → our teamKey, for attributing goals + scores.
      const idToKey = new Map<string, string>();
      const scoreByTeamKey: Record<string, number> = {};
      for (const c of competitors) {
        const dn = c.team?.displayName;
        const id = c.team?.id;
        if (!dn || !id) continue;
        const k = teamKey(dn);
        idToKey.set(id, k);
        scoreByTeamKey[k] = Number(c.score ?? 0) || 0;
      }

      const goalsByTeamKey: Record<string, GoalEntry[]> = {};
      for (const d of comp?.details ?? []) {
        if (!isGoal(d)) continue;
        const k = d.team?.id ? idToKey.get(d.team.id) : undefined;
        if (!k) continue;
        const { minute, offset } = parseClock(d.clock?.displayValue);
        const entry: GoalEntry = {
          name: d.athletesInvolved?.[0]?.displayName ?? 'Unknown',
          minute,
          ...(offset != null ? { offset } : {}),
          ...(d.penaltyKick ? { penalty: true } : {}),
          ...(d.ownGoal ? { owngoal: true } : {}),
        };
        (goalsByTeamKey[k] ??= []).push(entry);
      }

      map.set(fixtureKey(dateYMD, names[0], names[1]), {
        status: mapStatus(comp?.status?.type?.name),
        scoreByTeamKey,
        goalsByTeamKey,
      });
    }
    return map;
  }
}
