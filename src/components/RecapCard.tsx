import { teamRank } from '@/data/static';
import type { Match } from '@/data/sources/types';
import { postmatchVerdict, type MyTeams, myTeamsList } from '@/logic/verdict';
import { ResultPendingBadge } from './ResultPendingBadge';
import { TeamRow } from './TeamRow';
import { VerdictPill } from './VerdictPill';
import { cn } from './cn';

export function RecapCard({
  match,
  myTeams,
  onOpen,
}: {
  match: Match;
  myTeams: MyTeams;
  onOpen?: (match: Match) => void;
}) {
  const isPending = match.status === 'result_pending' || !match.score;
  const verdict = isPending ? null : postmatchVerdict(match, myTeams, teamRank);
  const mineSet = new Set(myTeamsList(myTeams));
  const t1Mine = mineSet.has(match.team1);
  const t2Mine = mineSet.has(match.team2);
  const isMine = t1Mine || t2Mine;
  const t1 = match.score?.ft[0];
  const t2 = match.score?.ft[1];
  const t1Lost = !isPending && t1 != null && t2 != null && t1 < t2;
  const t2Lost = !isPending && t1 != null && t2 != null && t2 < t1;

  const interactive = !isPending && onOpen;

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-slate-900/60 p-4 transition-colors',
        isMine ? 'border-gold/40 bg-gradient-to-br from-gold/5 to-transparent' : 'border-slate-800',
        interactive && 'cursor-pointer hover:bg-slate-900/90 active:bg-slate-900',
      )}
      onClick={interactive ? () => onOpen!(match) : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen!(match);
              }
            }
          : undefined
      }
    >
      {isMine && <span aria-hidden className="absolute left-0 top-0 h-full w-1 bg-gold" />}
      <header className="mb-2 flex items-center justify-between text-xs">
        <span className="font-display font-semibold uppercase tracking-wider text-slate-400">
          {match.round}
          {match.group && ` · ${match.group}`}
        </span>
        {isPending ? (
          <ResultPendingBadge />
        ) : verdict ? (
          <VerdictPill label={verdict.label} />
        ) : null}
      </header>
      <div>
        <TeamRow name={match.team1} score={isPending ? null : t1} highlight={t1Mine} dim={t1Lost} />
        <TeamRow name={match.team2} score={isPending ? null : t2} highlight={t2Mine} dim={t2Lost} />
      </div>
      {!isPending && verdict?.headline && (
        <footer className="mt-2 text-sm text-slate-300">{verdict.headline}</footer>
      )}
      {!isPending && match.score?.p && (
        <p className="mt-1 text-xs text-slate-400">
          On penalties {match.score.p[0]}–{match.score.p[1]}
        </p>
      )}
      {!isPending && !match.score?.p && match.score?.et && (
        <p className="mt-1 text-xs text-slate-400">After extra time</p>
      )}
    </article>
  );
}
