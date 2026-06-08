import { describe, expect, it } from 'vitest';
import { EMPTY_PICKS, normalizePicks } from './types';

describe('normalizePicks — lockedStages', () => {
  it('defaults to [] when absent', () => {
    expect(normalizePicks({}).lockedStages).toEqual([]);
    expect(EMPTY_PICKS.lockedStages).toEqual([]);
  });

  it('keeps valid stage keys and drops junk', () => {
    const out = normalizePicks({ lockedStages: ['reachR32', 'nonsense', 42, 'reachQF'] });
    expect(out.lockedStages).toEqual(['reachR32', 'reachQF']);
  });

  it('coerces a non-array to []', () => {
    expect(normalizePicks({ lockedStages: 'reachR32' }).lockedStages).toEqual([]);
  });
});
