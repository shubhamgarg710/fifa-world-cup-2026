import type { Match } from '@/data/sources/types';
import { teamRank } from '@/data/static';
import { RECENT_WINDOW_HOURS } from '@/data/queries';
import { isMyTeamMatch, postmatchVerdict, type MyTeams, type Label } from '@/logic/verdict';
import { RecapCard } from './RecapCard';

const LABEL_RANK: Record<Label, number> = { 'must-watch': 0, 'worth-a-look': 1, skip: 2 };

export function sortRecent(matches: Match[], myTeams: MyTeams): Match[] {
  return [...matches].sort((a, b) => {
    const mA = isMyTeamMatch(a, myTeams) ? 0 : 1;
    const mB = isMyTeamMatch(b, myTeams) ? 0 : 1;
    if (mA !== mB) return mA - mB;
    const pendA = a.status !== 'finished' ? 1 : 0;
    const pendB = b.status !== 'finished' ? 1 : 0;
    // finished first, pending last
    if (pendA !== pendB) return pendA - pendB;
    if (a.status === 'finished' && b.status === 'finished') {
      const lA = LABEL_RANK[postmatchVerdict(a, myTeams, teamRank).label] ?? 9;
      const lB = LABEL_RANK[postmatchVerdict(b, myTeams, teamRank).label] ?? 9;
      if (lA !== lB) return lA - lB;
    }
    return new Date(b.kickoffUTC).getTime() - new Date(a.kickoffUTC).getTime();
  });
}

export function RecentSection({
  recent,
  myTeams,
  onOpen,
}: {
  recent: Match[];
  myTeams: MyTeams;
  onOpen: (m: Match) => void;
}) {
  if (recent.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center text-sm text-slate-400">
        No finished matches in the last {RECENT_WINDOW_HOURS} hours.
      </p>
    );
  }
  const sorted = sortRecent(recent, myTeams);
  return (
    <div className="flex flex-col gap-3">
      {sorted.map((m) => (
        <RecapCard key={m.id} match={m} myTeams={myTeams} onOpen={onOpen} />
      ))}
    </div>
  );
}
