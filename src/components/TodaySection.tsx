import type { Match } from '@/data/sources/types';
import { teamRank } from '@/data/static';
import { isMyTeamMatch, prematchWatchability, type MyTeams } from '@/logic/verdict';
import { EmptyDay } from './EmptyDay';
import { FixtureCard } from './FixtureCard';
import { RecapCard } from './RecapCard';

const TIER_RANK: Record<string, number> = { 'must-watch': 0, high: 1, normal: 2 };

export function sortToday(matches: Match[], myTeams: MyTeams): Match[] {
  return [...matches].sort((a, b) => {
    const mA = isMyTeamMatch(a, myTeams) ? 0 : 1;
    const mB = isMyTeamMatch(b, myTeams) ? 0 : 1;
    if (mA !== mB) return mA - mB;
    // upcoming first, finished/pending after
    const pA = a.status === 'scheduled' ? 0 : 1;
    const pB = b.status === 'scheduled' ? 0 : 1;
    if (pA !== pB) return pA - pB;
    const tA = TIER_RANK[prematchWatchability(a, myTeams, teamRank).tier] ?? 9;
    const tB = TIER_RANK[prematchWatchability(b, myTeams, teamRank).tier] ?? 9;
    if (tA !== tB) return tA - tB;
    return new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime();
  });
}

export function TodaySection({
  today,
  myTeams,
  nextKickoffUTC,
  onOpenMatch,
}: {
  today: Match[];
  myTeams: MyTeams;
  nextKickoffUTC?: string;
  onOpenMatch: (m: Match) => void;
}) {
  if (today.length === 0) return <EmptyDay nextMatchKickoffUTC={nextKickoffUTC} />;
  const sorted = sortToday(today, myTeams);
  return (
    <div className="flex flex-col gap-3">
      {sorted.map((m) =>
        m.status === 'scheduled' ? (
          <FixtureCard key={m.id} match={m} myTeams={myTeams} />
        ) : (
          <RecapCard key={m.id} match={m} myTeams={myTeams} onOpen={onOpenMatch} />
        ),
      )}
    </div>
  );
}
