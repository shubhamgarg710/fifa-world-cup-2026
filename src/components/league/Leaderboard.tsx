import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import type { Member } from '@/data/league/types';
import { AWARDS } from '@/data/static/awards';
import { rankMembers } from '@/logic/leagueScore';
import { cn } from '../cn';

export function Leaderboard({
  members,
  matches,
  meId,
  loading,
}: {
  members: Member[];
  matches: Match[];
  meId: string;
  loading: boolean;
}) {
  const ranked = useMemo(() => rankMembers(members, matches, AWARDS), [members, matches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center text-sm text-slate-400">
        No members yet. Share the code to get friends in.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {ranked.map((row, i) => {
        const isMe = row.member.id === meId;
        return (
          <li
            key={row.member.id}
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-4 py-3',
              isMe ? 'border-gold/40 bg-gradient-to-br from-gold/10 to-transparent' : 'border-slate-800 bg-slate-900/60',
            )}
          >
            <span className="nums w-6 text-center font-display text-lg font-bold text-slate-400">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <span className={cn('truncate font-display text-lg font-semibold uppercase tracking-wide', isMe && 'text-gold')}>
                {row.member.display_name}
              </span>
              <p className="text-[11px] text-slate-500">
                {row.breakdown.winner > 0 && 'winner ✓ '}
                {row.breakdown.goldenBoot > 0 && 'boot ✓ '}
                {row.breakdown.goldenBall > 0 && 'ball ✓ '}
                {row.breakdown.stages.reduce((n, s) => n + s.hits, 0)} advancement hits
              </p>
            </div>
            <span className="nums font-display text-2xl font-bold tabular-nums text-slate-50">{row.total}</span>
          </li>
        );
      })}
    </ol>
  );
}
