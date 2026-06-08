import { Check } from 'lucide-react';
import { cn } from '../../cn';

export type StepMeta = { label: string; complete: boolean };

/**
 * Horizontal step indicator. Completed steps show a check and are tappable to
 * jump back; the current step is accent-filled; future steps are greyed/locked.
 */
export function StepProgress({
  steps,
  current,
  onJump,
}: {
  steps: StepMeta[];
  current: number; // index, or steps.length for the review screen
  onJump: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1.5">
      {steps.map((s, i) => {
        const isCurrent = i === current;
        const tappable = s.complete || i < current;
        return (
          <li key={s.label} className="flex flex-1 flex-col items-center gap-1">
            <button
              type="button"
              disabled={!tappable}
              onClick={() => tappable && onJump(i)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-colors',
                isCurrent && 'border-verdict-must bg-verdict-must text-white',
                !isCurrent && s.complete && 'cursor-pointer border-verdict-worth/60 bg-verdict-worth/15 text-verdict-worth hover:bg-verdict-worth/25',
                !isCurrent && !s.complete && 'border-slate-700 bg-slate-900 text-slate-500',
                tappable && !isCurrent && 'cursor-pointer',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {s.complete && !isCurrent ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </button>
            <span className={cn('text-[10px] font-semibold uppercase tracking-wide', isCurrent ? 'text-slate-200' : 'text-slate-500')}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
