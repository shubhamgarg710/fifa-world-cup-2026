import { Hourglass } from 'lucide-react';

export function ResultPendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
      <Hourglass className="h-3 w-3" aria-hidden />
      Result pending
    </span>
  );
}
