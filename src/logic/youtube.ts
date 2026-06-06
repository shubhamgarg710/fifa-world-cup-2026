import type { Match } from '@/data/sources/types';

/**
 * YouTube search deep-link for a fixture. No API key, no embed restrictions —
 * the search results page picks the best uploaded highlight reel.
 */
export function buildHighlightsUrl(match: Pick<Match, 'team1' | 'team2'>): string {
  const q = `${match.team1} vs ${match.team2} World Cup 2026 extended highlights`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
