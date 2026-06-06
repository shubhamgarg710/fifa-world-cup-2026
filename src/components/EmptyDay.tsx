import { formatLocalDateLabel } from '@/logic/time';
import { CalendarOff } from 'lucide-react';

export function EmptyDay({ nextMatchKickoffUTC }: { nextMatchKickoffUTC?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center">
      <CalendarOff className="mx-auto mb-2 h-6 w-6 text-slate-500" aria-hidden />
      <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-slate-200">
        No matches today
      </h3>
      {nextMatchKickoffUTC ? (
        <p className="mt-1 text-sm text-slate-400">
          Next match day: <span className="text-slate-200">{formatLocalDateLabel(nextMatchKickoffUTC)}</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-slate-400">Enjoy the rest day.</p>
      )}
    </div>
  );
}
