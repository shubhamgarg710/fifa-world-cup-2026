import { Lock } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import type { Picks } from '@/data/league/types';
import type { Group } from '@/logic/groups';
import { isReachR32Complete } from '@/logic/leagueScore';
import { SurvivorsRecap, ValueLine, RecapSection } from './Recap';

/** Read-only pre-tournament summary after lock (manual or deadline). */
export function LockedSummary({
  picks,
  groups,
  matches,
  manuallyLocked,
  joinedAfter,
  deadlinePassed,
}: {
  picks: Picks;
  groups: Group[];
  matches: Match[];
  manuallyLocked: boolean;
  joinedAfter: boolean;
  deadlinePassed: boolean;
}) {
  const banner = joinedAfter
    ? 'This closed before you joined — it scores 0 for you.'
    : manuallyLocked
      ? 'You locked these predictions — final.'
      : deadlinePassed
        ? 'Picks locked — the deadline passed.'
        : 'Pre-tournament picks locked.';

  return (
    <div className="flex flex-col gap-4">
      <p className="inline-flex items-center gap-2 self-start rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gold">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Locked
      </p>
      <p className="text-sm text-slate-400">{banner}</p>

      <RecapSection title="Going home">
        {!isReachR32Complete(picks) && picks.reachR32.length > 0 && (
          <p className="mb-2 text-xs text-amber-300">Incomplete set — survivors scored 0 (not exactly 16 eliminated).</p>
        )}
        <SurvivorsRecap picks={picks} groups={groups} matches={matches} showStatus />
      </RecapSection>
      <RecapSection title="Winner">
        <ValueLine value={picks.winner} flag />
      </RecapSection>
      <RecapSection title="Golden Boot">
        <ValueLine value={picks.goldenBoot} />
      </RecapSection>
      <RecapSection title="Golden Ball">
        <ValueLine value={picks.goldenBall} />
      </RecapSection>
    </div>
  );
}
