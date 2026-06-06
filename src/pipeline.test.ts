/**
 * End-to-end-ish smoke: feed the real openfootball file through the adapter,
 * then through the verdict logic with bundled rankings. Verifies the pipeline
 * is wired correctly — no UI involved.
 */
import { describe, expect, it } from 'vitest';
import realFile from './data/sources/__fixtures__/worldcup.json';
import { transformAll } from './data/sources/openFootball';
import { teamRank } from './data/static';
import { postmatchVerdict, prematchWatchability, type MyTeams } from './logic/verdict';

const NONE: MyTeams = { support: [], follow: [] };

describe('full pipeline smoke', () => {
  const all = transformAll(realFile as never, new Date('2026-05-01T00:00:00Z'));

  it('parses the entire schedule without throwing', () => {
    expect(all.length).toBe(104);
    for (const m of all) expect(m.kickoffUTC).toMatch(/^2026-/);
  });

  it('the final has high pre-match watchability', () => {
    const final = all.find((m) => /^Final$/i.test(m.round));
    expect(final).toBeTruthy();
    // Final has knockout reason even without known teams (W101 vs W102)
    const w = prematchWatchability(final!, NONE, teamRank);
    expect(w.reasons).toContain('knockout');
    expect(w.tier).not.toBe('normal');
  });

  it('the opener has a real Match record with parsed kickoff', () => {
    const opener = all.find((m) => m.team1 === 'Mexico' && m.team2 === 'South Africa');
    expect(opener).toBeTruthy();
    expect(opener!.kickoffUTC).toBe('2026-06-11T19:00:00.000Z');
  });

  it('postmatchVerdict tolerates pre-tournament matches (no score) gracefully', () => {
    const sample = all[0];
    expect(sample.status).toBe('scheduled');
    const v = postmatchVerdict(sample, NONE, teamRank);
    expect(v.label).toBe('skip');
    expect(v.headline).toBeNull();
  });
});
