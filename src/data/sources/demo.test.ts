import { describe, expect, it } from 'vitest';
import { buildDemoMatches, DemoAdapter } from './demo';

const FAKE_NOW = new Date('2026-06-06T12:00:00Z');

describe('demo adapter', () => {
  const matches = buildDemoMatches(FAKE_NOW);

  it('returns 64 shifted matches', () => {
    expect(matches.length).toBe(64);
  });

  it('produces a mix of finished, scheduled, and pending', () => {
    const finished = matches.filter((m) => m.status === 'finished').length;
    const scheduled = matches.filter((m) => m.status === 'scheduled').length;
    const pending = matches.filter((m) => m.status === 'result_pending').length;
    expect(finished).toBeGreaterThan(0);
    expect(scheduled).toBeGreaterThan(0);
    // pending is optional — only triggered if a match happens to land in the last 3h
    expect(finished + scheduled + pending).toBe(64);
  });

  it("future matches don't carry scores or goals", () => {
    for (const m of matches.filter((m) => m.status === 'scheduled')) {
      expect(m.score).toBeUndefined();
      expect(m.goals1).toBeUndefined();
      expect(m.goals2).toBeUndefined();
    }
  });

  it('finished matches have scores', () => {
    for (const m of matches.filter((m) => m.status === 'finished')) {
      expect(m.score).toBeDefined();
    }
  });

  it('kickoff times are shifted forward to 2026', () => {
    for (const m of matches) {
      expect(m.kickoffUTC.slice(0, 4)).toMatch(/^202[56]$/);
    }
  });

  it('DemoAdapter.listAll returns the same shape', async () => {
    const a = new DemoAdapter(() => FAKE_NOW);
    const all = await a.listAll();
    expect(all.length).toBe(64);
  });
});
