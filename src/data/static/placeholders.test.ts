import { describe, expect, it } from 'vitest';
import { displayTeamName, isPlaceholderTeam } from './placeholders';

describe('isPlaceholderTeam', () => {
  it.each([
    ['1A', true],
    ['2L', true],
    ['1M', false],              // M is past L; not a real group slot
    ['3A/B/C/D/F', true],
    ['3A/B', true],
    ['3A', false],              // single-group "3A" is malformed; treat as not a placeholder
    ['W73', true],
    ['L101', true],
    ['W3', true],
    ['Brazil', false],
    ['South Africa', false],
    ['Curaçao', false],
    ['', false],
  ])('%s -> %s', (name, expected) => {
    expect(isPlaceholderTeam(name)).toBe(expected);
  });
});

describe('displayTeamName', () => {
  it('group winners and runners-up', () => {
    expect(displayTeamName('1A')).toBe('Winner of Group A');
    expect(displayTeamName('2B')).toBe('Runner-up of Group B');
    expect(displayTeamName('1L')).toBe('Winner of Group L');
  });

  it('best third combinations', () => {
    expect(displayTeamName('3A/B/C/D/F')).toBe('Best 3rd · A/B/C/D/F');
    expect(displayTeamName('3E/H/I/J/K')).toBe('Best 3rd · E/H/I/J/K');
  });

  it('bracket references', () => {
    expect(displayTeamName('W73')).toBe('Winner of M73');
    expect(displayTeamName('L101')).toBe('Loser of M101');
    expect(displayTeamName('W102')).toBe('Winner of M102');
  });

  it('passes real team names through unchanged', () => {
    expect(displayTeamName('Brazil')).toBe('Brazil');
    expect(displayTeamName('Curaçao')).toBe('Curaçao');
    expect(displayTeamName('South Africa')).toBe('South Africa');
  });
});
