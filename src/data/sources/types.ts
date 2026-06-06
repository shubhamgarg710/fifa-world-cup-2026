/**
 * Single source of truth for match data shape.
 * The app talks to MatchDataSource only — never to a fetcher directly.
 */

export type MatchStatus = 'scheduled' | 'finished' | 'result_pending';

export type GoalEntry = {
  name: string;
  minute: number;
  /** Stoppage-time minutes; display as `${minute}+${offset}'`. */
  offset?: number;
  penalty?: boolean;
  owngoal?: boolean;
};

export type Score = {
  ft: [number, number];
  ht?: [number, number];
  /** Present iff extra time was played. */
  et?: [number, number];
  /** Present iff penalties were taken. */
  p?: [number, number];
};

export type Match = {
  /** Stable id: `${date}__${slug(team1)}__${slug(team2)}`. */
  id: string;
  round: string;
  group?: string;
  /** ISO UTC instant derived from openfootball's `date + time + offset`. */
  kickoffUTC: string;
  ground: string;
  team1: string;
  team2: string;
  status: MatchStatus;
  score?: Score;
  goals1?: GoalEntry[];
  goals2?: GoalEntry[];
  /**
   * Final matchday for this match's group (computed at adapter time).
   * Pre-match watchability uses this for "high stakes" without standings math.
   */
  finalGroupMatchday?: boolean;
};

export type DateRange = { fromUTC: string; toUTC: string };

export interface MatchDataSource {
  /** All matches whose kickoff falls in [fromUTC, toUTC]. */
  listMatches(range: DateRange): Promise<Match[]>;
  /** Full match details by id. */
  getMatch(id: string): Promise<Match>;
  /** All matches in the tournament — useful for "next match day" lookups. */
  listAll(): Promise<Match[]>;
}

/** lowercase, non-alphanumeric → `-`, collapsed. */
export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function matchId(date: string, team1: string, team2: string): string {
  return `${date}__${slug(team1)}__${slug(team2)}`;
}
