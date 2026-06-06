/**
 * Pure scoring/verdict functions. Everything in this file is deterministic and
 * takes data in / returns data out — no I/O, no DOM, no time. The test file is
 * the spec.
 */

import type { GoalEntry, Match, Score } from '@/data/sources/types';
import { VERDICT, VerdictConfig } from './config';

export type Label = 'must-watch' | 'worth-a-look' | 'skip';
export type Tier = 'must-watch' | 'high' | 'normal';

export type PrematchResult = {
  score: number;
  tier: Tier;
  reasons: string[];
};

export type PostmatchResult = {
  label: Label;
  /** Headline reason (first strong, else first mild, else null). */
  headline: string | null;
  reasons: { strong: string[]; mild: string[] };
};

export type RankingLookup = (team: string) => number | undefined;

// -- round helpers ---------------------------------------------------------

const KNOCKOUT_PATTERNS = [
  /round of \d+/i,
  /quarter/i,
  /semi/i,
  /final/i,
  /third place/i,
  /play-off/i,
];

export const isKnockout = (round: string): boolean =>
  KNOCKOUT_PATTERNS.some((re) => re.test(round));

// -- my-team ---------------------------------------------------------------

export type MyTeams = { support: string[]; follow: string[] };

export const myTeamsList = (mt: MyTeams): string[] => [...mt.support, ...mt.follow];

export function isMyTeamMatch(match: Pick<Match, 'team1' | 'team2'>, myTeams: MyTeams): boolean {
  const set = new Set(myTeamsList(myTeams));
  return set.has(match.team1) || set.has(match.team2);
}

// -- winner resolution -----------------------------------------------------

type Side = 'team1' | 'team2' | 'draw';

/** Who actually won (after pens/ET if applicable); "draw" if regulation was a draw and no extras. */
function winnerOf(score: Score): Side {
  if (score.p) return score.p[0] > score.p[1] ? 'team1' : 'team2';
  if (score.et) {
    if (score.et[0] !== score.et[1]) return score.et[0] > score.et[1] ? 'team1' : 'team2';
  }
  if (score.ft[0] === score.ft[1]) return 'draw';
  return score.ft[0] > score.ft[1] ? 'team1' : 'team2';
}

// -- detectors -------------------------------------------------------------

export function detectUpset(
  match: Match,
  rank: RankingLookup,
  cfg: VerdictConfig = VERDICT,
): { tier: 'strong' | 'mild' | null; reason: string | null; gap: number } {
  if (!match.score) return { tier: null, reason: null, gap: 0 };
  const winner = winnerOf(match.score);
  if (winner === 'draw') return { tier: null, reason: null, gap: 0 };
  const winName = winner === 'team1' ? match.team1 : match.team2;
  const loseName = winner === 'team1' ? match.team2 : match.team1;
  const winRank = rank(winName);
  const loseRank = rank(loseName);
  if (winRank == null || loseRank == null) return { tier: null, reason: null, gap: 0 };
  // Lower-ranked = bigger rank number. Gap > 0 means underdog won.
  const gap = winRank - loseRank;
  if (gap < cfg.upsetMinRankGap) return { tier: null, reason: null, gap };
  if (gap >= cfg.upsetStrongRankGap) {
    return { tier: 'strong', reason: 'big upset', gap };
  }
  // Mid-range upset: mild by default, promoted to strong in knockouts.
  if (isKnockout(match.round)) return { tier: 'strong', reason: 'knockout upset', gap };
  return { tier: 'mild', reason: 'upset', gap };
}

export function detectGoalFest(
  score: Score,
  cfg: VerdictConfig = VERDICT,
): { triggered: boolean; reason: string; total: number } {
  const total = score.ft[0] + score.ft[1];
  return { triggered: total >= cfg.goalFestMinTotal, reason: `${total}-goal thriller`, total };
}

/**
 * Build a chronological timeline of regulation goals (minute <= 90, including
 * stoppage shown via `offset`). An entry from `goals1` with `owngoal: true`
 * counts for team2 — and vice versa. The running tally must reflect who
 * actually benefited.
 */
function regulationTimeline(
  goals1: GoalEntry[] | undefined,
  goals2: GoalEntry[] | undefined,
): { totalMinute: number; for: 'team1' | 'team2' }[] {
  const all: { totalMinute: number; for: 'team1' | 'team2' }[] = [];
  for (const g of goals1 ?? []) {
    const total = g.minute + (g.offset ?? 0);
    if (g.minute > 90) continue; // skip ET
    all.push({ totalMinute: total, for: g.owngoal ? 'team2' : 'team1' });
  }
  for (const g of goals2 ?? []) {
    const total = g.minute + (g.offset ?? 0);
    if (g.minute > 90) continue;
    all.push({ totalMinute: total, for: g.owngoal ? 'team1' : 'team2' });
  }
  all.sort((a, b) => a.totalMinute - b.totalMinute);
  return all;
}

export function detectLateDrama(
  match: Match,
  cfg: VerdictConfig = VERDICT,
): { triggered: boolean; reason: string | null } {
  const timeline = regulationTimeline(match.goals1, match.goals2);
  let t1 = 0;
  let t2 = 0;
  for (const ev of timeline) {
    const beforeT1 = t1;
    const beforeT2 = t2;
    if (ev.for === 'team1') t1++;
    else t2++;
    if (ev.totalMinute < cfg.lateDramaMinuteFrom) continue;
    const wasTied = beforeT1 === beforeT2;
    const nowTied = t1 === t2;
    const leaderBefore = beforeT1 === beforeT2 ? null : beforeT1 > beforeT2 ? 'team1' : 'team2';
    const leaderAfter = t1 === t2 ? null : t1 > t2 ? 'team1' : 'team2';
    if (wasTied && !nowTied) return { triggered: true, reason: 'late winner' };
    if (!wasTied && nowTied) return { triggered: true, reason: 'late equalizer' };
    if (!wasTied && !nowTied && leaderBefore !== leaderAfter) {
      return { triggered: true, reason: 'late winner' };
    }
  }
  return { triggered: false, reason: null };
}

export function detectKnockoutTension(score: Score): { triggered: boolean; reason: string | null } {
  if (score.p) return { triggered: true, reason: 'went to penalties' };
  if (score.et) return { triggered: true, reason: 'extra time' };
  return { triggered: false, reason: null };
}

export function detectTopNationClash(
  match: Match,
  rank: RankingLookup,
  cfg: VerdictConfig = VERDICT,
): boolean {
  const r1 = rank(match.team1);
  const r2 = rank(match.team2);
  if (r1 == null || r2 == null) return false;
  return r1 <= cfg.topNationRank && r2 <= cfg.topNationRank;
}

export function detectKnockoutMatch(round: string): boolean {
  return isKnockout(round);
}

// -- pre-match -------------------------------------------------------------

export function prematchWatchability(
  match: Match,
  myTeams: MyTeams,
  rank: RankingLookup,
  cfg: VerdictConfig = VERDICT,
): PrematchResult {
  const reasons: string[] = [];
  let score = 0;
  let tier: Tier = 'normal';

  if (isMyTeamMatch(match, myTeams)) {
    reasons.push('your team');
    score += 100;
    tier = 'must-watch';
  }
  if (detectTopNationClash(match, rank, cfg)) {
    reasons.push('top-nation clash');
    score += 40;
    if (tier === 'normal') tier = 'high';
  }
  const knockout = isKnockout(match.round);
  if (knockout) {
    reasons.push('knockout');
    score += 30;
    if (tier === 'normal') tier = 'high';
  }
  if (match.finalGroupMatchday) {
    reasons.push('final group match');
    score += 20;
    if (tier === 'normal') tier = 'high';
  }
  return { score, tier, reasons };
}

// -- post-match ------------------------------------------------------------

export function postmatchVerdict(
  match: Match,
  myTeams: MyTeams,
  rank: RankingLookup,
  cfg: VerdictConfig = VERDICT,
): PostmatchResult {
  const strong: string[] = [];
  const mild: string[] = [];

  if (!match.score) {
    return { label: 'skip', headline: null, reasons: { strong, mild } };
  }

  // 1. my team always wins (overrides everything)
  if (isMyTeamMatch(match, myTeams)) {
    strong.push('your team');
  }

  // 2. upset
  const upset = detectUpset(match, rank, cfg);
  if (upset.tier === 'strong' && upset.reason) strong.push(upset.reason);
  else if (upset.tier === 'mild' && upset.reason) mild.push(upset.reason);

  // 3. goal fest
  const fest = detectGoalFest(match.score, cfg);
  if (fest.triggered) strong.push(fest.reason);

  // 4. late drama
  const late = detectLateDrama(match, cfg);
  if (late.triggered && late.reason) strong.push(late.reason);

  // 5. knockout tension
  const kn = detectKnockoutTension(match.score);
  if (kn.triggered && kn.reason) strong.push(kn.reason);

  // 6. top-nation clash (mild)
  if (detectTopNationClash(match, rank, cfg)) mild.push('top-nation clash');

  // 7. knockout match (mild)
  if (detectKnockoutMatch(match.round) && !strong.some((s) => s === 'knockout upset')) {
    mild.push('knockout');
  }

  const label: Label = strong.length > 0 ? 'must-watch' : mild.length > 0 ? 'worth-a-look' : 'skip';
  const headline = strong[0] ?? mild[0] ?? null;
  return { label, headline, reasons: { strong, mild } };
}
