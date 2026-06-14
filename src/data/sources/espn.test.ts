import { describe, expect, it } from 'vitest';
import canned from './__fixtures__/espn-scoreboard.json';
import { EspnAdapter } from './espn';
import { fixtureKey, teamKey } from './teamAliases';

const adapter = new EspnAdapter('unused', async () => canned as never);

describe('EspnAdapter.fetchOverlay', () => {
  it('keys events by date + unordered team pair', async () => {
    const overlay = await adapter.fetchOverlay();
    expect(overlay.has(fixtureKey('2026-06-11', 'Mexico', 'South Africa'))).toBe(true);
    // matches our canonical "Czech Republic" despite ESPN's "Czechia"
    expect(overlay.has(fixtureKey('2026-06-12', 'South Korea', 'Czech Republic'))).toBe(true);
  });

  it('maps STATUS_FULL_TIME → finished with the right score', async () => {
    const overlay = await adapter.fetchOverlay();
    const mex = overlay.get(fixtureKey('2026-06-11', 'Mexico', 'South Africa'))!;
    expect(mex.status).toBe('finished');
    expect(mex.scoreByTeamKey[teamKey('Mexico')]).toBe(2);
    expect(mex.scoreByTeamKey[teamKey('South Africa')]).toBe(0);
  });

  it('extracts goals (scorer + minute) bucketed by team, ignoring cards', async () => {
    const overlay = await adapter.fetchOverlay();
    const mex = overlay.get(fixtureKey('2026-06-11', 'Mexico', 'South Africa'))!;
    const mexGoals = mex.goalsByTeamKey[teamKey('Mexico')] ?? [];
    expect(mexGoals.length).toBe(2); // Mexico scored 2 (cards excluded)
    expect(mexGoals[0].name).toBe('Julián Quiñones');
    expect(mexGoals[0].minute).toBe(9);
  });
});

describe('parse helpers (via overlay output)', () => {
  it('falls back to openfootball-shaped goals with offset/penalty/owngoal flags', async () => {
    // Synthetic event exercising the real stoppage format "90'+2'", penalty, and own goal.
    const synthetic = {
      events: [
        {
          date: '2026-06-20T18:00Z',
          competitions: [
            {
              status: { type: { name: 'STATUS_FULL_TIME' } },
              competitors: [
                { team: { id: '1', displayName: 'Brazil' }, score: '2' },
                { team: { id: '2', displayName: 'France' }, score: '1' },
              ],
              details: [
                { type: { text: 'Goal - Penalty' }, clock: { displayValue: "90'+2'" }, scoringPlay: true, penaltyKick: true, team: { id: '1' }, athletesInvolved: [{ displayName: 'Neymar' }] },
                // Own goal as ESPN can emit it: type.text only, no scoringPlay flag.
                { type: { text: 'Own Goal' }, clock: { displayValue: "55'" }, ownGoal: true, team: { id: '1' }, athletesInvolved: [{ displayName: 'Some Defender' }] },
                { type: { text: 'Yellow Card' }, clock: { displayValue: "30'" }, scoringPlay: false, team: { id: '2' }, athletesInvolved: [{ displayName: 'Carded Guy' }] },
              ],
            },
          ],
        },
      ],
    };
    const a = new EspnAdapter('x', async () => synthetic as never);
    const overlay = await a.fetchOverlay();
    const byKey = overlay.get(fixtureKey('2026-06-20', 'Brazil', 'France'))!.goalsByTeamKey;

    // Brazil keeps its real goal (Neymar's penalty); card ignored.
    const brazil = byKey[teamKey('Brazil')];
    expect(brazil).toHaveLength(1);
    expect(brazil[0]).toMatchObject({ name: 'Neymar', minute: 90, offset: 2, penalty: true });

    // ESPN credited the own goal to Brazil (beneficiary); we re-attribute it to
    // the conceding team (France) with owngoal:true. Caught despite no scoringPlay.
    const france = byKey[teamKey('France')];
    expect(france).toHaveLength(1);
    expect(france[0]).toMatchObject({ name: 'Some Defender', minute: 55, owngoal: true });
  });
});
