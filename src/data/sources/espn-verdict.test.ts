import { describe, expect, it } from 'vitest';
import { EspnAdapter } from './espn';
import { mergeMatch } from './merged';
import { fixtureKey } from './teamAliases';
import { postmatchVerdict } from '@/logic/verdict';
import type { Match } from './types';

/**
 * Regression for the "Qatar 1–1 Switzerland shows Skip" bug. Qatar's equaliser
 * was an own goal by Switzerland's Muheim at the *real* ESPN stoppage clock
 * `"90'+4'"`. The whole chain (ESPN parse → merge → verdict) must surface a
 * "late equalizer", i.e. must-watch — not skip.
 */
const QATAR_SWISS_EVENT = {
  events: [
    {
      date: '2026-06-13T19:00Z',
      competitions: [
        {
          status: { type: { name: 'STATUS_FULL_TIME' } },
          competitors: [
            { team: { id: '4398', displayName: 'Qatar' }, score: '1' },
            { team: { id: '475', displayName: 'Switzerland' }, score: '1' },
          ],
          details: [
            { type: { text: 'Penalty - Scored' }, clock: { displayValue: "17'" }, scoringPlay: true, penaltyKick: true, team: { id: '475' }, athletesInvolved: [{ displayName: 'Breel Embolo' }] },
            // Real ESPN shape: the own goal is CREDITED to the beneficiary (Qatar,
            // id 4398), with ownGoal:true, at the real stoppage clock `90'+4'`.
            { type: { text: 'Own Goal' }, clock: { displayValue: "90'+4'" }, scoringPlay: true, ownGoal: true, team: { id: '4398' }, athletesInvolved: [{ displayName: 'Miro Muheim' }] },
          ],
        },
      ],
    },
  ],
};

const fixture: Match = {
  id: '2026-06-13__switzerland__qatar',
  round: 'Matchday 1',
  group: 'Group B',
  kickoffUTC: '2026-06-13T19:00:00.000Z',
  ground: 'Toronto',
  team1: 'Switzerland',
  team2: 'Qatar',
  status: 'result_pending',
};

const noTeams = { support: [], follow: [] };
const noRank = () => undefined;

describe('ESPN stoppage-time own goal → verdict', () => {
  it('flags Qatar 1–1 Switzerland as must-watch (late equalizer), not skip', async () => {
    const adapter = new EspnAdapter('unused', async () => QATAR_SWISS_EVENT as never);
    const overlay = await adapter.fetchOverlay();

    // overlay actually keyed this match
    expect(overlay.has(fixtureKey('2026-06-13', 'Switzerland', 'Qatar'))).toBe(true);

    const merged = mergeMatch(fixture, overlay, new Date('2026-06-14T00:00:00Z'));
    expect(merged.status).toBe('finished');
    expect(merged.score?.ft).toEqual([1, 1]);

    // Own goal is captured and carries the real stoppage offset (90+4), bucketed
    // under the scoring team (Switzerland = team1).
    const og = merged.goals1?.find((g) => g.owngoal);
    expect(og).toMatchObject({ minute: 90, offset: 4 });

    const verdict = postmatchVerdict(merged, noTeams, noRank);
    expect(verdict.reasons.strong).toContain('late equalizer');
    expect(verdict.label).toBe('must-watch');
  });
});
