import { describe, expect, it } from 'vitest';
import type { Group } from './groups';
import { EMPTY_PICKS, type Picks } from '@/data/league/types';
import {
  eliminatedFromSaved,
  eliminationValidity,
  firstIncompleteStep,
  groupAtMax,
  survivorsToReachR32,
} from './survivors';

// 12 groups of 4 → 48 teams: A1..A4, B1..B4, …, L1..L4
const LETTERS = 'ABCDEFGHIJKL'.split('');
const GROUPS: Group[] = LETTERS.map((l) => ({
  name: `Group ${l}`,
  teams: [1, 2, 3, 4].map((n) => `${l}${n}`),
}));
const POOL = GROUPS.flatMap((g) => g.teams);

/** Eliminate `n` from each group (the first n teams). */
function eliminate(perGroup: Record<string, number>): Set<string> {
  const s = new Set<string>();
  for (const g of GROUPS) {
    const n = perGroup[g.name] ?? 0;
    g.teams.slice(0, n).forEach((t) => s.add(t));
  }
  return s;
}

describe('eliminationValidity', () => {
  it('valid: 1 from every group + a 2nd from 4 groups (total 16)', () => {
    const per: Record<string, number> = {};
    GROUPS.forEach((g, i) => (per[g.name] = i < 4 ? 2 : 1)); // 4×2 + 8×1 = 16
    const v = eliminationValidity(eliminate(per), GROUPS);
    expect(v.total).toBe(16);
    expect(v.groupsDone).toBe(12);
    expect(v.valid).toBe(true);
  });

  it('invalid: a group with 0 eliminations (even at total 16)', () => {
    // Put all 16 in fewer groups: 4 groups ×4 → but cap is 2, so use 8 groups ×2 = 16, leaving 4 groups empty
    const per: Record<string, number> = {};
    GROUPS.forEach((g, i) => (per[g.name] = i < 8 ? 2 : 0));
    const v = eliminationValidity(eliminate(per), GROUPS);
    expect(v.total).toBe(16);
    expect(v.valid).toBe(false); // 4 groups have 0
  });

  it('invalid: more than 2 from a group', () => {
    const per: Record<string, number> = {};
    GROUPS.forEach((g) => (per[g.name] = 1)); // 12
    per['Group A'] = 4; // 3 extra → 15... bump another
    per['Group B'] = 1;
    const v = eliminationValidity(eliminate(per), GROUPS);
    expect(v.valid).toBe(false);
  });

  it('invalid: correct distribution but total ≠ 16', () => {
    const per: Record<string, number> = {};
    GROUPS.forEach((g) => (per[g.name] = 1)); // 12 total, every group done
    const v = eliminationValidity(eliminate(per), GROUPS);
    expect(v.groupsDone).toBe(12);
    expect(v.total).toBe(12);
    expect(v.valid).toBe(false);
  });
});

describe('groupAtMax', () => {
  it('true at 2 eliminated in a group', () => {
    const s = new Set(['A1', 'A2']);
    expect(groupAtMax(s, GROUPS[0])).toBe(true);
    expect(groupAtMax(s, GROUPS[1])).toBe(false);
  });
});

describe('survivors round-trip', () => {
  it('survivors = pool minus eliminated, and resume recovers the same set', () => {
    const elim = eliminate({ 'Group A': 2, 'Group B': 1 });
    const survivors = survivorsToReachR32(elim, POOL);
    expect(survivors).toHaveLength(POOL.length - 3);
    expect(eliminatedFromSaved(survivors, POOL)).toEqual(elim);
  });

  it('empty saved survivors → no eliminations', () => {
    expect(eliminatedFromSaved([], POOL).size).toBe(0);
  });
});

describe('firstIncompleteStep', () => {
  const full32 = POOL.slice(0, 32);
  const p = (over: Partial<Picks>): Picks => ({ ...EMPTY_PICKS, ...over });

  it('0 when survivors incomplete', () => {
    expect(firstIncompleteStep(p({ reachR32: ['A1'] }))).toBe(0);
  });
  it('1 when survivors done but no winner', () => {
    expect(firstIncompleteStep(p({ reachR32: full32 }))).toBe(1);
  });
  it('2 when winner set but no boot', () => {
    expect(firstIncompleteStep(p({ reachR32: full32, winner: 'A1' }))).toBe(2);
  });
  it('3 when boot set but no ball', () => {
    expect(firstIncompleteStep(p({ reachR32: full32, winner: 'A1', goldenBoot: 'X' }))).toBe(3);
  });
  it('review when all complete', () => {
    expect(firstIncompleteStep(p({ reachR32: full32, winner: 'A1', goldenBoot: 'X', goldenBall: 'Y' }))).toBe('review');
  });
});
