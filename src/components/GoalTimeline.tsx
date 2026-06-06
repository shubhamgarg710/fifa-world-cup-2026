import type { GoalEntry, Match } from '@/data/sources/types';
import { teamFlag } from '@/data/static';
import { cn } from './cn';

type Entry = {
  /** Display minute, e.g. "67'" or "90+5'". */
  display: string;
  sortKey: number;
  for: 'team1' | 'team2';
  scorer: string;
  isOG: boolean;
  isPen: boolean;
  /** Always true once we're past minute 90. */
  inExtraTime: boolean;
};

export function buildTimeline(goals1: GoalEntry[] = [], goals2: GoalEntry[] = []): Entry[] {
  const all: Entry[] = [];
  const push = (g: GoalEntry, source: 'team1' | 'team2') => {
    const attributedTo: 'team1' | 'team2' = g.owngoal
      ? source === 'team1'
        ? 'team2'
        : 'team1'
      : source;
    const display = g.offset ? `${g.minute}+${g.offset}'` : `${g.minute}'`;
    all.push({
      display,
      sortKey: g.minute + (g.offset ?? 0),
      for: attributedTo,
      scorer: g.name,
      isOG: !!g.owngoal,
      isPen: !!g.penalty,
      inExtraTime: g.minute > 90,
    });
  };
  for (const g of goals1) push(g, 'team1');
  for (const g of goals2) push(g, 'team2');
  all.sort((a, b) => a.sortKey - b.sortKey);
  return all;
}

export function GoalTimeline({ match }: { match: Match }) {
  const entries = buildTimeline(match.goals1, match.goals2);
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center text-sm text-slate-400">
        No goals.
      </p>
    );
  }
  const showETDivider = entries.some((e) => e.inExtraTime);
  let dividerPlaced = false;
  return (
    <ol className="relative flex flex-col gap-2 pl-0">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-slate-800"
      />
      {entries.map((e, idx) => {
        const insertDivider = showETDivider && e.inExtraTime && !dividerPlaced;
        if (insertDivider) dividerPlaced = true;
        return (
          <div key={`${idx}-${e.sortKey}-${e.scorer}`}>
            {insertDivider && (
              <li className="my-2 flex items-center justify-center gap-2">
                <span className="h-px flex-1 bg-slate-800" aria-hidden />
                <span className="font-display text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Extra time
                </span>
                <span className="h-px flex-1 bg-slate-800" aria-hidden />
              </li>
            )}
            <TimelineRow entry={e} match={match} />
          </div>
        );
      })}
    </ol>
  );
}

function TimelineRow({ entry, match }: { entry: Entry; match: Match }) {
  const isLeft = entry.for === 'team1';
  const teamName = isLeft ? match.team1 : match.team2;
  return (
    <li
      className={cn(
        'flex items-center gap-3',
        isLeft ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      <div className={cn('flex-1', isLeft ? 'pr-3 text-right' : 'pl-3 text-left')}>
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate-100">
          <span aria-hidden className="mr-1.5">{teamFlag(teamName)}</span>
          {entry.scorer}
          {entry.isOG && <span className="ml-1.5 text-[10px] font-bold uppercase text-verdict-must">OG</span>}
          {entry.isPen && <span className="ml-1.5 text-[10px] font-bold uppercase text-gold">PEN</span>}
        </p>
      </div>
      <span className="nums inline-flex h-7 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 font-display text-[11px] font-bold text-slate-200">
        {entry.display}
      </span>
      <div className="flex-1" />
    </li>
  );
}
