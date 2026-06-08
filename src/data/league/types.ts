/** Prediction-league domain types. */

export type StageKey = 'reachR32' | 'reachR16' | 'reachQF' | 'reachSF' | 'reachFinal';

/**
 * A member's predictions. Advancement picks are arrays of team-name strings
 * (modeled uniformly as "who advances"). Award picks are player-name strings.
 */
export type Picks = {
  reachR32: string[]; // 32 group survivors
  reachR16: string[]; // 16 (predicted Round-of-32 winners)
  reachQF: string[]; //  8
  reachSF: string[]; //  4
  reachFinal: string[]; // 2
  winner: string | null;
  goldenBoot: string | null; // player name
  goldenBall: string | null; // player name
  /** Stages the member has manually locked (final, irreversible). */
  lockedStages: StageKey[];
};

const ALL_STAGES: StageKey[] = ['reachR32', 'reachR16', 'reachQF', 'reachSF', 'reachFinal'];

export const EMPTY_PICKS: Picks = {
  reachR32: [],
  reachR16: [],
  reachQF: [],
  reachSF: [],
  reachFinal: [],
  winner: null,
  goldenBoot: null,
  goldenBall: null,
  lockedStages: [],
};

export type League = {
  code: string;
  name: string;
  created_at: string;
};

export type Member = {
  id: string;
  league_code: string;
  display_name: string;
  picks: Picks;
  created_at: string;
};

/** Coerce an arbitrary jsonb blob into a complete Picks object. */
export function normalizePicks(raw: unknown): Picks {
  const r = (raw ?? {}) as Partial<Record<keyof Picks, unknown>>;
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
  return {
    reachR32: arr(r.reachR32),
    reachR16: arr(r.reachR16),
    reachQF: arr(r.reachQF),
    reachSF: arr(r.reachSF),
    reachFinal: arr(r.reachFinal),
    winner: str(r.winner),
    goldenBoot: str(r.goldenBoot),
    goldenBall: str(r.goldenBall),
    lockedStages: Array.isArray(r.lockedStages)
      ? (r.lockedStages.filter((s): s is StageKey => typeof s === 'string' && (ALL_STAGES as string[]).includes(s)))
      : [],
  };
}
