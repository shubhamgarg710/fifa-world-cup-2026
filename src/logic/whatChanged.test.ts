import { describe, expect, it } from 'vitest';
import { diffSnapshot } from './whatChanged';

describe('diffSnapshot', () => {
  it('returns nothing when there is no prior snapshot', () => {
    expect(diffSnapshot(null, { rank: 1, total: 10, winnerAlive: true })).toEqual([]);
  });

  it('reports a climb', () => {
    const out = diffSnapshot({ rank: 3, total: 10, winnerAlive: true }, { rank: 1, total: 10, winnerAlive: true });
    expect(out.some((c) => c.kind === 'rank' && /climbed 2 places to #1/.test(c.text))).toBe(true);
  });

  it('reports a drop', () => {
    const out = diffSnapshot({ rank: 1, total: 10, winnerAlive: true }, { rank: 4, total: 10, winnerAlive: true });
    expect(out.some((c) => c.kind === 'rank' && /dropped 3 places to #4/.test(c.text))).toBe(true);
  });

  it('reports points gained', () => {
    const out = diffSnapshot({ rank: 1, total: 10, winnerAlive: true }, { rank: 1, total: 25, winnerAlive: true });
    expect(out.some((c) => c.kind === 'points' && /\+15 points/.test(c.text))).toBe(true);
  });

  it('reports a winner knocked out (only on the transition)', () => {
    const out = diffSnapshot({ rank: 1, total: 10, winnerAlive: true }, { rank: 1, total: 10, winnerAlive: false });
    expect(out.some((c) => c.kind === 'winner')).toBe(true);
    // Already-out winner doesn't re-announce.
    const again = diffSnapshot({ rank: 1, total: 10, winnerAlive: false }, { rank: 1, total: 10, winnerAlive: false });
    expect(again.some((c) => c.kind === 'winner')).toBe(false);
  });

  it('singular wording for one place', () => {
    const out = diffSnapshot({ rank: 2, total: 0, winnerAlive: true }, { rank: 1, total: 0, winnerAlive: true });
    expect(out[0].text).toMatch(/1 place to/);
    expect(out[0].text).not.toMatch(/places/);
  });
});
