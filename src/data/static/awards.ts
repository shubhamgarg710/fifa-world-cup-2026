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
