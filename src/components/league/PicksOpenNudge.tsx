import { useMemo, useState } from 'react';
import { Target, X } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import type { StageKey } from '@/data/league/types';
import { openKnockoutStages, stageDef, stageDeadlineUTC } from '@/logic/leagueStages';
import { relativeCountdown } from '@/logic/time';

function readSeen(key: string): StageKey[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as StageKey[]) : [];
  } catch {
    return [];
  }
}

/**
 * "Picks are open — start picking" nudge, shown once per knockout stage as its
 * window opens. Dismissal is remembered per league + member (same last-seen
 * localStorage pattern as WhatChanged).
 */
export function PicksOpenNudge({ code, meId, matches }: { code: string; meId: string; matches: Match[] }) {
  const key = `wc26.picksOpenSeen.${code}.${meId}`;
  const now = new Date();
  const [seen, setSeen] = useState<StageKey[]>(() => readSeen(key));

  // Soonest-locking open stage the member hasn't acknowledged yet.
  const stage = useMemo<StageKey | null>(() => {
    const open = openKnockoutStages(matches, now).filter((s) => !seen.includes(s));
    if (open.length === 0) return null;
    return open.sort((a, b) => {
      const da = stageDeadlineUTC(a, matches) ?? '';
      const db = stageDeadlineUTC(b, matches) ?? '';
      return da < db ? -1 : 1;
    })[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, seen]);

  if (!stage) return null;

  const deadline = stageDeadlineUTC(stage, matches);
  const countdown = deadline ? relativeCountdown(deadline, now) : null;

  const dismiss = () => {
    const open = openKnockoutStages(matches, now);
    const next = [...new Set([...seen, ...open])];
    setSeen(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent px-4 py-3">
      <Target className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-display font-semibold uppercase tracking-wide text-gold">
          {stageDef(stage).label} picks are open
        </p>
        <p className="mt-0.5 text-slate-200">
          {countdown ? `Lock in your teams — closes ${countdown}.` : 'Lock in your teams in the My picks tab.'}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
