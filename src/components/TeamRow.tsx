import { teamFlag } from '@/data/static';
import { displayTeamName, isPlaceholderTeam } from '@/data/static/placeholders';
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
  const isPlaceholder = isPlaceholderTeam(name);
  const label = isPlaceholder ? displayTeamName(name) : name;
  return (
    <div className={cn('flex items-center justify-between gap-3 py-1', dim && 'opacity-60')}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl leading-none" aria-hidden>
          {isPlaceholder ? '🏳️' : teamFlag(name)}
        </span>
        <span
          className={cn(
            'font-display text-lg font-semibold uppercase tracking-wide truncate',
            highlight && !isPlaceholder && 'text-gold',
            isPlaceholder && 'italic font-medium text-slate-400 normal-case tracking-normal',
          )}
        >
          {label}
        </span>
      </div>
      {score != null && (
        <span className="nums font-display text-3xl font-bold tabular-nums">{score}</span>
      )}
    </div>
  );
}
