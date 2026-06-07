/**
 * "What changed since last visit" (P1.1) — pure diff between a stored snapshot
 * and the current state. The component persists the snapshot in localStorage;
 * this module is pure and testable.
 */

export type LeagueSnapshot = {
  rank: number; // 1-based position on the leaderboard
  total: number; // points
  winnerAlive: boolean; // your winner pick still in the tournament
};

export type ChangeMessage = { kind: 'rank' | 'points' | 'winner'; text: string };

export function diffSnapshot(prev: LeagueSnapshot | null, now: LeagueSnapshot): ChangeMessage[] {
  if (!prev) return [];
  const out: ChangeMessage[] = [];

  if (now.rank < prev.rank) {
    const places = prev.rank - now.rank;
    out.push({ kind: 'rank', text: `You climbed ${places} place${places === 1 ? '' : 's'} to #${now.rank}.` });
  } else if (now.rank > prev.rank) {
    const places = now.rank - prev.rank;
    out.push({ kind: 'rank', text: `You dropped ${places} place${places === 1 ? '' : 's'} to #${now.rank}.` });
  }

  if (now.total > prev.total) {
    out.push({ kind: 'points', text: `+${now.total - prev.total} points since your last visit.` });
  }

  if (prev.winnerAlive && !now.winnerAlive) {
    out.push({ kind: 'winner', text: 'Your winner pick is out of the tournament.' });
  }

  return out;
}
