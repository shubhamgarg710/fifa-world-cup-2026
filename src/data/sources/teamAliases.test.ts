import { describe, expect, it } from 'vitest';
import { canonicalTeam, fixtureKey, teamKey } from './teamAliases';

describe('canonicalTeam', () => {
  it('bridges ESPN naming divergences', () => {
    expect(canonicalTeam('Czechia')).toBe('Czech Republic');
    expect(canonicalTeam('Türkiye')).toBe('Turkey');
    expect(canonicalTeam('United States')).toBe('USA');
    expect(canonicalTeam("Côte d'Ivoire")).toBe('Ivory Coast');
  });
  it('passes unknown names through unchanged', () => {
    expect(canonicalTeam('Brazil')).toBe('Brazil');
    expect(canonicalTeam('Atlantis')).toBe('Atlantis');
  });
});

describe('teamKey', () => {
  it('converges ESPN + our names to the same key', () => {
    expect(teamKey('Czechia')).toBe(teamKey('Czech Republic'));
    expect(teamKey('Türkiye')).toBe(teamKey('Turkey'));
    expect(teamKey('Curaçao')).toBe(teamKey('Curaçao'));
  });
  it('keeps distinct teams distinct', () => {
    expect(teamKey('Mexico')).not.toBe(teamKey('South Africa'));
  });
});

describe('fixtureKey', () => {
  it('is order-independent', () => {
    expect(fixtureKey('2026-06-11', 'Mexico', 'South Africa')).toBe(
      fixtureKey('2026-06-11', 'South Africa', 'Mexico'),
    );
  });
  it('matches an openfootball fixture to an ESPN event despite the Czechia alias', () => {
    expect(fixtureKey('2026-06-12', 'South Korea', 'Czech Republic')).toBe(
      fixtureKey('2026-06-12', 'Czechia', 'South Korea'),
    );
  });
});
