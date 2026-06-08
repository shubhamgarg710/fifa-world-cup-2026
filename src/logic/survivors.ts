/**
 * Group-stage elimination rules for the picks wizard. These are a UX scaffold:
 * the persisted shape stays a flat 32-name `reachR32` array. The constraint
 * mirrors how a fan thinks — every group sends at least 2 through, the strong
 * groups send 3 (so 4 groups drop 2, 8 groups drop 1 → exactly 16 eliminated).
 */
import type { Picks } from '@/data/league/types';
import type { Group } from './groups';
import { isReachR32Complete } from './leagueScore';

export const ELIMINATE_TARGET = 16;
export const MAX_PER_GROUP = 2;

export type EliminationValidity = {
  total: number;
  groupsDone: number; // groups with ≥1 elimination
  groupCount: number;
  perGroup: Map<string, number>;
  valid: boolean;
};

export function eliminationValidity(eliminated: Set<string>, groups: Group[]): EliminationValidity {
  const perGroup = new Map<string, number>();
  let groupsDone = 0;
  let allWithinRange = true;
  for (const g of groups) {
    const n = g.teams.filter((t) => eliminated.has(t)).length;
    perGroup.set(g.name, n);
    if (n >= 1) groupsDone += 1;
    if (n < 1 || n > MAX_PER_GROUP) allWithinRange = false;
  }
  const total = eliminated.size;
  return {
    total,
    groupsDone,
    groupCount: groups.length,
    perGroup,
    valid: allWithinRange && groupsDone === groups.length && total === ELIMINATE_TARGET,
  };
}

/** Whether a single group can take another elimination (cap MAX_PER_GROUP). */
export function groupAtMax(eliminated: Set<string>, group: Group): boolean {
  return group.teams.filter((t) => eliminated.has(t)).length >= MAX_PER_GROUP;
}

export function survivorsToReachR32(eliminated: Set<string>, pool: string[]): string[] {
  return pool.filter((t) => !eliminated.has(t));
}

export function eliminatedFromSaved(reachR32: string[], pool: string[]): Set<string> {
  if (reachR32.length === 0) return new Set();
  const survivors = new Set(reachR32);
  return new Set(pool.filter((t) => !survivors.has(t)));
}

export type PreStep = 0 | 1 | 2 | 3 | 'review';

/**
 * First incomplete pre-tournament step, for resume. Survivors complete iff the
 * saved set is a full 32 (`isReachR32Complete`); the per-group distribution is
 * only enforced live in the editor, not on resume of an already-saved set.
 */
export function firstIncompleteStep(picks: Picks): PreStep {
  if (!isReachR32Complete(picks)) return 0;
  if (!picks.winner) return 1;
  if (!picks.goldenBoot) return 2;
  if (!picks.goldenBall) return 3;
  return 'review';
}
