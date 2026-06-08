import { useState } from 'react';
import { CalendarClock, Loader2, Lock } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import type { Picks } from '@/data/league/types';
import type { Group } from '@/logic/groups';
import { stageDeadlineUTC } from '@/logic/leagueStages';
import { formatLocalDateLabel, formatLocalKickoff } from '@/logic/time';
import { ScoringInfo } from '../ScoringInfo';
import { SurvivorsRecap, ValueLine, RecapSection } from './Recap';

/** Pre-tournament review: full summary, inline edit, and the lone Lock action. */
export function PicksReview({
  picks,
  groups,
  matches,
  onEdit,
  onLock,
  locking,
}: {
  picks: Picks;
  groups: Group[];
  matches: Match[];
  onEdit: (step: 0 | 1 | 2 | 3) => void;
  onLock: () => void;
  locking: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const deadline = stageDeadlineUTC('reachR32', matches);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-50 leading-none">
          Your picks
        </h2>
        <p className="mt-1 text-sm text-slate-400">Review everything, then lock it in.</p>
      </div>

      <RecapSection title="Going home" onEdit={() => onEdit(0)}>
        <SurvivorsRecap picks={picks} groups={groups} matches={matches} />
      </RecapSection>
      <RecapSection title="Winner" onEdit={() => onEdit(1)}>
        <ValueLine value={picks.winner} flag />
      </RecapSection>
      <RecapSection title="Golden Boot" onEdit={() => onEdit(2)}>
        <ValueLine value={picks.goldenBoot} />
      </RecapSection>
      <RecapSection title="Golden Ball" onEdit={() => onEdit(3)}>
        <ValueLine value={picks.goldenBall} />
      </RecapSection>

      {deadline && (
        <p className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
          <CalendarClock className="h-3.5 w-3.5 text-gold" aria-hidden />
          Auto-locks {formatLocalDateLabel(deadline)} · {formatLocalKickoff(deadline)} if you don't lock first.
        </p>
      )}

      <ScoringInfo />

      {confirming ? (
        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <p className="mb-3 text-sm text-slate-200">Once locked, your picks can't be changed. Lock now?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onLock}
              disabled={locking}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-slate-950 transition-colors hover:bg-gold/90 active:scale-[0.98] disabled:opacity-60"
            >
              {locking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
              Lock now
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={locking}
              className="cursor-pointer rounded-full border border-slate-700 bg-slate-900 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-verdict-must px-5 py-3.5 font-display text-base font-bold uppercase tracking-wider text-white shadow-lg transition-colors hover:bg-verdict-must/90 active:scale-[0.98]"
        >
          <Lock className="h-5 w-5" aria-hidden /> Lock my picks
        </button>
      )}
    </div>
  );
}
