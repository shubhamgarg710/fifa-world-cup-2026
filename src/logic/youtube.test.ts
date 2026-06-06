import { describe, expect, it } from 'vitest';
import { buildHighlightsUrl } from './youtube';

describe('buildHighlightsUrl', () => {
  it('produces a YouTube search url with both team names and "extended highlights"', () => {
    const url = buildHighlightsUrl({ team1: 'Brazil', team2: 'Germany' });
    expect(url).toContain('youtube.com/results?search_query=');
    expect(url).toContain('Brazil');
    expect(url).toContain('Germany');
    expect(url).toMatch(/extended[%+\s]?20?highlights/i);
  });

  it('encodes special characters in team names', () => {
    const url = buildHighlightsUrl({ team1: 'Curaçao', team2: 'South Africa' });
    expect(url).toContain('Cura%C3%A7ao');
    expect(url).toContain('South%20Africa');
  });
});
