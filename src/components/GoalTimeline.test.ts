import { describe, expect, it } from 'vitest';
import { buildTimeline } from './GoalTimeline';

describe('buildTimeline', () => {
  it('sorts goals chronologically across teams', () => {
    const tl = buildTimeline(
      [{ name: 'A', minute: 30 }],
      [
        { name: 'B', minute: 10 },
        { name: 'C', minute: 89 },
      ],
    );
    expect(tl.map((e) => e.scorer)).toEqual(['B', 'A', 'C']);
  });

  it('attributes own-goals to the benefiting side', () => {
    const tl = buildTimeline(
      [{ name: 'Kimmich', minute: 90, offset: 5, owngoal: true }],
      [],
    );
    expect(tl[0].for).toBe('team2');
    expect(tl[0].isOG).toBe(true);
    expect(tl[0].display).toBe('90+5\'');
  });

  it('marks ET goals', () => {
    const tl = buildTimeline([{ name: 'X', minute: 105 }], []);
    expect(tl[0].inExtraTime).toBe(true);
  });
});
