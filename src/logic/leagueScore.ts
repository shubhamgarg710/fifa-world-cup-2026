/**
 * Pure league scoring over picks + openfootball results + bundled awards.
 * No I/O, no time. Mirrors the verdict.ts pure-function pattern.
 */
import type { Match } from '@/data/sources/types';
import type { Member, Picks, StageKey } from '@/data/league/types';
import { LEAGUE_SCORING, type LeagueScoringConfig } from './leagueConfig';
import { topScorers } from './goldenBoot';
import { champion, realTeamsInRound, roundParticipantsKnown, STAGE_DEFS, stageDef } from './leagueStages';

export type Awards = { goldenBall: string | null };

const STAGE_POINTS: Record<StageKey, keyof LeagueScoringConfig> = {
  reachR32: 'reachR32',
  reachR16: 'reachR16',
  reachQF: 'reachQF',
  reachSF: 'reachSF',
  reachFinal: 'reachFinal',
};

/** Depth weight for the tiebreaker — deeper round hits break ties first. */
const STAGE_DEPTH: Record<StageKey, number> = {
  reachR32: 1,
  reachR16: 2,
  reachQF: 3,
  reachSF: 4,
  reachFinal: 5,
};

export type Breakdown = {
  stages: { key: StageKey; hits: number; points: number }[];
  winner: number;
  goldenBoot: number;
  goldenBall: number;
  /** Count of correct picks weighted toward deep rounds — used for tiebreak. */
  deepWeight: number;
};

export type ScoredMember = {
  member: Member;
  total: number;
  breakdown: Breakdown;
};

/** How many of a member's picked teams actually reached the target round. */
function stageHits(picks: string[], actual: Set<string>): number {
  let n = 0;
  for (const t of picks) if (actual.has(t)) n++;
  return n;
}

export function scoreMember(
  picks: Picks,
  matches: Match[],
  awards: Awards,
  cfg: LeagueScoringConfig = LEAGUE_SCORING,
): { total: number; breakdown: Breakdown } {
  const stages: Breakdown['stages'] = [];
  let total = 0;
  let deepWeight = 0;

  for (const def of STAGE_DEFS) {
    const actual = new Set(realTeamsInRound(matches, def.actualRound));
    const hits = actual.size === 0 ? 0 : stageHits(picks[def.key], actual);
    const points = hits * cfg[STAGE_POINTS[def.key]];
    stages.push({ key: def.key, hits, points });
    total += points;
    // Tiebreak weight is independent of the points scale: deeper round hits
    // (e.g. a correct finalist) outrank shallow ones when totals are equal.
    deepWeight += hits * STAGE_DEPTH[def.key];
  }

  const champ = champion(matches);
  const winner = champ && picks.winner === champ ? cfg.winner : 0;
  total += winner;

  const boot = topScorers(matches);
  const goldenBoot = picks.goldenBoot && boot.names.includes(picks.goldenBoot) ? cfg.goldenBoot : 0;
  total += goldenBoot;

  const goldenBall = awards.goldenBall && picks.goldenBall === awards.goldenBall ? cfg.goldenBall : 0;
  total += goldenBall;

  return { total, breakdown: { stages, winner, goldenBoot, goldenBall, deepWeight } };
}

export type PickStatus = 'alive' | 'busted' | 'correct';

/**
 * Status of one predicted-advancer team for the "my bracket" view.
 * - correct: the team appears in the target round's real fixtures.
 * - busted:  that round's participants are known and the team is absent.
 * - alive:   not yet determined.
 */
export function pickStatus(team: string, stage: StageKey, matches: Match[]): PickStatus {
  const def = stageDef(stage);
  const known = roundParticipantsKnown(matches, def.actualRound);
  const actual = new Set(realTeamsInRound(matches, def.actualRound));
  if (actual.has(team)) return 'correct';
  if (known) return 'busted';
  return 'alive';
}

/**
 * Leaderboard. Tiebreaker: total desc → deepWeight desc → earliest created_at.
 */
export function rankMembers(
  members: Member[],
  matches: Match[],
  awards: Awards,
  cfg: LeagueScoringConfig = LEAGUE_SCORING,
): ScoredMember[] {
  return members
    .map((member) => {
      const { total, breakdown } = scoreMember(member.picks, matches, awards, cfg);
      return { member, total, breakdown };
    })
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.breakdown.deepWeight !== a.breakdown.deepWeight) {
        return b.breakdown.deepWeight - a.breakdown.deepWeight;
      }
      return a.member.created_at.localeCompare(b.member.created_at);
    });
}
