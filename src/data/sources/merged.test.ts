import { describe, expect, it } from 'vitest';
import type { Match } from './types';
import { matchId } from './types';
import type { BracketTie, MatchOverlay } from './espn';
import { mergeMatch, resolveBracket } from './merged';
import { teamKey, fixtureKey } from './teamAliases';

const NOW = new Date('2026-06-15T00:00:00Z');

function fixture(over: Partial<Match> = {}): Match {
  return {
    id: '2026-06-11__mexico__south-africa',
    round: 'Matchday 1',
    group: 'Group A',
    kickoffUTC: '2026-06-11T19:00:00.000Z',
    ground: 'Mexico City',
    team1: 'Mexico',
    team2: 'South Africa',
    status: 'result_pending',
    ...over,
  };
}

function overlayOf(entry: MatchOverlay): Map<string, MatchOverlay> {
  return new Map([[fixtureKey('2026-06-11', 'Mexico', 'South Africa'), entry]]);
}

describe('mergeMatch', () => {
  it('overrides with ESPN when ESPN is finished (score + goals mapped to team1/team2)', () => {
    const o = overlayOf({
      status: 'finished',
      scoreByTeamKey: { [teamKey('Mexico')]: 2, [teamKey('South Africa')]: 0 },
      goalsByTeamKey: { [teamKey('Mexico')]: [{ name: 'Quiñones', minute: 9 }] },
    });
    const m = mergeMatch(fixture(), o, NOW);
    expect(m.status).toBe('finished');
    expect(m.score?.ft).toEqual([2, 0]);
    expect(m.goals1).toEqual([{ name: 'Quiñones', minute: 9 }]);
    expect(m.goals2).toEqual([]);
  });

  it('preserves openfootball ht/et/p (knockout) while taking ESPN ft', () => {
    const o = overlayOf({
      status: 'finished',
      scoreByTeamKey: { [teamKey('Mexico')]: 1, [teamKey('South Africa')]: 1 },
      goalsByTeamKey: {},
    });
    const m = mergeMatch(fixture({ score: { ft: [1, 1], et: [1, 1], p: [4, 3] } }), o, NOW);
    expect(m.score).toEqual({ ft: [1, 1], et: [1, 1], p: [4, 3] });
  });

  it('keeps an openfootball-final result when ESPN is not finished (no regression)', () => {
    const o = overlayOf({ status: 'scheduled', scoreByTeamKey: {}, goalsByTeamKey: {} });
    const m = mergeMatch(fixture({ status: 'finished', score: { ft: [3, 1] } }), o, NOW);
    expect(m.status).toBe('finished');
    expect(m.score?.ft).toEqual([3, 1]);
  });

  it('leaves a fixture untouched when ESPN has no data for it', () => {
    const m = mergeMatch(fixture({ status: 'scheduled' }), new Map(), NOW);
    expect(m.status).toBe('scheduled');
  });

  it('keeps result_pending when neither source has a final but it kicked off', () => {
    const o = overlayOf({ status: 'result_pending', scoreByTeamKey: {}, goalsByTeamKey: {} });
    const m = mergeMatch(fixture({ status: 'scheduled' }), o, NOW); // NOW is past the kickoff
    expect(m.status).toBe('result_pending');
  });
});

describe('resolveBracket', () => {
  const ko = (over: Partial<Match> = {}): Match => ({
    id: 'x',
    round: 'Round of 32',
    kickoffUTC: '2026-07-03T22:00:00.000Z',
    ground: 'X',
    team1: '1J',
    team2: '2H',
    status: 'scheduled',
    ...over,
  });
  const tieMap = (key: string, tie: BracketTie) => new Map([[key, tie]]);

  it('fills a fully-placeholder tie from ESPN (by kickoff minute) + regenerates id', () => {
    const m = resolveBracket(ko(), tieMap('2026-07-03T22:00', { home: 'Argentina', away: 'Cape Verde' }));
    expect([m.team1, m.team2]).toEqual(['Argentina', 'Cape Verde']);
    expect(m.id).toBe(matchId('2026-07-03', 'Argentina', 'Cape Verde'));
  });

  it('fills only the placeholder side, keeping the known team in its slot', () => {
    const fx = ko({ team1: 'Germany', team2: '3A/B/C/D/F', kickoffUTC: '2026-06-29T20:30:00.000Z' });
    const m = resolveBracket(fx, tieMap('2026-06-29T20:30', { home: 'Germany', away: 'Paraguay' }));
    expect([m.team1, m.team2]).toEqual(['Germany', 'Paraguay']);
  });

  it('leaves the fixture unchanged when ESPN has no tie at that minute', () => {
    expect(resolveBracket(ko(), new Map())).toEqual(ko());
  });

  it('does not touch an already-resolved fixture', () => {
    const fx = ko({ team1: 'Brazil', team2: 'Japan' });
    expect(resolveBracket(fx, tieMap('2026-07-03T22:00', { home: 'X', away: 'Y' }))).toEqual(fx);
  });

  it('ignores non-knockout (group) fixtures', () => {
    const grp = ko({ round: 'Matchday 1', team1: '1A', team2: '2B' });
    expect(resolveBracket(grp, tieMap('2026-07-03T22:00', { home: 'A', away: 'B' }))).toEqual(grp);
  });

  it('skips when the ESPN tie does not contain the known team (mismatch guard)', () => {
    const fx = ko({ team1: 'Germany', team2: '3A/B/C/D/F', kickoffUTC: '2026-06-29T20:30:00.000Z' });
    const m = resolveBracket(fx, tieMap('2026-06-29T20:30', { home: 'France', away: 'Sweden' }));
    expect([m.team1, m.team2]).toEqual(['Germany', '3A/B/C/D/F']);
  });
});
