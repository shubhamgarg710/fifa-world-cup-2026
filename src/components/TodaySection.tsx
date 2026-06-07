import type { Match } from '@/data/sources/types';
import { isMyTeamMatch, type MyTeams } from '@/logic/verdict';
import { EmptyDay } from './EmptyDay';
import { FixtureCard } from './FixtureCard';
import { RecapCard } from './RecapCard';

/**
 * My-team-first, then strict chronological. The gold accent + watchability
 * badge already announce importance — reshuffling time order works against
 * planning the evening.
 */
export function sortToday(matches: Match[], myTeams: MyTeams): Match[] {
  return [...matches].sort((a, b) => {
    const mA = isMyTeamMatch(a, myTeams) ? 0 : 1;
    const mB = isMyTeamMatch(b, myTeams) ? 0 : 1;
    if (mA !== mB) return mA - mB;
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
