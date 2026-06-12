import { useQuery } from '@tanstack/react-query';
import { OpenFootballAdapter } from './sources/openFootball';
import { DemoAdapter } from './sources/demo';
import { EspnAdapter } from './sources/espn';
import { MergedDataSource } from './sources/merged';
import type { Match, MatchDataSource } from './sources/types';

/** How far back a "Recent" match can sit before it drops off the home screen. */
export const RECENT_WINDOW_HOURS = 72;

/** Demo mode: visit `?demo=1` to load shifted WC 2022 data. See `demo.ts` for removal steps. */
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1';
  } catch {
    return false;
  }
}

/** Kill-switch: set VITE_DISABLE_ESPN=1 to fall back to openfootball-only. */
const espnDisabled = ['1', 'true'].includes(String(import.meta.env.VITE_DISABLE_ESPN ?? '').toLowerCase());

function makeAdapter(): MatchDataSource {
  if (isDemoMode()) return new DemoAdapter(); // 2022 data → ESPN (2026) bypassed
  const openfootball = new OpenFootballAdapter();
  if (espnDisabled) return openfootball;
  // openfootball = fixtures backbone; ESPN overlays fresher results (best-effort).
  return new MergedDataSource(openfootball, new EspnAdapter());
}

let adapter: MatchDataSource = makeAdapter();

/** Swap the adapter (used in tests / stories). */
export function setDataSource(source: MatchDataSource): void {
  adapter = source;
}

export function useAllMatches() {
  return useQuery({
    queryKey: ['matches', 'all'],
    queryFn: async () => {
      const matches = await adapter.listAll();
      const offline = adapter.isOfflineFallback?.() ?? false;
      return { matches, offline };
    },
    staleTime: 60_000,
  });
}

export function useMatch(id: string | null) {
  return useQuery({
    queryKey: ['match', id],
    queryFn: () => adapter.getMatch(id!),
    enabled: !!id,
  });
}

/** Group all matches into today / recent / upcoming for the user's tz. */
export function splitMatchesForToday(
  all: Match[],
  todayLocalKey: string,
  toLocalDayKey: (iso: string) => string,
  now: Date = new Date(),
): { today: Match[]; recent: Match[]; future: Match[] } {
  const today: Match[] = [];
  const recent: Match[] = [];
  const future: Match[] = [];
  const nowMs = now.getTime();
  const cutoffMs = nowMs - RECENT_WINDOW_HOURS * 60 * 60 * 1000;
  for (const m of all) {
    const dayKey = toLocalDayKey(m.kickoffUTC);
    const kt = new Date(m.kickoffUTC).getTime();
    if (dayKey === todayLocalKey) {
      today.push(m);
    } else if (kt < nowMs && kt >= cutoffMs) {
      recent.push(m);
    } else if (kt >= nowMs) {
      future.push(m);
    }
  }
  // sort today by kickoff ascending
  today.sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime());
  // sort recent by kickoff descending (most recent first; verdict re-sort happens in UI)
  recent.sort((a, b) => new Date(b.kickoffUTC).getTime() - new Date(a.kickoffUTC).getTime());
  // sort future ascending so future[0] is genuinely the next kickoff
  future.sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime());
  return { today, recent, future };
}

/**
 * Pick the board to show under "Today": today's fixtures if any, otherwise the
 * next upcoming match day's fixtures. Keeps the section alive pre-tournament
 * and across the group-stage → Round-of-32 gap with no special-casing.
 */
export function selectBoard(
  all: Match[],
  todayLocalKey: string,
  toLocalDayKey: (iso: string) => string,
  now: Date = new Date(),
): { matches: Match[]; isToday: boolean; labelDateISO: string | null } {
  const { today, future } = splitMatchesForToday(all, todayLocalKey, toLocalDayKey, now);
  if (today.length > 0) {
    return { matches: today, isToday: true, labelDateISO: now.toISOString() };
  }
  if (future.length > 0) {
    const next = future[0]; // future is sorted ascending
    const nextDayKey = toLocalDayKey(next.kickoffUTC);
    const matches = future
      .filter((m) => toLocalDayKey(m.kickoffUTC) === nextDayKey)
      .sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime());
    return { matches, isToday: false, labelDateISO: next.kickoffUTC };
  }
  return { matches: [], isToday: true, labelDateISO: null };
}
