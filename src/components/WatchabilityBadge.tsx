import type { Tier } from '@/logic/verdict';
import { Flame, Star } from 'lucide-react';
import { cn } from './cn';

export function WatchabilityBadge({
  tier,
  reasons,
  className,
}: {
  tier: Tier;
  reasons: string[];
  className?: string;
}) {
  if (tier === 'normal') return null;
  const headline = reasons[0] ?? '';
  if (tier === 'must-watch') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-verdict-must/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-verdict-must',
          className,
        )}
        title={reasons.join(' · ')}
      >
        <Flame className="h-3 w-3" aria-hidden />
        {headline || 'Must watch'}
      </span>
    );
  }
  // high
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold',
        className,
      )}
      title={reasons.join(' · ')}
    >
      <Star className="h-3 w-3" aria-hidden />
      {headline || 'Worth planning around'}
    </span>
  );
}
