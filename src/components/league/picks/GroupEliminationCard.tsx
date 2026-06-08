import { Check, X } from 'lucide-react';
import { teamFlag, teamRank } from '@/data/static';
import type { Group } from '@/logic/groups';
import { MAX_PER_GROUP } from '@/logic/survivors';
import { cn } from '../../cn';

/**
 * One group: tap teams to send home. 0 eliminated → incomplete prompt; 1 → valid
 * (can optionally pick a 2nd); 2 → maxed, the surviving pair shows "safe".
 * `frozenSafe` (global 16 reached) disables eliminating any more here.
 */
export function GroupEliminationCard({
  group,
  eliminated,
  onToggle,
  frozenSafe,
}: {
  group: Group;
  eliminated: Set<string>;
  onToggle: (team: string) => void;
  frozenSafe: boolean;
}) {
  const count = group.teams.filter((t) => eliminated.has(t)).length;
  const maxed = count >= MAX_PER_GROUP;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-slate-900/60',
        count === 0 ? 'border-dashed border-verdict-must/40' : 'border-slate-800',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-display text-sm font-bold uppercase tracking-wider text-slate-200">{group.name}</span>
        {count === 0 ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-verdict-must">pick ≥1</span>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{count} out</span>
        )}
      </div>
      <ul>
        {group.teams.map((team) => {
          const out = eliminated.has(team);
          // A surviving team can't be eliminated when the group is maxed or the
          // global 16 cap is reached; it shows as "safe".
          const safe = !out && (maxed || frozenSafe);
          const disabled = safe;
          return (
            <li key={team}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onToggle(team)}
                aria-pressed={out}
                aria-label={out ? `Keep ${team}` : `Eliminate ${team}`}
                className={cn(
                  'flex min-h-[40px] w-full items-center gap-2 border-t border-slate-800/70 px-3 py-1.5 text-left transition-colors',
                  out && 'bg-verdict-must/10',
                  !disabled && 'cursor-pointer hover:bg-slate-900',
                  disabled && 'cursor-not-allowed',
                )}
              >
                <span className="text-base leading-none" aria-hidden>{teamFlag(team)}</span>
                <span
                  className={cn(
                    'flex-1 truncate font-display text-sm font-semibold uppercase tracking-wide',
                    out && 'text-verdict-must line-through',
                    safe && 'text-verdict-worth/70',
                    !out && !safe && 'text-slate-200',
                  )}
                >
                  {team}
                </span>
                {teamRank(team) != null && <span className="nums text-[11px] text-slate-500">#{teamRank(team)}</span>}
                {out && <X className="h-3.5 w-3.5 text-verdict-must" aria-hidden />}
                {safe && <Check className="h-3.5 w-3.5 text-verdict-worth/70" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
