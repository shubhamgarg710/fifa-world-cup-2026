import * as Dialog from '@radix-ui/react-dialog';
import { Heart, Eye, X } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { teamFlag, teamMeta, teamRank } from '@/data/static';
import { teamFixtures, teamGroup } from '@/logic/groups';
import { formatLocalDateLabel, formatLocalKickoff } from '@/logic/time';
import { myTeamsList } from '@/logic/verdict';
import { toggleTeam, useMyTeams } from '@/state/preferences';
import { cn } from './cn';

export function TeamSheet({
  team,
  matches,
  open,
  onOpenChange,
}: {
  team: string | null;
  matches: Match[];
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const myTeams = useMyTeams();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl border border-slate-800 bg-slate-950 shadow-2xl',
            'sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl',
          )}
        >
          {team && <Body team={team} matches={matches} myTeams={myTeams} />}
          <Dialog.Close
            className="absolute right-3 top-3 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 text-slate-300 transition-colors hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Body({ team, matches, myTeams }: { team: string; matches: Match[]; myTeams: ReturnType<typeof useMyTeams> }) {
  const rank = teamRank(team);
  const meta = teamMeta(team);
  const group = teamGroup(matches, team);
  const fixtures = teamFixtures(matches, team);
  const mine = new Set(myTeamsList(myTeams));
  const supporting = myTeams.support.includes(team);
  const following = myTeams.follow.includes(team);

  const meta_bits = [rank != null ? `#${rank}` : null, meta?.confederation, group]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-5 py-6 sm:px-7">
      <div aria-hidden className="mx-auto -mt-2 mb-1 h-1.5 w-12 rounded-full bg-slate-700 sm:hidden" />

      <div className="flex items-center gap-3">
        <span className="text-4xl leading-none" aria-hidden>{teamFlag(team)}</span>
        <div>
          <Dialog.Title asChild>
            <h2 className={cn('font-display text-2xl font-bold uppercase tracking-wide', mine.has(team) ? 'text-gold' : 'text-slate-50')}>
              {team}
            </h2>
          </Dialog.Title>
          {meta_bits && <p className="text-xs uppercase tracking-wider text-slate-400">{meta_bits}</p>}
        </div>
      </div>
      <Dialog.Description className="sr-only">Team fixtures and follow options</Dialog.Description>

      <div className="flex gap-2">
        <ToggleButton
          active={following}
          onClick={() => toggleTeam(team, 'follow')}
          icon={<Eye className="h-4 w-4" aria-hidden />}
          label={following ? 'Following' : 'Follow'}
        />
        <ToggleButton
          active={supporting}
          onClick={() => toggleTeam(team, 'support')}
          icon={<Heart className="h-4 w-4" aria-hidden />}
          label={supporting ? 'Supporting' : 'Support'}
        />
      </div>

      <section>
        <h3 className="mb-2 font-display text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Fixtures
        </h3>
        {fixtures.length === 0 ? (
          <p className="text-sm text-slate-500">No fixtures scheduled yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {fixtures.map((m) => {
              const opponent = m.team1 === team ? m.team2 : m.team1;
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-slate-200">
                    <span className="text-slate-500">v</span> {opponent}
                    <span className="ml-1" aria-hidden>{teamFlag(opponent)}</span>
                  </span>
                  <span className="nums shrink-0 text-xs text-slate-500">
                    {formatLocalDateLabel(m.kickoffUTC)} · {formatLocalKickoff(m.kickoffUTC)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-slate-600">Squad lists aren't available yet — fixtures only for now.</p>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide transition-colors active:scale-[0.98]',
        active
          ? 'border-gold/50 bg-gold/15 text-gold'
          : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
