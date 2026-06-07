import { useMemo } from 'react';
import type { Match } from '@/data/sources/types';
import { deriveGroups } from '@/logic/groups';
import type { MyTeams } from '@/logic/verdict';
import { GroupCard } from './GroupCard';

export function GroupsSection({ matches, myTeams }: { matches: Match[]; myTeams: MyTeams }) {
  const groups = useMemo(() => deriveGroups(matches), [matches]);
  if (groups.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {groups.map((g) => (
        <GroupCard key={g.name} group={g} matches={matches} myTeams={myTeams} />
      ))}
    </div>
  );
}
