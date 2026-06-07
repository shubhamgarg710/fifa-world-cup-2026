import { Goal } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { topScorers } from '@/logic/goldenBoot';

/** Live Golden Boot leader(s) from current goal data (P1.3). Hidden until goals exist. */
export function BootLeader({ matches }: { matches: Match[] }) {
  const { names, goals } = topScorers(matches);
  if (names.length === 0 || goals === 0) return null;
  const label =
    names.length === 1
      ? names[0]
      : names.length <= 3
        ? names.join(', ')
        : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <Goal className="h-5 w-5 shrink-0 text-verdict-worth" aria-hidden />
      <div className="min-w-0 text-sm">
        <span className="font-display font-semibold uppercase tracking-wide text-slate-100">
          Golden Boot leader{names.length > 1 ? 's' : ''}
        </span>
        <p className="truncate text-[11px] text-slate-400">
          {label} — {goals} goal{goals === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}
