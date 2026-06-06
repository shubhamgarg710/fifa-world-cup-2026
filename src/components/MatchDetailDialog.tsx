import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { Match } from '@/data/sources/types';
import { teamFlag } from '@/data/static';
import { useMyTeams } from '@/state/preferences';
import { teamRank } from '@/data/static';
import { postmatchVerdict, type MyTeams, myTeamsList } from '@/logic/verdict';
import { GoalTimeline } from './GoalTimeline';
import { HighlightsButton } from './HighlightsButton';
import { VerdictPill } from './VerdictPill';
import { cn } from './cn';

export function MatchDetailDialog({
  match,
  open,
  onOpenChange,
}: {
  match: Match | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const myTeams = useMyTeams();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl border border-slate-800 bg-slate-950 shadow-2xl',
            'sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl',
          )}
        >
          {match && <DialogBody match={match} myTeams={myTeams} />}
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

function DialogBody({ match, myTeams }: { match: Match; myTeams: MyTeams }) {
  const verdict = match.score ? postmatchVerdict(match, myTeams, teamRank) : null;
  const mineSet = new Set(myTeamsList(myTeams));
  const t1 = match.score?.ft[0];
  const t2 = match.score?.ft[1];
  const t1Lost = t1 != null && t2 != null && t1 < t2;
  const t2Lost = t1 != null && t2 != null && t2 < t1;
  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-5 py-6 sm:px-7">
      {/* drag handle for mobile bottom-sheet */}
      <div aria-hidden className="mx-auto -mt-2 mb-1 h-1.5 w-12 rounded-full bg-slate-700 sm:hidden" />
      <Dialog.Title asChild>
        <h2 className="font-display text-xs font-semibold uppercase tracking-widest text-slate-400">
          {match.round}
          {match.group && ` · ${match.group}`} · {match.ground}
        </h2>
      </Dialog.Title>
      <Dialog.Description className="sr-only">Match details and highlights link</Dialog.Description>

      <div className="flex items-center justify-between gap-4">
        <TeamBlock name={match.team1} score={t1} dim={t1Lost} mine={mineSet.has(match.team1)} />
        <span className="font-display text-2xl font-bold text-slate-500">vs</span>
        <TeamBlock name={match.team2} score={t2} dim={t2Lost} mine={mineSet.has(match.team2)} alignRight />
      </div>

      {match.score?.p && (
        <p className="text-center text-sm text-slate-400">
          On penalties {match.score.p[0]}–{match.score.p[1]}
        </p>
      )}
      {!match.score?.p && match.score?.et && (
        <p className="text-center text-sm text-slate-400">After extra time</p>
      )}

      {verdict && (
        <div className="flex flex-col items-center gap-1">
          <VerdictPill label={verdict.label} />
          {verdict.headline && <p className="text-center text-sm text-slate-300">{verdict.headline}</p>}
        </div>
      )}

      {match.score ? (
        <section>
          <h3 className="mb-2 font-display text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Goal timeline
          </h3>
          <GoalTimeline match={match} />
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center text-sm text-slate-400">
          This match hasn't been played yet.
        </p>
      )}

      <HighlightsButton match={match} />
    </div>
  );
}

function TeamBlock({
  name,
  score,
  dim,
  mine,
  alignRight,
}: {
  name: string;
  score?: number;
  dim?: boolean;
  mine?: boolean;
  alignRight?: boolean;
}) {
  return (
    <div className={cn('flex flex-1 flex-col gap-1', alignRight && 'items-end', dim && 'opacity-60')}>
      <span className="text-3xl leading-none" aria-hidden>
        {teamFlag(name)}
      </span>
      <span
        className={cn(
          'font-display text-base font-bold uppercase tracking-wide',
          mine && 'text-gold',
        )}
      >
        {name}
      </span>
      {score != null && (
        <span className="nums font-display text-5xl font-bold tabular-nums text-slate-50">{score}</span>
      )}
    </div>
  );
}
