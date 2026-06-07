import awardsFile from './awards.json';
import candidatesFile from './awardCandidates.json';
import type { Awards } from '@/logic/leagueScore';

export const AWARDS: Awards = {
  goldenBall: (awardsFile as { goldenBall: string | null }).goldenBall,
};

export type AwardCandidate = { name: string; team: string };

const candidates = candidatesFile as {
  goldenBoot: AwardCandidate[];
  goldenBall: AwardCandidate[];
};

export const goldenBootCandidates: AwardCandidate[] = candidates.goldenBoot;
export const goldenBallCandidates: AwardCandidate[] = candidates.goldenBall;

/**
 * Keep only candidates whose team is actually in the qualified pool. The JSON
 * is speculative and edited by hand — this makes the picker self-correcting if
 * a country drops out or a name is mistyped. `pool` comes from
 * `leaguePool(matches)` so the source of truth is always the live fixtures.
 */
export function filterCandidatesToPool(list: AwardCandidate[], pool: string[]): AwardCandidate[] {
  const inPool = new Set(pool);
  return list.filter((c) => inPool.has(c.team));
}
