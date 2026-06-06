/**
 * Tunable verdict thresholds. Everything is in one place by design — the user
 * adjusts these by editing this file, no code changes required.
 */
export const VERDICT = {
  /** Both teams ranked at or above this number → "top-nation clash". */
  topNationRank: 12,
  /** Combined goals at or above this → "goal fest". */
  goalFestMinTotal: 4,
  /** Goals at this minute or later count as "late". */
  lateDramaMinuteFrom: 85,
  /** Rank gap below this is statistical noise, not an upset. */
  upsetMinRankGap: 10,
  /** Rank gap at or above this is a strong upset by itself. */
  upsetStrongRankGap: 25,
} as const;

export type VerdictConfig = typeof VERDICT;
