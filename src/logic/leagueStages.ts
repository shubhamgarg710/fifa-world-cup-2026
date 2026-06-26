/**
 * Bridge from `Match[]` (openfootball) to league stages.
 *
 * Stage model (all picks are "who advances"):
 *   reachR32  — predict the 32 group survivors. Pre-tournament; pool = 48 group
 *               teams; deadline = earliest kickoff overall (Jun 11). Always open.
 *   reachR16  — predict the 16 teams that win their Round-of-32 tie. Pool +
 *               deadline come from the "Round of 32" round; opens progressively
 *               as those fixtures carry real team names (pick the matchups that
 *               are already known without waiting for the whole bracket), and
 *               locks 24h past the round's first kickoff (KNOCKOUT_GRACE_MS).
 *   reachQF   — from "Round of 16".
 *   reachSF   — from "Quarter-final".
 *   reachFinal— from "Semi-final".
 *
 * Scoring derives the ACTUAL advancers from the round whose participants the
 * pick predicts: reachR32 → teams in "Round of 32", reachR16 → "Round of 16",
 * reachQF → "Quarter-final", reachSF → "Semi-final", reachFinal → "Final".
 */
import type { Match } from '@/data/sources/types';
import { isPlaceholderTeam } from '@/data/static/placeholders';
import type { StageKey } from '@/data/league/types';

/** Round-name constants exactly as openfootball labels them. */
export const ROUND = {
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-final',
  SF: 'Semi-final',
  FINAL: 'Final',
} as const;

/**
 * Pre-tournament picks (group survivors + winner + boot + ball) stay editable
 * through the end of June 14 — a 3-day grace window past the June 11 opener so
 * latecomers can still enter. Anchored to 23:59:59 IST (the league owner's tz),
 * which reads as "June 14" for IST and all Western time zones. Knockout stages
 * lock at their own kickoffs.
 */
export const PRE_TOURNAMENT_LOCK_UTC = '2026-06-14T18:29:59Z';

/**
 * Grace past a knockout round's first kickoff before its pick locks. Mirrors the
 * pre-tournament grace philosophy: the round's first matches will have finished
 * inside this window (so a few advancers are already known when picked) — an
 * accepted trade-off to give people more than the otherwise sub-day window.
 */
export const KNOCKOUT_GRACE_MS = 24 * 60 * 60 * 1000;

export type StageDef = {
  key: StageKey;
  label: string;
  /** How many teams the member picks at this stage. */
  pick: number;
  /** Pre-tournament stages lock at the first overall kickoff and are always open. */
  preTournament: boolean;
  /** Round whose fixtures supply this stage's candidate pool + deadline. null = pre-tournament (pool is the 48). */
  poolRound: string | null;
  /** Round whose real participants are the correct answers when scoring this stage. */
  actualRound: string;
};

// Knockout stages are labelled by the round whose ties you're picking (the
// `poolRound` shown in the matchwise UI), not the round teams advance into. So
// `reachR16` (predict winners of the Round-of-32 ties) reads "Round of 32".
export const STAGE_DEFS: StageDef[] = [
  { key: 'reachR32', label: 'Group survivors', pick: 32, preTournament: true, poolRound: null, actualRound: ROUND.R32 },
  { key: 'reachR16', label: 'Round of 32', pick: 16, preTournament: false, poolRound: ROUND.R32, actualRound: ROUND.R16 },
  { key: 'reachQF', label: 'Round of 16', pick: 8, preTournament: false, poolRound: ROUND.R16, actualRound: ROUND.QF },
  { key: 'reachSF', label: 'Quarter-finals', pick: 4, preTournament: false, poolRound: ROUND.QF, actualRound: ROUND.SF },
  { key: 'reachFinal', label: 'Semi-finals', pick: 2, preTournament: false, poolRound: ROUND.SF, actualRound: ROUND.FINAL },
];

export function stageDef(key: StageKey): StageDef {
  const d = STAGE_DEFS.find((s) => s.key === key);
  if (!d) throw new Error(`Unknown stage: ${key}`);
  return d;
}

const matchesInRound = (matches: Match[], round: string) => matches.filter((m) => m.round === round);

/** Distinct real (non-placeholder) team names appearing in a round's fixtures. */
export function realTeamsInRound(matches: Match[], round: string): string[] {
  const set = new Set<string>();
  for (const m of matchesInRound(matches, round)) {
    if (!isPlaceholderTeam(m.team1)) set.add(m.team1);
    if (!isPlaceholderTeam(m.team2)) set.add(m.team2);
  }
  return [...set];
}

/** A round's participants are "officially known" when no fixture has a placeholder. */
export function roundParticipantsKnown(matches: Match[], round: string): boolean {
  const inRound = matchesInRound(matches, round);
  if (inRound.length === 0) return false;
  return inRound.every((m) => !isPlaceholderTeam(m.team1) && !isPlaceholderTeam(m.team2));
}

/** The 48 teams that appear in group-stage matches (authoritative pool). */
export function leaguePool(matches: Match[]): string[] {
  const set = new Set<string>();
  for (const m of matches) {
    if (!m.group) continue;
    if (!isPlaceholderTeam(m.team1)) set.add(m.team1);
    if (!isPlaceholderTeam(m.team2)) set.add(m.team2);
  }
  return [...set].sort();
}

/**
 * Candidate teams a member chooses from for a stage. Grows progressively: as
 * pool-round fixtures resolve to real teams, they appear here (the whole bracket
 * need not be known). Empty until the first matchup is determined.
 */
export function stagePool(stage: StageKey, matches: Match[]): string[] {
  const def = stageDef(stage);
  if (def.poolRound === null) return leaguePool(matches);
  return realTeamsInRound(matches, def.poolRound).sort();
}

/** One pool-round tie with both teams resolved: "team1 vs team2 — who advances?". */
export type StageMatchup = { team1: string; team2: string; kickoffUTC: string };

/**
 * The determined ties of a stage's pool round — fixtures where *both* teams are
 * real (placeholder-free) — sorted by kickoff. Grows as the bracket resolves.
 */
export function stageMatchups(stage: StageKey, matches: Match[]): StageMatchup[] {
  const def = stageDef(stage);
  if (def.poolRound === null) return [];
  return matchesInRound(matches, def.poolRound)
    .filter((m) => !isPlaceholderTeam(m.team1) && !isPlaceholderTeam(m.team2))
    .map((m) => ({ team1: m.team1, team2: m.team2, kickoffUTC: m.kickoffUTC }))
    .sort((a, b) => (a.kickoffUTC < b.kickoffUTC ? -1 : 1));
}

/** A stage is open for editing once at least one of its ties is fully determined. */
export function stageOpen(stage: StageKey, matches: Match[]): boolean {
  const def = stageDef(stage);
  if (def.preTournament) return true;
  return def.poolRound !== null && stageMatchups(stage, matches).length > 0;
}

const minKickoff = (ms: Match[]): string | null => {
  let best: string | null = null;
  for (const m of ms) if (best === null || m.kickoffUTC < best) best = m.kickoffUTC;
  return best;
};

/**
 * Deadline = the first kickoff of the round you're predicting *into*, plus a
 * one-day grace (KNOCKOUT_GRACE_MS). Pre-tournament → fixed grace deadline.
 * null if unknown (round not yet scheduled).
 */
export function stageDeadlineUTC(stage: StageKey, matches: Match[]): string | null {
  const def = stageDef(stage);
  // Pre-tournament picks get a fixed grace deadline (3 days past the opener) so
  // latecomers can still enter — see PRE_TOURNAMENT_LOCK_UTC. Note: group games
  // begin June 11, so edits on the 12th–14th see partial results (accepted).
  if (def.preTournament) return PRE_TOURNAMENT_LOCK_UTC;
  // Predicting reachR16 means predicting Round-of-32 winners. Lock 24h past the
  // first R32 kickoff (grace), accepting that the round's earliest results show.
  const first = minKickoff(matchesInRound(matches, def.poolRound!));
  return first ? new Date(new Date(first).getTime() + KNOCKOUT_GRACE_MS).toISOString() : null;
}

export function stageLocked(stage: StageKey, matches: Match[], now: Date): boolean {
  const deadline = stageDeadlineUTC(stage, matches);
  if (!deadline) return false; // not scheduled yet → not locked
  return now.getTime() >= new Date(deadline).getTime();
}

export type StageStatus = 'editable' | 'locked' | 'pending';

/**
 * - editable: open for picks and deadline not passed
 * - locked:   deadline passed (picks frozen / scored)
 * - pending:  participants not yet known (can't pick)
 */
export function stageStatus(stage: StageKey, matches: Match[], now: Date): StageStatus {
  if (stageLocked(stage, matches, now)) return 'locked';
  if (!stageOpen(stage, matches)) return 'pending';
  return 'editable';
}

/** The next stage that will lock (soonest future deadline), or null if none. */
export function nextLock(matches: Match[], now: Date): { stage: StageKey; deadlineUTC: string } | null {
  let best: { stage: StageKey; deadlineUTC: string } | null = null;
  for (const def of STAGE_DEFS) {
    const deadline = stageDeadlineUTC(def.key, matches);
    if (!deadline) continue;
    if (new Date(deadline).getTime() <= now.getTime()) continue; // already locked
    if (!best || deadline < best.deadlineUTC) best = { stage: def.key, deadlineUTC: deadline };
  }
  return best;
}

/** Knockout (non-pre-tournament) stages currently open for editing. */
export function openKnockoutStages(matches: Match[], now: Date): StageKey[] {
  return STAGE_DEFS.filter(
    (d) => !d.preTournament && stageStatus(d.key, matches, now) === 'editable',
  ).map((d) => d.key);
}

/**
 * Is a team still able to win? Out if the final is decided against them, or if
 * the deepest round with known participants doesn't include them. Alive while
 * still undetermined (e.g. group stage in progress).
 */
export function teamStillAlive(team: string, matches: Match[]): boolean {
  const champ = champion(matches);
  if (champ) return champ === team;
  const deepestFirst = [ROUND.FINAL, ROUND.SF, ROUND.QF, ROUND.R16, ROUND.R32];
  for (const round of deepestFirst) {
    if (roundParticipantsKnown(matches, round)) {
      return realTeamsInRound(matches, round).includes(team);
    }
  }
  return true; // no knockout round resolved yet
}

/** Resolve the actual tournament winner from the Final match's score. */
export function champion(matches: Match[]): string | null {
  const final = matchesInRound(matches, ROUND.FINAL).find((m) => m.score);
  if (!final || !final.score) return null;
  const s = final.score;
  const pick = (a: number, b: number) => (a === b ? null : a > b ? final.team1 : final.team2);
  if (s.p) return pick(s.p[0], s.p[1]);
  if (s.et) return pick(s.et[0], s.et[1]);
  return pick(s.ft[0], s.ft[1]);
}
