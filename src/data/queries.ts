import { useQuery } from '@tanstack/react-query';
import { OpenFootballAdapter } from './sources/openFootball';
import { DemoAdapter } from './sources/demo';
import type { Match, MatchDataSource } from './sources/types';

/** Demo mode: visit `?demo=1` to load shifted WC 2022 data. See `demo.ts` for removal steps. */
function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('demo') === '1';
  } catch {
    return false;
  }
}

let adapter: MatchDataSource = isDemoMode() ? new DemoAdapter() : new OpenFootballAdapter();

/** Swap the adapter (used in tests / stories). */
export function setDataSource(source: MatchDataSource): void {
  adapter = source;
}

export function useAllMatches() {
  return useQuery({
    queryKey: ['matches', 'all'],
    queryFn: () => adapter.listAll(),
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
  const cutoffMs = nowMs - 48 * 60 * 60 * 1000;
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
  return { today, recent, future };
}
