import { Trophy } from 'lucide-react';
import { teamFlag, teamRank } from '@/data/static';
import type { Group } from '@/logic/groups';
import { cn } from '../../cn';

/** Step 2: single-select the tournament winner, grouped by group. */
export function WinnerStep({
  groups,
  winner,
  onSelect,
}: {
  groups: Group[];
  winner: string | null;
  onSelect: (team: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-50 leading-none">
          Who lifts the trophy?
        </h2>
        <p className="mt-1 text-sm text-slate-400">Pick one — worth the most points (100).</p>
      </div>
      {groups.map((g) => (
        <section key={g.name}>
          <h3 className="mb-1.5 font-display text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {g.name}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {g.teams.map((team) => {
              const on = winner === team;
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => onSelect(team)}
                  aria-pressed={on}
                  className={cn(
                    'flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
                    on ? 'border-gold/50 bg-gold/10' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900',
                  )}
                >
                  <span className="text-lg leading-none" aria-hidden>{teamFlag(team)}</span>
                  <span className={cn('flex-1 truncate font-display text-sm font-semibold uppercase tracking-wide', on && 'text-gold')}>
                    {team}
                  </span>
                  {teamRank(team) != null && <span className="nums text-[11px] text-slate-500">#{teamRank(team)}</span>}
                  {on && <Trophy className="h-3.5 w-3.5 text-gold" aria-hidden />}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
