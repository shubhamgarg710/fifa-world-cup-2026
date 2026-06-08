import type { Group } from '@/logic/groups';
import { ELIMINATE_TARGET, eliminationValidity } from '@/logic/survivors';
import { GroupEliminationCard } from './GroupEliminationCard';
import { cn } from '../../cn';

/** Step 1: pick who's going home — 1–2 per group, exactly 16 total. */
export function SurvivorsStep({
  groups,
  eliminated,
  onToggle,
}: {
  groups: Group[];
  eliminated: Set<string>;
  onToggle: (team: string) => void;
}) {
  const v = eliminationValidity(eliminated, groups);
  const frozenSafe = v.total >= ELIMINATE_TARGET;
  const pct = Math.min(100, (v.total / ELIMINATE_TARGET) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-50 leading-none">
          Who's going home?
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Send home 1 or 2 from every group — 16 total. The 4 groups you double up are the ones you
          think only send 2 through.
        </p>
      </div>

      {/* Pinned counters */}
      <div className="sticky top-0 z-10 flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/90 p-3 backdrop-blur">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
          <span className={cn(v.groupsDone === v.groupCount ? 'text-verdict-worth' : 'text-slate-400')}>
            {v.groupsDone} of {v.groupCount} groups done
          </span>
          <span className={cn(v.total === ELIMINATE_TARGET ? 'text-verdict-worth' : 'text-slate-400')}>
            {v.total} of {ELIMINATE_TARGET} eliminated
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={cn('h-full transition-all', v.valid ? 'bg-verdict-worth' : 'bg-verdict-must')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <GroupEliminationCard
            key={g.name}
            group={g}
            eliminated={eliminated}
            onToggle={onToggle}
            frozenSafe={frozenSafe}
          />
        ))}
      </div>
    </div>
  );
}
