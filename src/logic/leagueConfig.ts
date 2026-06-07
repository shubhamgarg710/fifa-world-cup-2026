/**
 * Tunable league scoring. Compounded so deep calls matter more than the
 * (largely obvious) group-stage ones — nailing the winner can rescue a
 * mediocre group stage. Mirror of the `VERDICT` config pattern.
 */
export const LEAGUE_SCORING = {
  reachR32: 2, //  ×32 max = 64
  reachR16: 5, //  ×16 max = 80
  reachQF: 10, //  × 8 max = 80
  reachSF: 20, //  × 4 max = 80
  reachFinal: 40, // × 2 max = 80
  winner: 100,
  goldenBoot: 50,
  goldenBall: 50,
} as const;

export type LeagueScoringConfig = typeof LEAGUE_SCORING;
