import { CalendarClock } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { nextLock, stageDef } from '@/logic/leagueStages';
import { formatLocalDateLabel, formatLocalKickoff, relativeCountdown } from '@/logic/time';

/** Countdown to the next pick lock (P1.2). Renders nothing if all stages are locked. */
export function DeadlineBanner({ matches }: { matches: Match[] }) {
  const now = new Date();
  const next = nextLock(matches, now);
  if (!next) return null;
  const label = stageDef(next.stage).label;
  const countdown = relativeCountdown(next.deadlineUTC, now);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <CalendarClock className="h-5 w-5 shrink-0 text-gold" aria-hidden />
      <div className="min-w-0 text-sm">
        <span className="font-display font-semibold uppercase tracking-wide text-slate-100">
          {label} picks lock {countdown ?? 'soon'}
        </span>
        <p className="text-[11px] text-slate-400">
          {formatLocalDateLabel(next.deadlineUTC)} · {formatLocalKickoff(next.deadlineUTC)}
        </p>
      </div>
    </div>
  );
}
