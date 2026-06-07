import { teamFlag } from '@/data/static';
import { cn } from '../cn';

/** Selectable grid of team chips. Used for survivors (multi) and winner (single). */
export function TeamChipGrid({
  teams,
  selected,
  onToggle,
  disabled,
  isDisabledTeam,
  tone = 'positive',
}: {
  teams: string[];
  selected: Set<string>;
  onToggle: (team: string) => void;
  disabled?: boolean;
  /** Optional: a chip that is selectable=false (e.g. cap reached and not already selected). */
  isDisabledTeam?: (team: string) => boolean;
  /** positive = gold highlight (keep/advance); negative = red highlight (eliminate). */
  tone?: 'positive' | 'negative';
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {teams.map((team) => {
        const on = selected.has(team);
        const teamDisabled = disabled || (!on && isDisabledTeam?.(team));
        return (
          <button
            key={team}
            type="button"
            disabled={teamDisabled}
            onClick={() => onToggle(team)}
            aria-pressed={on}
            className={cn(
              'flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
              on && tone === 'positive' && 'border-gold/50 bg-gold/10',
              on && tone === 'negative' && 'border-verdict-must/50 bg-verdict-must/10',
              !on && 'border-slate-800 bg-slate-900/50 hover:bg-slate-900',
              teamDisabled && 'cursor-not-allowed opacity-40',
            )}
          >
            <span className="text-lg leading-none" aria-hidden>
              {teamFlag(team)}
            </span>
            <span
              className={cn(
                'truncate font-display text-sm font-semibold uppercase tracking-wide',
                on && tone === 'positive' && 'text-gold',
                on && tone === 'negative' && 'text-verdict-must',
              )}
            >
              {team}
            </span>
          </button>
        );
      })}
    </div>
  );
}
