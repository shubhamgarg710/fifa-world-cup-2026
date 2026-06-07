import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { teamFlag, teamRank } from '@/data/static';
import { groupFixtures, type Group } from '@/logic/groups';
import { formatLocalKickoff, formatLocalDateLabel } from '@/logic/time';
import { myTeamsList, type MyTeams } from '@/logic/verdict';
import { cn } from './cn';

export function GroupCard({
  group,
  matches,
  myTeams,
  onOpenTeam,
}: {
  group: Group;
  matches: Match[];
  myTeams: MyTeams;
  onOpenTeam: (team: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const mine = new Set(myTeamsList(myTeams));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5 transition-colors hover:bg-slate-900"
      >
        <span className="font-display text-sm font-bold uppercase tracking-wider text-slate-200">
          {group.name}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      <ul>
        {group.teams.map((team) => {
          const followed = mine.has(team);
          return (
            <li key={team}>
              <button
                type="button"
                onClick={() => onOpenTeam(team)}
                aria-label={`View ${team}`}
                className="flex min-h-[40px] w-full cursor-pointer items-center gap-2 border-t border-slate-800/70 px-3 py-1.5 text-left transition-colors hover:bg-slate-900"
              >
                <span className="text-base leading-none" aria-hidden>{teamFlag(team)}</span>
                <span className={cn('flex-1 truncate font-display text-sm font-semibold uppercase tracking-wide', followed && 'text-gold')}>
                  {team}
                </span>
                {teamRank(team) != null && (
                  <span className="nums text-[11px] text-slate-500">#{teamRank(team)}</span>
                )}
                {followed && <Check className="h-3.5 w-3.5 text-gold" aria-hidden />}
              </button>
            </li>
          );
        })}
      </ul>

      {open && (
        <div className="border-t border-slate-800 bg-slate-950/40 px-3 py-2">
          {groupFixtures(matches, group.name).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 py-1 text-xs">
              <span className="min-w-0 flex-1 truncate text-slate-300">
                {m.team1} <span className="text-slate-600">v</span> {m.team2}
              </span>
              <span className="nums shrink-0 text-slate-500">
                {formatLocalDateLabel(m.kickoffUTC)} · {formatLocalKickoff(m.kickoffUTC)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
