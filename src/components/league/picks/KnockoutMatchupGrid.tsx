import { Check } from 'lucide-react';
import { teamFlag } from '@/data/static';
import type { StageMatchup } from '@/logic/leagueStages';
import { formatLocalDateLabel, formatLocalKickoff } from '@/logic/time';
import { cn } from '../../cn';

/** One tappable side of a tie. */
function Side({
  team,
  picked,
  dim,
  align,
  disabled,
  onClick,
}: {
  team: string;
  picked: boolean;
  dim: boolean;
  align: 'left' | 'right';
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={picked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60',
        align === 'right' && 'flex-row-reverse text-right',
        picked ? 'border-gold/60 bg-gold/10' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900',
        dim && 'opacity-50',
        disabled && 'cursor-not-allowed',
      )}
    >
      <span className="text-xl leading-none" aria-hidden>
        {teamFlag(team)}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate font-display text-sm font-semibold uppercase tracking-wide',
          picked ? 'text-gold' : 'text-slate-200',
        )}
      >
        {team}
      </span>
      {picked && <Check className="h-4 w-4 shrink-0 text-gold" aria-hidden />}
    </button>
  );
}

/**
 * Matchwise knockout picker: one card per resolved tie. Tap the team you think
 * advances (one winner per tie); tap it again to clear. Selection is reported
 * via `onPick(team, sibling)` so the caller can drop the other side of the tie.
 */
export function KnockoutMatchupGrid({
  matchups,
  selected,
  onPick,
  disabled,
}: {
  matchups: StageMatchup[];
  selected: Set<string>;
  onPick: (team: string, sibling: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {matchups.map((m) => {
        const aPicked = selected.has(m.team1);
        const bPicked = selected.has(m.team2);
        const decided = aPicked || bPicked;
        return (
          <div
            key={`${m.team1}-${m.team2}`}
            role="radiogroup"
            aria-label={`${m.team1} versus ${m.team2}`}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-2"
          >
            <div className="flex items-center gap-2">
              <Side
                team={m.team1}
                picked={aPicked}
                dim={decided && !aPicked}
                align="left"
                disabled={disabled}
                onClick={() => onPick(m.team1, m.team2)}
              />
              <span className="shrink-0 px-0.5 font-display text-[11px] font-bold uppercase tracking-wider text-slate-500">
                vs
              </span>
              <Side
                team={m.team2}
                picked={bPicked}
                dim={decided && !bPicked}
                align="right"
                disabled={disabled}
                onClick={() => onPick(m.team2, m.team1)}
              />
            </div>
            <p className="mt-1 text-center text-[10px] text-slate-500">
              {formatLocalDateLabel(m.kickoffUTC)} · {formatLocalKickoff(m.kickoffUTC)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
