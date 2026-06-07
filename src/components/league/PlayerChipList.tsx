import { teamFlag } from '@/data/static';
import type { AwardCandidate } from '@/data/static/awards';
import { cn } from '../cn';

/** Single-select list of award candidate players. */
export function PlayerChipList({
  candidates,
  selected,
  onSelect,
  disabled,
}: {
  candidates: AwardCandidate[];
  selected: string | null;
  onSelect: (name: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {candidates.map((c) => {
        const on = selected === c.name;
        return (
          <button
            key={c.name}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(c.name)}
            aria-pressed={on}
            className={cn(
              'flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors',
              on ? 'border-gold/50 bg-gold/10' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <span className="text-lg leading-none" aria-hidden>
              {teamFlag(c.team)}
            </span>
            <span className="min-w-0">
              <span className={cn('block truncate font-display text-sm font-semibold', on && 'text-gold')}>
                {c.name}
              </span>
              <span className="block truncate text-[11px] text-slate-500">{c.team}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
