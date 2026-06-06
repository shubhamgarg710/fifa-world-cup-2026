import { teamFlag } from '@/data/static';
import { cn } from './cn';

export function TeamRow({
  name,
  score,
  highlight,
  dim,
}: {
  name: string;
  score?: number | null;
  highlight?: boolean;
  /** Dim losing side in finished matches. */
  dim?: boolean;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-1', dim && 'opacity-60')}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl leading-none" aria-hidden>
          {teamFlag(name)}
        </span>
        <span
          className={cn(
            'font-display text-lg font-semibold uppercase tracking-wide truncate',
            highlight && 'text-gold',
          )}
        >
          {name}
        </span>
      </div>
      {score != null && (
        <span className="nums font-display text-3xl font-bold tabular-nums">{score}</span>
      )}
    </div>
  );
}
