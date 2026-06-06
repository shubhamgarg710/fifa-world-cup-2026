/**
 * ============================================================
 * DEMO ADAPTER — REMOVE BEFORE THE REAL TOURNAMENT STARTS.
 *
 * Activated by visiting the app with `?demo=1` in the URL.
 *
 * What it does:
 *   - Loads the complete World Cup 2022 schedule + results.
 *   - Shifts every kickoff forward so a mid-group-stage day lands on today.
 *   - Strips scores from matches whose shifted kickoff is in the future
 *     (so they render as "scheduled"), and from one match that just
 *     "kicked off" (so the "Result pending" state is visible).
 *
 * To remove:
 *   1. Delete this file.
 *   2. Delete `src/data/sources/__fixtures__/worldcup-2022.json`.
 *   3. In `src/data/queries.ts`, drop the demo branch.
 *   4. (Optional) Remove the 6 demo-only teams from `teams.json` and
 *      `rankings.json` (Wales, Denmark, Costa Rica, Cameroon, Serbia, Poland).
 * ============================================================
 */

import { parseKickoff } from '@/logic/time';
import wc2022 from './__fixtures__/worldcup-2022.json';
import type { DateRange, GoalEntry, Match, MatchDataSource, Score } from './types';
import { matchId } from './types';

type Raw2022 = {
  round: string;
  date: string;
  time: string; // "16:00" — no UTC offset in the 2022 file
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  score?: Score;
  goals1?: GoalEntry[];
  goals2?: GoalEntry[];
};

const HOUR_MS = 60 * 60 * 1000;

/** Mid-group-stage anchor day in WC22. Picking Nov 24 puts the user a few days
 * into the tournament — finished games behind, today's slate ahead, plenty of
 * upcoming knockouts. */
const ANCHOR_2022 = new Date('2022-11-24T00:00:00Z');

/** All WC22 matches were in Qatar (UTC+3). Append the offset so parseKickoff works. */
function normalize2022Time(t: string): string {
  return /UTC[+-]/i.test(t) ? t : `${t} UTC+3`;
}

function shiftDate(iso: string, offsetMs: number): string {
  return new Date(new Date(iso).getTime() + offsetMs).toISOString();
}

function matchdayNumber(round: string): number | null {
  const m = round.match(/^matchday\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

function computeFinalMatchdayByGroup(raws: Raw2022[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const r of raws) {
    if (!r.group) continue;
    const md = matchdayNumber(r.round);
    if (md == null) continue;
    acc[r.group] = Math.max(acc[r.group] ?? 0, md);
  }
  return acc;
}

export function buildDemoMatches(now: Date = new Date()): Match[] {
  const file = wc2022 as unknown as { matches: Raw2022[] };
  const offsetMs = now.getTime() - ANCHOR_2022.getTime();
  const finalMD = computeFinalMatchdayByGroup(file.matches);

  // Pick one "just kicked off" candidate to demo Result Pending: the latest
  // match whose shifted kickoff lands within the last 3 hours.
  const shiftedTimes = file.matches.map((r) => {
    const time = normalize2022Time(r.time);
    const orig = new Date(parseKickoff(r.date, time)).getTime();
    return orig + offsetMs;
  });

  const pendingIdx = (() => {
    let chosen = -1;
    let chosenT = -Infinity;
    for (let i = 0; i < shiftedTimes.length; i++) {
      const t = shiftedTimes[i];
      const delta = now.getTime() - t;
      if (delta > 0 && delta < 3 * HOUR_MS && t > chosenT) {
        chosen = i;
        chosenT = t;
      }
    }
    return chosen;
  })();

  return file.matches.map((r, i) => {
    const time = normalize2022Time(r.time);
    const kickoffUTC = shiftDate(parseKickoff(r.date, time), offsetMs);
    const isFuture = new Date(kickoffUTC).getTime() > now.getTime();
    const isPending = i === pendingIdx;
    // Strip score+goals for future matches and the pending demo match.
    const score = isFuture || isPending ? undefined : r.score;
    const goals1 = isFuture || isPending ? undefined : r.goals1;
    const goals2 = isFuture || isPending ? undefined : r.goals2;
    const status: Match['status'] = score
      ? 'finished'
      : isFuture
        ? 'scheduled'
        : 'result_pending';
    const md = matchdayNumber(r.round);
    const finalGroupMatchday =
      !!r.group && md != null && md === finalMD[r.group];
    // Re-derive a stable id from the *shifted* date so cards key correctly.
    const shiftedDate = kickoffUTC.slice(0, 10);
    return {
      id: matchId(shiftedDate, r.team1, r.team2),
      round: r.round,
      group: r.group,
      kickoffUTC,
      ground: r.ground,
      team1: r.team1,
      team2: r.team2,
      status,
      score,
      goals1,
      goals2,
      finalGroupMatchday,
    };
  });
}

export class DemoAdapter implements MatchDataSource {
  private cache: Match[] | null = null;
  constructor(private readonly clock: () => Date = () => new Date()) {}

  private all(): Match[] {
    if (!this.cache) this.cache = buildDemoMatches(this.clock());
    return this.cache;
  }

  async listAll(): Promise<Match[]> {
    return this.all();
  }
  async listMatches(range: DateRange): Promise<Match[]> {
    const from = new Date(range.fromUTC).getTime();
    const to = new Date(range.toUTC).getTime();
    return this.all().filter((m) => {
      const t = new Date(m.kickoffUTC).getTime();
      return t >= from && t <= to;
    });
  }
  async getMatch(id: string): Promise<Match> {
    const found = this.all().find((m) => m.id === id);
    if (!found) throw new Error(`Match not found: ${id}`);
    return found;
  }
}

