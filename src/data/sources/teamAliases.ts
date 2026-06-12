import { slug } from './types';

/**
 * ESPN uses different country names than openfootball/our teams.json
 * (e.g. "Czechia" vs "Czech Republic"). To match an ESPN event to an
 * openfootball fixture we reduce both names to a shared key: slug() strips
 * diacritics + punctuation, and this table bridges the genuine naming
 * divergences. Keyed by slug(espnVariant) → our canonical team name.
 */
const ALIASES: Record<string, string> = {
  czechia: 'Czech Republic',
  'korea-republic': 'South Korea',
  'south-korea': 'South Korea',
  'ir-iran': 'Iran',
  turkiye: 'Turkey',
  'united-states': 'USA',
  usmnt: 'USA',
  'cote-d-ivoire': 'Ivory Coast',
  'cabo-verde': 'Cape Verde',
  'congo-dr': 'DR Congo',
  'dr-congo': 'DR Congo',
  'bosnia-and-herzegovina': 'Bosnia & Herzegovina',
};

/** Map any source's team name to our canonical name (passthrough if unknown). */
export function canonicalTeam(name: string): string {
  return ALIASES[slug(name)] ?? name;
}

/** Shared join key for matching teams across sources. */
export function teamKey(name: string): string {
  return slug(canonicalTeam(name));
}

/** Unordered date+pair key for matching a fixture to an ESPN event. */
export function fixtureKey(dateYMD: string, teamA: string, teamB: string): string {
  return [dateYMD, ...[teamKey(teamA), teamKey(teamB)].sort()].join('__');
}
